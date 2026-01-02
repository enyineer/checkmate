/**
 * Plugin metadata interface for backend plugins.
 *
 * Each backend plugin should export a `pluginMetadata` object from `plugin-metadata.ts`
 * that implements this interface. This provides a single source of truth for:
 * - The pluginId (used by createBackendPlugin and drizzle schema generation)
 * - Other plugin metadata that may be needed at build time
 */
export interface PluginMetadata {
  /** The unique identifier for this plugin */
  pluginId: string;
}

/**
 * Helper function to create typed plugin metadata.
 * @param metadata The plugin metadata object
 * @returns The same object with proper typing
 */
export function definePluginMetadata<T extends PluginMetadata>(metadata: T): T {
  return metadata;
}
