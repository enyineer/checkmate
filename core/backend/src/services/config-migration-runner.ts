import {
  VersionedConfig,
  MigrationChain,
  migrateVersionedData,
} from "@checkmate/backend-api";

/**
 * Service for running configuration migrations.
 * Wraps the generic migrateVersionedData function with VersionedConfig-specific typing.
 */
export class ConfigMigrationRunner {
  /**
   * Migrate a versioned config to the latest version.
   * Migrations are run in sequential order (v1->v2, v2->v3, etc.)
   */
  async migrate<T>(
    versionedConfig: VersionedConfig,
    targetVersion: number,
    migrations: MigrationChain<T>
  ): Promise<VersionedConfig<T>> {
    return migrateVersionedData<T, VersionedConfig>(
      versionedConfig,
      targetVersion,
      migrations
    );
  }
}
