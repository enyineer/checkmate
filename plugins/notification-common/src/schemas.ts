import { z } from "zod";

// Notification importance levels
export const ImportanceSchema = z.enum(["info", "warning", "critical"]);
export type Importance = z.infer<typeof ImportanceSchema>;

// Notification action for CTA buttons
export const NotificationActionSchema = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(["primary", "secondary", "destructive"]).optional(),
});
export type NotificationAction = z.infer<typeof NotificationActionSchema>;

// Core notification schema
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  actions: z.array(NotificationActionSchema).optional(),
  importance: ImportanceSchema,
  isRead: z.boolean(),
  groupId: z.string().optional(),
  createdAt: z.coerce.date(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// Notification group schema (namespaced: "pluginId.groupName")
export const NotificationGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ownerPlugin: z.string(),
  createdAt: z.coerce.date(),
});
export type NotificationGroup = z.infer<typeof NotificationGroupSchema>;

// User subscription to a notification group
export const NotificationSubscriptionSchema = z.object({
  userId: z.string(),
  groupId: z.string(),
  subscribedAt: z.coerce.date(),
});
export type NotificationSubscription = z.infer<
  typeof NotificationSubscriptionSchema
>;

// Retention settings
export const RetentionSettingsSchema = z.object({
  retentionDays: z.number().min(1).max(365),
  enabled: z.boolean(),
});
export type RetentionSettings = z.infer<typeof RetentionSettingsSchema>;

// --- Input Schemas ---

export const CreateNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  actions: z.array(NotificationActionSchema).optional(),
  importance: ImportanceSchema.default("info"),
});
export type CreateNotificationInput = z.infer<
  typeof CreateNotificationInputSchema
>;

export const NotificationGroupInputSchema = z.object({
  groupId: z.string(),
  name: z.string(),
  description: z.string(),
});
export type NotificationGroupInput = z.infer<
  typeof NotificationGroupInputSchema
>;

// Pagination schema for listing notifications
export const PaginationInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  unreadOnly: z.boolean().default(false),
});
export type PaginationInput = z.infer<typeof PaginationInputSchema>;
