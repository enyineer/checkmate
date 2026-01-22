import RCON from "rcon-srcds";
import {
  HealthCheckStrategy,
  HealthCheckRunForAggregation,
  Versioned,
  z,
  configString,
  configNumber,
  type ConnectedClient,
  mergeAverage,
  averageStateSchema,
  mergeRate,
  rateStateSchema,
  mergeCounter,
  counterStateSchema,
  mergeMinMax,
  minMaxStateSchema,
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
import type { RconTransportClient } from "@checkstack/healthcheck-rcon-common";

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Configuration schema for RCON health checks.
 */
export const rconConfigSchema = z.object({
  host: z.string().describe("RCON server hostname"),
  port: z
    .number()
    .int()
    .min(1)
    .max(65_535)
    .default(25_575)
    .describe("RCON port (25575 for Minecraft, 27015 for Source)"),
  password: configString({ "x-secret": true }).describe("RCON password"),
  timeout: configNumber({})
    .min(100)
    .default(10_000)
    .describe("Connection timeout in milliseconds"),
});

export type RconConfig = z.infer<typeof rconConfigSchema>;
export type RconConfigInput = z.input<typeof rconConfigSchema>;

/**
 * Per-run result metadata.
 */
const rconResultSchema = healthResultSchema({
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

type RconResult = z.infer<typeof rconResultSchema>;

/**
 * Aggregated metadata for buckets.
 */
const rconAggregatedDisplaySchema = healthResultSchema({
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

const rconAggregatedInternalSchema = z.object({
  _connectionTime: averageStateSchema
    .optional(),
  _maxConnectionTime: minMaxStateSchema.optional(),
  _success: rateStateSchema
    .optional(),
  _errors: counterStateSchema.optional(),
});

const rconAggregatedSchema = rconAggregatedDisplaySchema.merge(
  rconAggregatedInternalSchema,
);

type RconAggregatedResult = z.infer<typeof rconAggregatedSchema>;

// ============================================================================
// RCON CLIENT INTERFACE (for testability)
// ============================================================================

export interface RconConnection {
  command(cmd: string): Promise<string>;
  disconnect(): void;
}

export interface RconClient {
  connect(config: {
    host: string;
    port: number;
    password: string;
    timeout: number;
  }): Promise<RconConnection>;
}

// Default client using rcon-srcds
const defaultRconClient: RconClient = {
  async connect(config) {
    const rcon = new RCON({
      host: config.host,
      port: config.port,
      timeout: config.timeout,
    });

    await rcon.authenticate(config.password);

    return {
      async command(cmd: string): Promise<string> {
        const result = await rcon.execute(cmd);
        // rcon.execute can return boolean for some commands, coerce to string
        return typeof result === "string" ? result : String(result);
      },
      disconnect() {
        rcon.disconnect();
      },
    };
  },
};

// ============================================================================
// STRATEGY
// ============================================================================

export class RconHealthCheckStrategy implements HealthCheckStrategy<
  RconConfig,
  RconTransportClient,
  RconResult,
  RconAggregatedResult
> {
  id = "rcon";
  displayName = "RCON Health Check";
  description =
    "Game server connectivity via RCON protocol (Minecraft, CS:GO, etc.)";

  private rconClient: RconClient;

  constructor(rconClient: RconClient = defaultRconClient) {
    this.rconClient = rconClient;
  }

  config: Versioned<RconConfig> = new Versioned({
    version: 1,
    schema: rconConfigSchema,
  });

  result: Versioned<RconResult> = new Versioned({
    version: 1,
    schema: rconResultSchema,
  });

  aggregatedResult: Versioned<RconAggregatedResult> = new Versioned({
    version: 1,
    schema: rconAggregatedSchema,
  });

  mergeResult(
    existing: RconAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<RconResult>,
  ): RconAggregatedResult {
    const metadata = run.metadata;

    const connectionTimeState = mergeAverage(
      existing?._connectionTime as AverageState | undefined,
      metadata?.connectionTimeMs,
    );

    const maxConnectionTimeState = mergeMinMax(
      existing?._maxConnectionTime as MinMaxState | undefined,
      metadata?.connectionTimeMs,
    );

    const successState = mergeRate(
      existing?._success as RateState | undefined,
      metadata?.connected,
    );

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

  /**
   * Create a connected RCON transport client.
   */
  async createClient(
    config: RconConfigInput,
  ): Promise<ConnectedClient<RconTransportClient>> {
    const validatedConfig = this.config.validate(config);

    const connection = await this.rconClient.connect({
      host: validatedConfig.host,
      port: validatedConfig.port,
      password: validatedConfig.password,
      timeout: validatedConfig.timeout,
    });

    return {
      client: {
        exec: async (command: string) => {
          const response = await connection.command(command);
          return { response };
        },
      },
      close: () => connection.disconnect(),
    };
  }
}
