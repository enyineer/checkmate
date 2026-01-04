import {
  pgTable,
  text,
  boolean,
  uuid,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { NotificationAction } from "@checkmate/notification-common";

// User notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // No FK - cross-schema limitation
  title: text("title").notNull(),
  description: text("description").notNull(),
  actions: jsonb("actions").$type<NotificationAction[]>(),
  importance: text("importance").notNull().default("info"), // 'info' | 'warning' | 'critical'
  isRead: boolean("is_read").notNull().default(false),
  groupId: text("group_id"), // Namespaced: "pluginId.groupName"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification groups (created by plugins)
// ID is namespaced: "pluginId.groupName"
export const notificationGroups = pgTable("notification_groups", {
  id: text("id").primaryKey(), // Namespaced: "pluginId.groupName"
  name: text("name").notNull(),
  description: text("description").notNull(),
  ownerPlugin: text("owner_plugin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-group subscriptions
export const notificationSubscriptions = pgTable(
  "notification_subscriptions",
  {
    userId: text("user_id").notNull(),
    groupId: text("group_id")
      .notNull()
      .references(() => notificationGroups.id, { onDelete: "cascade" }),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.groupId] }),
  })
);

// User notification preferences per strategy
// Stores user-specific config, enabled status, and OAuth linking info
export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    userId: text("user_id").notNull(),
    /** Qualified strategy ID: {pluginId}.{strategyId} */
    strategyId: text("strategy_id").notNull(),
    /** User's strategy-specific config (validated via strategy.userConfig) */
    config: jsonb("config"),
    /** Whether user has enabled this channel (default true) */
    enabled: boolean("enabled").default(true).notNull(),
    /** External user ID from OAuth linking (e.g., Slack user ID) */
    externalId: text("external_id"),
    /** When the external account was linked */
    linkedAt: timestamp("linked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.strategyId] }),
  })
);
