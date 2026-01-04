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
 * Health check strategy definition with typed config and result metadata.
 */
export interface HealthCheckStrategy<
  TConfig = unknown,
  TResultMetadata = Record<string, unknown>
> {
  id: string;
  displayName: string;
  description?: string;

  /** Configuration schema with versioning and migrations */
  config: VersionedSchema<TConfig>;

  /** Optional result metadata schema with versioning and migrations */
  resultMetadata?: VersionedSchema<TResultMetadata>;

  execute(config: TConfig): Promise<HealthCheckResult<TResultMetadata>>;
}

export interface HealthCheckRegistry {
  register(strategy: HealthCheckStrategy<unknown, unknown>): void;
  getStrategy(id: string): HealthCheckStrategy<unknown, unknown> | undefined;
  getStrategies(): HealthCheckStrategy<unknown, unknown>[];
}
