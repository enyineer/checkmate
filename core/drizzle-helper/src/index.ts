/**
 * Generates the database schema name for a plugin.
 *
 * This should be used in schema.ts to create a pgSchema with the correct name:
 *
 * @example
 * ```typescript
 * // In plugin-metadata.ts
 * import { definePluginMetadata } from "@checkmate/drizzle-helper";
 * export const pluginMetadata = definePluginMetadata({ pluginId: "catalog" });
 *
 * // In schema.ts
 * import { pgSchema } from "drizzle-orm/pg-core";
 * import { getPluginSchemaName } from "@checkmate/drizzle-helper";
 * import { pluginMetadata } from "./plugin-metadata";
 *
 * const mySchema = pgSchema(getPluginSchemaName(pluginMetadata.pluginId));
 * export const users = mySchema.table("users", { ... });
 * ```
 *
 * @param pluginId - The plugin identifier
 * @returns The database schema name in format "plugin_<pluginId>"
 */
export function getPluginSchemaName(pluginId: string): string {
  return `plugin_${pluginId}`;
}
