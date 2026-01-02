import { createApiRef } from "@checkmate/frontend-api";
import { HealthCheckApi } from "@checkmate/healthcheck-common";
import type { InferClient } from "@checkmate/common";

// Re-export types for convenience
export type {
  HealthCheckConfiguration,
  HealthCheckStrategyDto,
  HealthCheckRun,
  HealthCheckRunPublic,
} from "@checkmate/healthcheck-common";

// HealthCheckApiClient type inferred from the client definition
export type HealthCheckApiClient = InferClient<typeof HealthCheckApi>;

export const healthCheckApiRef =
  createApiRef<HealthCheckApiClient>("healthcheck-api");
