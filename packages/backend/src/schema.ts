import { pgTable, serial, text, boolean, json } from "drizzle-orm/pg-core";

export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  path: text("path").notNull(),
  isUninstallable: boolean("is_uninstallable").default(false).notNull(),
  config: json("config").default({}),
  enabled: boolean("enabled").default(true).notNull(),
});
