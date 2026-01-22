import { Client, type ClientConfig } from "pg";
import {
  HealthCheckStrategy,
  HealthCheckRunForAggregation,
  Versioned,
  z,
  configString,
  configNumber,
  configBoolean,
  type ConnectedClient,
  mergeAverage,
  mergeRate,
  mergeCounter,
  mergeMinMax,
  averageStateSchema,
  minMaxStateSchema,
  rateStateSchema,
  counterStateSchema,
  type AverageState,
  type RateState,
  type CounterState,
  type MinMaxState,
} from "@checkstack/backend-api";
import {
  healthResultBoolean,
  healthResultNumber,
  healthResultString,
  healthResultSchema,
} from "@checkstack/healthcheck-common";
import type {
  PostgresTransportClient,
  SqlQueryRequest,
  SqlQueryResult,
} from "./transport-client";

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Configuration schema for PostgreSQL health checks.
 */
export const postgresConfigSchema = z.object({
  host: configString({}).describe("PostgreSQL server hostname"),
  port: configNumber({})
    .int()
    .min(1)
    .max(65_535)
    .default(5432)
    .describe("PostgreSQL port"),
  database: configString({}).describe("Database name"),
  user: configString({}).describe("Database user"),
  password: configString({ "x-secret": true }).describe("Database password"),
  ssl: configBoolean({}).default(false).describe("Use SSL connection"),
  timeout: configNumber({})
    .min(100)
    .default(10_000)
    .describe("Connection timeout in milliseconds"),
});

export type PostgresConfig = z.infer<typeof postgresConfigSchema>;
export type PostgresConfigInput = z.input<typeof postgresConfigSchema>;

/**
 * Per-run result metadata.
 */
const postgresResultSchema = healthResultSchema({
  connected: healthResultBoolean({
    "x-chart-type": "boolean",
    "x-chart-label": "Connected",
  }),
  connectionTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Connection Time",
    "x-chart-unit": "ms",
  }),
  error: healthResultString({
    "x-chart-type": "status",
    "x-chart-label": "Error",
  }).optional(),
});

type PostgresResult = z.infer<typeof postgresResultSchema>;

/**
 * Aggregated metadata for buckets.
 */
// UI-visible aggregated fields (for charts)
const postgresAggregatedDisplaySchema = healthResultSchema({
  avgConnectionTime: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Connection Time",
    "x-chart-unit": "ms",
  }),
  maxConnectionTime: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Max Connection Time",
    "x-chart-unit": "ms",
  }),
  successRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Success Rate",
    "x-chart-unit": "%",
  }),
  errorCount: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Errors",
  }),
});

// Internal state for incremental aggregation
const postgresAggregatedInternalSchema = z.object({
  _connectionTime: averageStateSchema.optional(),
  _maxConnectionTime: minMaxStateSchema.optional(),
  _success: rateStateSchema.optional(),
  _errors: counterStateSchema.optional(),
});

const postgresAggregatedSchema = postgresAggregatedDisplaySchema.merge(
  postgresAggregatedInternalSchema,
);

type PostgresAggregatedResult = z.infer<typeof postgresAggregatedSchema>;

// ============================================================================
// DATABASE CLIENT INTERFACE (for testability)
// ============================================================================

interface DbQueryResult {
  rowCount: number | null;
}

export interface DbClient {
  connect(config: ClientConfig): Promise<{
    query(sql: string): Promise<DbQueryResult>;
    end(): Promise<void>;
  }>;
}

// Default client using pg
const defaultDbClient: DbClient = {
  async connect(config) {
    const client = new Client(config);
    await client.connect();
    return {
      async query(sql: string): Promise<DbQueryResult> {
        const result = await client.query(sql);
        return { rowCount: result.rowCount };
      },
      async end() {
        await client.end();
      },
    };
  },
};

// ============================================================================
// STRATEGY
// ============================================================================

export class PostgresHealthCheckStrategy implements HealthCheckStrategy<
  PostgresConfig,
  PostgresTransportClient,
  PostgresResult,
  PostgresAggregatedResult
> {
  id = "postgres";
  displayName = "PostgreSQL Health Check";
  description = "PostgreSQL database connectivity and query health check";

  private dbClient: DbClient;

  constructor(dbClient: DbClient = defaultDbClient) {
    this.dbClient = dbClient;
  }

  config: Versioned<PostgresConfig> = new Versioned({
    version: 2,
    schema: postgresConfigSchema,
    migrations: [
      {
        fromVersion: 1,
        toVersion: 2,
        description: "Migrate to createClient pattern (no config changes)",
        migrate: (data: unknown) => data,
      },
    ],
  });

  result: Versioned<PostgresResult> = new Versioned({
    version: 2,
    schema: postgresResultSchema,
    migrations: [
      {
        fromVersion: 1,
        toVersion: 2,
        description: "Migrate to createClient pattern (no result changes)",
        migrate: (data: unknown) => data,
      },
    ],
  });

  aggregatedResult: Versioned<PostgresAggregatedResult> = new Versioned({
    version: 1,
    schema: postgresAggregatedSchema,
  });

  mergeResult(
    existing: PostgresAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<PostgresResult>,
  ): PostgresAggregatedResult {
    const metadata = run.metadata;

    // Merge connection time average
    const connectionTimeState = mergeAverage(
      existing?._connectionTime as AverageState | undefined,
      metadata?.connectionTimeMs,
    );

    // Merge max connection time
    const maxConnectionTimeState = mergeMinMax(
      existing?._maxConnectionTime as MinMaxState | undefined,
      metadata?.connectionTimeMs,
    );

    // Merge success rate
    const successState = mergeRate(
      existing?._success as RateState | undefined,
      metadata?.connected,
    );

    // Merge error count
    const errorState = mergeCounter(
      existing?._errors as CounterState | undefined,
      metadata?.error !== undefined,
    );

    return {
      avgConnectionTime: connectionTimeState.avg,
      maxConnectionTime: maxConnectionTimeState.max,
      successRate: successState.rate,
      errorCount: errorState.count,
      _connectionTime: connectionTimeState,
      _maxConnectionTime: maxConnectionTimeState,
      _success: successState,
      _errors: errorState,
    };
  }

  async createClient(
    config: PostgresConfigInput,
  ): Promise<ConnectedClient<PostgresTransportClient>> {
    const validatedConfig = this.config.validate(config);

    const connection = await this.dbClient.connect({
      host: validatedConfig.host,
      port: validatedConfig.port,
      database: validatedConfig.database,
      user: validatedConfig.user,
      password: validatedConfig.password,
      ssl: validatedConfig.ssl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: validatedConfig.timeout,
    });

    const client: PostgresTransportClient = {
      async exec(request: SqlQueryRequest): Promise<SqlQueryResult> {
        try {
          const result = await connection.query(request.query);
          return { rowCount: result.rowCount ?? 0 };
        } catch (error) {
          return {
            rowCount: 0,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    };

    return {
      client,
      close: () => {
        connection.end().catch(() => {
          // Ignore close errors
        });
      },
    };
  }
}
