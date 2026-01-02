import { pgSchema, text, timestamp } from "drizzle-orm/pg-core";
import { getPluginSchemaName } from "@checkmate/drizzle-helper";
import { pluginMetadata } from "./plugin-metadata";

// Get the schema name from the plugin's pluginId
const themeSchema = pgSchema(getPluginSchemaName(pluginMetadata.pluginId));

// User theme preference table
export const userThemePreference = themeSchema.table("user_theme_preference", {
  userId: text("user_id").primaryKey(), // References user from auth system
  theme: text("theme").notNull().default("system"), // 'light', 'dark', or 'system'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
