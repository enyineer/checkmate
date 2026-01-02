import { createApiRef } from "@checkmate/frontend-api";
import { HealthCheckClient } from "@checkmate/healthcheck-common";

// Re-export types for convenience
export type {
  HealthCheckConfiguration,
  HealthCheckStrategyDto,
  HealthCheckRun,
  HealthCheckRunPublic,
} from "@checkmate/healthcheck-common";

// HealthCheckApi is the client type from the common package
export type HealthCheckApi = HealthCheckClient;

export const healthCheckApiRef =
  createApiRef<HealthCheckApi>("healthcheck-api");
