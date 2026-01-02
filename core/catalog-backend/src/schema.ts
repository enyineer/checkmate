import {
  pgSchema,
  text,
  timestamp,
  json,
  primaryKey,
} from "drizzle-orm/pg-core";
import { getPluginSchemaName } from "@checkmate/drizzle-helper";
import { pluginMetadata } from "./plugin-metadata";

// Get the schema name from the plugin's pluginId
const catalogSchema = pgSchema(getPluginSchemaName(pluginMetadata.pluginId));

export const systems = catalogSchema.table("systems", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner"), // user_id or group_id reference? Keeping as text for now.
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groups = catalogSchema.table("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),

  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemsGroups = catalogSchema.table(
  "systems_groups",
  {
    systemId: text("system_id")
      .notNull()
      .references(() => systems.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey(t.systemId, t.groupId),
  })
);

export const views = catalogSchema.table("views", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  configuration: json("configuration").default([]).notNull(), // List of group_ids to show
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
