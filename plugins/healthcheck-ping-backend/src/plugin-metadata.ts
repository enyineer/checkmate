import { definePluginMetadata } from "@checkmate-monitor/common";

/**
 * Plugin metadata for the Ping Health Check backend.
 * This is the single source of truth for the plugin ID.
 */
export const pluginMetadata = definePluginMetadata({
  pluginId: "healthcheck-ping",
});
