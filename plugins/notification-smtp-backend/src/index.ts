import {
  createBackendPlugin,
  type NotificationStrategy,
  Versioned,
  secret,
} from "@checkmate/backend-api";
import { notificationStrategyExtensionPoint } from "@checkmate/notification-backend";
import { z } from "zod";
import { createTransport, type Transporter } from "nodemailer";
import { pluginMetadata } from "./plugin-metadata";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMTP Configuration Schema
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * SMTP configuration schema with versioning support.
 * Uses secret() for sensitive fields.
 */
const smtpConfigSchemaV1 = z.object({
  host: z.string().optional().describe("SMTP server hostname"),
  port: z.number().default(587).describe("SMTP server port"),
  secure: z.boolean().default(false).describe("Use TLS/SSL (port 465)"),
  username: secret().optional().describe("SMTP username"),
  password: secret().optional().describe("SMTP password"),
  fromAddress: z.string().email().optional().describe("Sender email address"),
  fromName: z.string().optional().describe("Sender display name"),
});

type SmtpConfig = z.infer<typeof smtpConfigSchemaV1>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Template Rendering
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface NotificationContent {
  title: string;
  description?: string;
  importance: "info" | "warning" | "critical";
  actionUrl?: string;
}

/**
 * Render a notification as HTML email.
 */
function renderNotificationEmail(notification: NotificationContent): string {
  const importanceColors = {
    info: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
  };

  const color = importanceColors[notification.importance];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: ${color}; color: white; padding: 16px 20px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .body { padding: 20px; }
    .body p { margin: 0 0 16px 0; color: #374151; line-height: 1.6; }
    .button { display: inline-block; background: ${color}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; }
    .footer { padding: 16px 20px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>${escapeHtml(notification.title)}</h1>
      </div>
      <div class="body">
        ${
          notification.description
            ? `<p>${escapeHtml(notification.description)}</p>`
            : ""
        }
        ${
          notification.actionUrl
            ? `<a href="${escapeHtml(
                notification.actionUrl
              )}" class="button">View Details</a>`
            : ""
        }
      </div>
      <div class="footer">
        This is an automated notification from Checkmate.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Simple HTML escaping for security.
 */
function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMTP Strategy Implementation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const smtpStrategy: NotificationStrategy<SmtpConfig> = {
  id: "smtp",
  displayName: "Email (SMTP)",
  description: "Send notifications via email using SMTP",
  icon: "mail",

  config: new Versioned({
    version: 1,
    schema: smtpConfigSchemaV1,
  }),

  contactResolution: { type: "auth-email" },

  async send({ contact, notification, strategyConfig }) {
    // Validate required config
    if (!strategyConfig.host || !strategyConfig.fromAddress) {
      return {
        success: false,
        error: "SMTP is not configured. Please configure host and fromAddress.",
      };
    }

    // Create transporter
    const transporter: Transporter = createTransport({
      host: strategyConfig.host,
      port: strategyConfig.port,
      secure: strategyConfig.secure,
      auth: strategyConfig.username
        ? {
            user: strategyConfig.username,
            pass: strategyConfig.password,
          }
        : undefined,
    });

    // Construct sender field
    const from = strategyConfig.fromName
      ? `"${strategyConfig.fromName}" <${strategyConfig.fromAddress}>`
      : strategyConfig.fromAddress;

    try {
      const result = await transporter.sendMail({
        from,
        to: contact,
        subject: notification.title,
        text: notification.description ?? notification.title,
        html: renderNotificationEmail({
          title: notification.title,
          description: notification.description,
          importance: notification.importance,
          actionUrl: notification.actionUrl,
        }),
      });

      return {
        success: true,
        externalId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Plugin Definition
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default createBackendPlugin({
  metadata: pluginMetadata,

  register(env) {
    // Get the notification strategy extension point
    const extensionPoint = env.getExtensionPoint(
      notificationStrategyExtensionPoint
    );

    // Register the SMTP strategy with our plugin metadata
    extensionPoint.addStrategy(smtpStrategy, pluginMetadata);
  },
});
