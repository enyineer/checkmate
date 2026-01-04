import { z } from "zod";
import type { MigrationChain, ConfigMigration } from "./config-migration";

/**
 * Generic versioned data wrapper enabling backward-compatible schema evolution.
 * Base interface for any versioned data structure that needs migrations.
 */
export interface VersionedData<T = unknown> {
  /** Schema version (starts at 1, increments sequentially) */
  version: number;

  /** The actual data payload */
  data: T;

  /** When the last migration was applied (if any) */
  migratedAt?: Date;

  /** Original version before any migrations were applied */
  originalVersion?: number;
}

/**
 * Versioned configuration wrapper for dynamic plugin configurations.
 * Extends VersionedData with plugin-specific metadata.
 */
export interface VersionedConfig<T = unknown> extends VersionedData<T> {
  /** Plugin ID that owns this configuration */
  pluginId: string;
}

/**
 * Schema definition for versioned data types.
 * Used to define how to validate and migrate versioned data.
 *
 * Distinction from VersionedData:
 * - VersionedData = runtime wrapper for stored data ({ version, data, migratedAt })
 * - VersionedSchema = type definition with schema and migrations ({ version, schema, migrations })
 */
export interface VersionedSchema<T> {
  /** Current schema version */
  version: number;
  /** Zod schema for validation */
  schema: z.ZodType<T>;
  /** Optional migrations for backward compatibility */
  migrations?: MigrationChain<T>;
}

// Re-export migration types for convenience
export type { ConfigMigration, MigrationChain } from "./config-migration";

/**
 * Builder for creating type-safe migration chains
 * Provides better type inference for each migration step
 */
export class MigrationChainBuilder<TCurrent> {
  private migrations: ConfigMigration<unknown, unknown>[] = [];

  /**
   * Add a migration to the chain
   * Returns a new builder with updated type for the next migration
   */
  addMigration<TNext>(
    migration: ConfigMigration<TCurrent, TNext>
  ): MigrationChainBuilder<TNext> {
    this.migrations.push(migration);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this as any as MigrationChainBuilder<TNext>;
  }

  /**
   * Build the final migration chain
   */
  build(): ConfigMigration<unknown, unknown>[] {
    return this.migrations;
  }
}

/**
 * Run migrations on a VersionedData object to bring it to the target version.
 * Works with any VersionedData subtype (VersionedConfig, VersionedStateThresholds, etc.)
 */
export async function migrateVersionedData<T, V extends VersionedData<unknown>>(
  versionedData: V,
  targetVersion: number,
  migrations: ConfigMigration<unknown, unknown>[]
): Promise<V & VersionedData<T>> {
  const currentVersion = versionedData.version;

  // No migration needed
  if (currentVersion === targetVersion) {
    return versionedData as V & VersionedData<T>;
  }

  // Validate migration chain
  validateMigrationChain(migrations, currentVersion, targetVersion);

  // Sort migrations to ensure correct order (v1->v2, v2->v3, etc.)
  const sortedMigrations = migrations.toSorted(
    (a, b) => a.fromVersion - b.fromVersion
  );

  // Filter to only migrations we need
  const applicableMigrations = sortedMigrations.filter(
    (m) => m.fromVersion >= currentVersion && m.toVersion <= targetVersion
  );

  // Run migrations sequentially in order
  let currentData = versionedData.data;
  let runningVersion = currentVersion;
  const originalVersion = versionedData.originalVersion ?? currentVersion;

  for (const migration of applicableMigrations) {
    try {
      currentData = await migration.migrate(currentData);
      runningVersion = migration.toVersion;
    } catch (error) {
      throw new Error(
        `Migration from v${migration.fromVersion} to v${migration.toVersion} failed: ${error}`
      );
    }
  }

  return {
    ...versionedData,
    version: runningVersion,
    data: currentData as T,
    migratedAt: new Date(),
    originalVersion,
  };
}

/**
 * Validate that migration chain has correct sequential ordering.
 * Throws error if chain is invalid.
 */
function validateMigrationChain(
  migrations: ConfigMigration<unknown, unknown>[],
  fromVersion: number,
  toVersion: number
): void {
  // Sort migrations by fromVersion to ensure correct order
  const sorted = migrations.toSorted((a, b) => a.fromVersion - b.fromVersion);

  // Verify we have a complete chain
  let expectedVersion = fromVersion;
  for (const migration of sorted) {
    if (migration.fromVersion !== expectedVersion) {
      throw new Error(
        `Migration chain broken: expected migration from version ${expectedVersion}, ` +
          `but found migration from version ${migration.fromVersion}`
      );
    }

    // Verify toVersion is exactly fromVersion + 1 (sequential)
    if (migration.toVersion !== migration.fromVersion + 1) {
      throw new Error(
        `Migration must increment version by 1: ` +
          `migration from ${migration.fromVersion} to ${migration.toVersion} is invalid`
      );
    }

    expectedVersion = migration.toVersion;
  }

  if (expectedVersion !== toVersion) {
    throw new Error(
      `Migration chain incomplete: reaches version ${expectedVersion}, ` +
        `but target version is ${toVersion}`
    );
  }
}
