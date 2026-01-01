import type { ConfigMigration } from "@checkmate/backend-api";
import {
  migrateVersionedData,
  type VersionedData,
} from "@checkmate/backend-api";
import type { StateThresholds } from "@checkmate/healthcheck-common";

/**
 * Current version of the state thresholds schema.
 * Increment this when adding new migrations.
 */
export const STATE_THRESHOLDS_VERSION = 1;

/**
 * Migration chain for state thresholds.
 * Add new migrations here when the schema evolves.
 *
 * Example future migration:
 * ```typescript
 * const v1ToV2: ConfigMigration<StateThresholdsV1, StateThresholdsV2> = {
 *   fromVersion: 1,
 *   toVersion: 2,
 *   description: "Add percentage-based threshold option",
 *   migrate: (old) => ({
 *     ...old,
 *     usePercentage: false, // default for existing configs
 *   }),
 * };
 * ```
 */
export const stateThresholdsMigrations: ConfigMigration<unknown, unknown>[] = [
  // No migrations yet - v1 is the initial version
];

/**
 * Migrate versioned state thresholds to the current version.
 * Should be called when loading thresholds from the database.
 */
export async function migrateStateThresholds(
  versionedThresholds: VersionedData<unknown>
): Promise<VersionedData<StateThresholds>> {
  return migrateVersionedData<StateThresholds, VersionedData<unknown>>(
    versionedThresholds,
    STATE_THRESHOLDS_VERSION,
    stateThresholdsMigrations
  );
}
