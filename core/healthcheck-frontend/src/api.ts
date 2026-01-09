import { createApiRef } from "@checkstack/frontend-api";
import { HealthCheckApi } from "@checkstack/healthcheck-common";
import type { InferClient } from "@checkstack/common";

// Re-export types for convenience
export type {
  HealthCheckConfiguration,
  HealthCheckStrategyDto,
  HealthCheckRun,
  HealthCheckRunPublic,
} from "@checkstack/healthcheck-common";

// HealthCheckApiClient type inferred from the client definition
export type HealthCheckApiClient = InferClient<typeof HealthCheckApi>;

export const healthCheckApiRef =
  createApiRef<HealthCheckApiClient>("healthcheck-api");
