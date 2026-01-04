import { VersionedSchema } from "./config-versioning";

/**
 * Health check result with typed metadata.
 * TMetadata is defined by each strategy's resultMetadata schema.
 */
export interface HealthCheckResult<TMetadata = Record<string, unknown>> {
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  message?: string;
  metadata?: TMetadata;
}

/**
 * Raw run data for aggregation (passed to aggregateMetadata function).
 */
export interface HealthCheckRunForAggregation<
  TResultMetadata = Record<string, unknown>
> {
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  metadata?: TResultMetadata;
}

/**
 * Health check strategy definition with typed config and result metadata.
 * @template TConfig - Configuration type for this strategy
 * @template TResultMetadata - Per-run result metadata type
 * @template TAggregatedMetadata - Aggregated metadata type for buckets
 */
export interface HealthCheckStrategy<
  TConfig = unknown,
  TResultMetadata = Record<string, unknown>,
  TAggregatedMetadata = Record<string, unknown>
> {
  id: string;
  displayName: string;
  description?: string;

  /** Configuration schema with versioning and migrations */
  config: VersionedSchema<TConfig>;

  /** Optional result metadata schema with versioning and migrations */
  resultMetadata?: VersionedSchema<TResultMetadata>;

  /** Aggregated metadata schema for long-term bucket storage */
  aggregatedMetadata: VersionedSchema<TAggregatedMetadata>;

  execute(config: TConfig): Promise<HealthCheckResult<TResultMetadata>>;

  /**
   * Aggregate metadata from multiple runs into a summary for bucket storage.
   * Called during retention processing when raw data is aggregated.
   * Core metrics (counts, latency) are auto-calculated by platform.
   * This function only handles strategy-specific metadata.
   */
  aggregateMetadata(
    runs: HealthCheckRunForAggregation<TResultMetadata>[]
  ): TAggregatedMetadata;
}

export interface HealthCheckRegistry {
  register(strategy: HealthCheckStrategy<unknown, unknown, unknown>): void;
  getStrategy(
    id: string
  ): HealthCheckStrategy<unknown, unknown, unknown> | undefined;
  getStrategies(): HealthCheckStrategy<unknown, unknown, unknown>[];
}
