import {
  pgSchema,
  text,
  boolean,
  uuid,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { NotificationAction } from "@checkmate/notification-common";
import { getPluginSchemaName } from "@checkmate/drizzle-helper";
import { pluginMetadata } from "./plugin-metadata";

// Get the schema name from the plugin's pluginId
const notificationSchema = pgSchema(
  getPluginSchemaName(pluginMetadata.pluginId)
);

// User notifications table
export const notifications = notificationSchema.table("notifications", {
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
export const notificationGroups = notificationSchema.table(
  "notification_groups",
  {
    id: text("id").primaryKey(), // Namespaced: "pluginId.groupName"
    name: text("name").notNull(),
    description: text("description").notNull(),
    ownerPlugin: text("owner_plugin").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// User-group subscriptions
export const notificationSubscriptions = notificationSchema.table(
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
