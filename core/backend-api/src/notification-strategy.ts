import type { Versioned, VersionedRecord } from "./config-versioning";
import type { PluginMetadata } from "@checkmate/common";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Contact Resolution Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Defines how a notification strategy resolves user contact information.
 */
export type NotificationContactResolution =
  | { type: "auth-email" } // Uses user.email from auth system
  | { type: "auth-provider"; provider: string } // Uses email from specific OAuth provider
  | { type: "user-config"; field: string } // User provides via settings form (e.g., phone number)
  | { type: "oauth-link" } // Requires OAuth flow (Slack, Discord)
  | { type: "custom" }; // Strategy handles resolution entirely

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Payload and Result Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * The notification content to send via external channel.
 */
export interface NotificationPayload {
  /** Notification title/subject */
  title: string;
  /** Notification body/description */
  description?: string;
  /** Importance level for visual differentiation */
  importance: "info" | "warning" | "critical";
  /** Optional deep link URL */
  actionUrl?: string;
  /**
   * Source type identifier for filtering and templates.
   * Examples: "password-reset", "healthcheck.alert", "maintenance.reminder"
   */
  type: string;
}

/**
 * Result of sending a notification.
 */
export interface NotificationDeliveryResult {
  /** Whether the notification was sent successfully */
  success: boolean;
  /** Strategy-specific external message ID for tracking */
  externalId?: string;
  /** Error message if send failed */
  error?: string;
  /** For rate limiting or retry logic (milliseconds) */
  retryAfterMs?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Send Context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Context passed to the strategy's send() method.
 */
export interface NotificationSendContext<TConfig, TUserConfig = undefined> {
  /** Full user identity from auth system */
  user: {
    userId: string;
    email?: string;
    displayName?: string;
  };
  /** Resolved contact for this channel (email, phone, slack user ID, etc.) */
  contact: string;
  /** The notification content to send */
  notification: NotificationPayload;
  /** Admin-configured strategy settings (global) */
  strategyConfig: TConfig;
  /** User-specific settings (if userConfig schema is defined) */
  userConfig: TUserConfig | undefined;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Strategy Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Represents a notification delivery strategy (e.g., SMTP, Slack, Discord).
 *
 * Strategies are registered via the `notificationStrategyExtensionPoint` and
 * are namespaced by their owning plugin's ID to prevent conflicts.
 *
 * @example
 * ```typescript
 * const smtpStrategy: NotificationStrategy<SmtpConfig> = {
 *   id: 'smtp',
 *   displayName: 'Email (SMTP)',
 *   icon: 'mail',
 *   config: new Versioned({ version: 1, schema: smtpConfigSchema }),
 *   contactResolution: { type: 'auth-email' },
 *   async send({ contact, notification, strategyConfig }) {
 *     await sendEmail({ to: contact, subject: notification.title, ... });
 *     return { success: true };
 *   }
 * };
 * ```
 */
export interface NotificationStrategy<
  TConfig = unknown,
  TUserConfig = undefined
> {
  /**
   * Unique identifier within the owning plugin's namespace.
   * Will be qualified as `{pluginId}.{id}` at runtime.
   * Example: 'smtp' becomes 'notification-smtp.smtp'
   */
  id: string;

  /** Display name shown in UI */
  displayName: string;

  /** Optional description of the channel */
  description?: string;

  /** Lucide icon name (e.g., 'mail', 'slack', 'message-circle') */
  icon?: string;

  /**
   * Global strategy configuration (admin-managed).
   * Uses Versioned<T> for schema evolution and migration support.
   */
  config: Versioned<TConfig>;

  /**
   * Per-user configuration schema (if users need to provide info).
   *
   * Examples:
   * - SMTP: undefined (uses auth email, no user config needed)
   * - SMS: new Versioned({ schema: z.object({ phoneNumber: z.string() }) })
   * - Slack: undefined (uses OAuth linking)
   */
  userConfig?: Versioned<TUserConfig>;

  /**
   * How this strategy resolves user contact information.
   */
  contactResolution: NotificationContactResolution;

  /**
   * Send a notification via this channel.
   *
   * @param context - Send context with user, contact, notification, and config
   * @returns Result indicating success/failure
   */
  send(
    context: NotificationSendContext<TConfig, TUserConfig>
  ): Promise<NotificationDeliveryResult>;

  /**
   * Optional: Custom OAuth or redirect-based linking flow.
   * Return a URL to redirect the user to for linking their account.
   *
   * Used for strategies like Slack or Discord where users need to
   * authorize the platform to send them messages.
   *
   * @param userId - The platform user ID
   * @param returnUrl - URL to redirect back to after OAuth completes
   * @returns URL to redirect user to, or undefined if not applicable
   */
  getOAuthLinkUrl?(
    userId: string,
    returnUrl: string
  ): Promise<string | undefined>;

  /**
   * Optional: Handle OAuth callback to complete linking.
   *
   * Called when the user returns from the OAuth provider. The strategy
   * should validate the callback, exchange tokens, and store the
   * external user ID for future notifications.
   *
   * @param userId - The platform user ID
   * @param params - Query parameters from the OAuth callback
   * @returns Result indicating success/failure
   */
  handleOAuthCallback?(
    userId: string,
    params: Record<string, string>
  ): Promise<{ success: boolean; error?: string }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Registry Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Registered strategy with full namespace information.
 */
export interface RegisteredNotificationStrategy<
  TConfig = unknown,
  TUserConfig = undefined
> extends NotificationStrategy<TConfig, TUserConfig> {
  /** Fully qualified ID: `{pluginId}.{id}` */
  qualifiedId: string;
  /** Plugin that registered this strategy */
  ownerPluginId: string;
  /**
   * Dynamically generated permission ID for this strategy.
   * Format: `{ownerPluginId}.strategy.{id}.use`
   */
  permissionId: string;
}

/**
 * Registry for notification strategies.
 * Maintained by notification-backend.
 */
export interface NotificationStrategyRegistry {
  /**
   * Register a notification strategy.
   * Must be called during plugin initialization.
   *
   * @param strategy - The strategy to register
   * @param pluginMetadata - Plugin metadata for namespacing
   */
  register(
    strategy: NotificationStrategy<unknown, unknown>,
    pluginMetadata: PluginMetadata
  ): void;

  /**
   * Get a strategy by its qualified ID.
   *
   * @param qualifiedId - Full ID in format `{pluginId}.{strategyId}`
   */
  getStrategy(
    qualifiedId: string
  ): RegisteredNotificationStrategy<unknown, unknown> | undefined;

  /**
   * Get all registered strategies.
   */
  getStrategies(): RegisteredNotificationStrategy<unknown, unknown>[];

  /**
   * Get all strategies that a user has permission to use.
   *
   * @param userPermissions - Set of permission IDs the user has
   */
  getStrategiesForUser(
    userPermissions: Set<string>
  ): RegisteredNotificationStrategy<unknown, unknown>[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// User Preference Types (for typings, actual storage in notification-backend)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * User's notification preference for a specific strategy.
 */
export interface UserNotificationPreference {
  /** User ID */
  userId: string;
  /** Qualified strategy ID */
  strategyId: string;
  /** User's strategy-specific config (validated via strategy.userConfig) */
  config: VersionedRecord<unknown> | null;
  /** Whether user has enabled this channel */
  enabled: boolean;
  /** External user ID from OAuth linking (e.g., Slack user ID) */
  externalId: string | null;
  /** When the external account was linked */
  linkedAt: Date | null;
}
