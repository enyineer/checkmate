export * from "./permissions";
export * from "./schemas";

// --- DTOs for API Responses ---

/**
 * Represents a Health Check Strategy available in the system.
 */
export interface HealthCheckStrategyDto {
  id: string;
  displayName: string;
  description?: string;
  // schema is a JSON schema object derived from the Zod schema
  configSchema: Record<string, unknown>;
}

/**
 * Represents a Health Check Configuration (the check definition/template).
 * NOTE: This is derived from Zod schema but kept as interface for explicit type documentation.
 */
export interface HealthCheckConfiguration {
  id: string;
  name: string;
  strategyId: string;
  config: Record<string, unknown>;
  intervalSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

// HealthCheckRun and HealthCheckStatus types are now exported from ./schemas

export * from "./rpc-contract";
export { healthcheckRoutes } from "./routes";
