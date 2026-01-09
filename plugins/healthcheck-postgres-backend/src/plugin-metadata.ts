import { definePluginMetadata } from "@checkstack/common";

/**
 * Plugin metadata for the PostgreSQL Health Check backend.
 */
export const pluginMetadata = definePluginMetadata({
  pluginId: "healthcheck-postgres",
});
