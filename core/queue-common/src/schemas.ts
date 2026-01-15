import { z } from "zod";

/**
 * DTO for queue plugin information
 */
export const QueuePluginDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  configVersion: z.number(),
  configSchema: z.record(z.string(), z.unknown()),
});

export type QueuePluginDto = z.infer<typeof QueuePluginDtoSchema>;

/**
 * DTO for current queue configuration
 */
export const QueueConfigurationDtoSchema = z.object({
  pluginId: z.string(),
  config: z.record(z.string(), z.unknown()),
});

export type QueueConfigurationDto = z.infer<typeof QueueConfigurationDtoSchema>;

/**
 * Schema for updating queue configuration
 */
export const UpdateQueueConfigurationSchema = z.object({
  pluginId: z.string().describe("ID of the queue plugin to use"),
  config: z
    .record(z.string(), z.unknown())
    .describe("Plugin-specific configuration"),
});

export type UpdateQueueConfiguration = z.infer<
  typeof UpdateQueueConfigurationSchema
>;

/**
 * Queue statistics DTO
 */
export const QueueStatsDtoSchema = z.object({
  pending: z.number(),
  processing: z.number(),
  completed: z.number(),
  failed: z.number(),
});

export type QueueStatsDto = z.infer<typeof QueueStatsDtoSchema>;

/**
 * Lag severity levels
 */
export const LagSeveritySchema = z.enum(["none", "warning", "critical"]);
export type LagSeverity = z.infer<typeof LagSeveritySchema>;

/**
 * Queue lag thresholds configuration
 */
export const QueueLagThresholdsSchema = z.object({
  warningThreshold: z
    .number()
    .min(1)
    .default(100)
    .describe("Pending job count to trigger warning"),
  criticalThreshold: z
    .number()
    .min(1)
    .default(500)
    .describe("Pending job count to trigger critical alert"),
});

export type QueueLagThresholds = z.infer<typeof QueueLagThresholdsSchema>;

/**
 * Queue lag status response
 */
export const QueueLagStatusSchema = z.object({
  pending: z.number(),
  severity: LagSeveritySchema,
  thresholds: QueueLagThresholdsSchema,
});

export type QueueLagStatus = z.infer<typeof QueueLagStatusSchema>;
