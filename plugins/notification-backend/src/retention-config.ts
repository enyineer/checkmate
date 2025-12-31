import { z } from "zod";

/**
 * Plugin-level configuration for notification retention policy.
 * This controls how long notifications are kept before automatic purging.
 */
export const retentionConfigV1 = z.object({
  /**
   * Whether automatic purging of old notifications is enabled.
   */
  enabled: z
    .boolean()
    .default(false)
    .describe("Enable auto-purging of old notifications"),

  /**
   * Number of days to retain notifications before purging.
   */
  retentionDays: z
    .number()
    .min(1)
    .max(365)
    .default(30)
    .describe("Number of days to retain notifications before purging"),
});

export type RetentionConfig = z.infer<typeof retentionConfigV1>;

export const RETENTION_CONFIG_VERSION = 1;
export const RETENTION_CONFIG_ID = "notification.retention";
