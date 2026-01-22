import {
  HealthCheckStrategy,
  HealthCheckRunForAggregation,
  Versioned,
  z,
  type ConnectedClient,
  mergeAverage,
  averageStateSchema,
  mergeCounter,
  counterStateSchema,
  mergeMinMax,
  minMaxStateSchema,
  type AverageState,
  type CounterState,
  type MinMaxState,
} from "@checkstack/backend-api";
import {
  healthResultNumber,
  healthResultString,
  healthResultSchema,
} from "@checkstack/healthcheck-common";
import type {
  PingTransportClient,
  PingRequest,
  PingResult as PingResultType,
} from "./transport-client";

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Configuration schema for Ping health checks.
 * Global defaults only - action params moved to PingCollector.
 */
export const pingConfigSchema = z.object({
  timeout: z
    .number()
    .min(100)
    .default(5000)
    .describe("Default timeout in milliseconds"),
});

export type PingConfig = z.infer<typeof pingConfigSchema>;

// Legacy config type for migrations
interface PingConfigV1 {
  host: string;
  count: number;
  timeout: number;
}

/**
 * Per-run result metadata.
 */
const pingResultSchema = healthResultSchema({
  packetsSent: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Packets Sent",
  }),
  packetsReceived: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Packets Received",
  }),
  packetLoss: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Packet Loss",
    "x-chart-unit": "%",
  }),
  minLatency: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Min Latency",
    "x-chart-unit": "ms",
  }).optional(),
  avgLatency: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Latency",
    "x-chart-unit": "ms",
  }).optional(),
  maxLatency: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Max Latency",
    "x-chart-unit": "ms",
  }).optional(),
  error: healthResultString({
    "x-chart-type": "status",
    "x-chart-label": "Error",
  }).optional(),
});

type PingResult = z.infer<typeof pingResultSchema>;

/**
 * Aggregated metadata for buckets.
 */
const pingAggregatedDisplaySchema = healthResultSchema({
  avgPacketLoss: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Avg Packet Loss",
    "x-chart-unit": "%",
  }),
  avgLatency: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Latency",
    "x-chart-unit": "ms",
  }),
  maxLatency: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Max Latency",
    "x-chart-unit": "ms",
  }),
  errorCount: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Errors",
  }),
});

const pingAggregatedInternalSchema = z.object({
  _packetLoss: averageStateSchema.optional(),
  _latency: averageStateSchema.optional(),
  _maxLatency: minMaxStateSchema.optional(),
  _errors: counterStateSchema.optional(),
});

const pingAggregatedSchema = pingAggregatedDisplaySchema.merge(
  pingAggregatedInternalSchema,
);

type PingAggregatedResult = z.infer<typeof pingAggregatedSchema>;

// ============================================================================
// STRATEGY
// ============================================================================

export class PingHealthCheckStrategy implements HealthCheckStrategy<
  PingConfig,
  PingTransportClient,
  PingResult,
  PingAggregatedResult
> {
  id = "ping";
  displayName = "Ping Health Check";
  description = "ICMP ping check for network reachability and latency";

  config: Versioned<PingConfig> = new Versioned({
    version: 2,
    schema: pingConfigSchema,
    migrations: [
      {
        fromVersion: 1,
        toVersion: 2,
        description: "Remove host/count (moved to PingCollector)",
        migrate: (data: PingConfigV1): PingConfig => ({
          timeout: data.timeout,
        }),
      },
    ],
  });

  result: Versioned<PingResult> = new Versioned({
    version: 2,
    schema: pingResultSchema,
    migrations: [
      {
        fromVersion: 1,
        toVersion: 2,
        description: "Migrate to createClient pattern (no result changes)",
        migrate: (data: unknown) => data,
      },
    ],
  });

  aggregatedResult: Versioned<PingAggregatedResult> = new Versioned({
    version: 1,
    schema: pingAggregatedSchema,
  });

  mergeResult(
    existing: PingAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<PingResult>,
  ): PingAggregatedResult {
    const metadata = run.metadata;

    const packetLossState = mergeAverage(
      existing?._packetLoss as AverageState | undefined,
      metadata?.packetLoss,
    );

    const latencyState = mergeAverage(
      existing?._latency as AverageState | undefined,
      metadata?.avgLatency,
    );

    const maxLatencyState = mergeMinMax(
      existing?._maxLatency as MinMaxState | undefined,
      metadata?.maxLatency,
    );

    const errorState = mergeCounter(
      existing?._errors as CounterState | undefined,
      metadata?.error !== undefined,
    );

    return {
      avgPacketLoss: Math.round(packetLossState.avg * 10) / 10,
      avgLatency: Math.round(latencyState.avg * 10) / 10,
      maxLatency: maxLatencyState.max,
      errorCount: errorState.count,
      _packetLoss: packetLossState,
      _latency: latencyState,
      _maxLatency: maxLatencyState,
      _errors: errorState,
    };
  }

  async createClient(
    config: PingConfig,
  ): Promise<ConnectedClient<PingTransportClient>> {
    const validatedConfig = this.config.validate(config);

    const client: PingTransportClient = {
      exec: async (request: PingRequest): Promise<PingResultType> => {
        return this.runPing(
          request.host,
          request.count,
          request.timeout ?? validatedConfig.timeout,
        );
      },
    };

    return {
      client,
      close: () => {
        // Ping is stateless, nothing to close
      },
    };
  }

  private async runPing(
    host: string,
    count: number,
    timeout: number,
  ): Promise<PingResultType> {
    const isMac = process.platform === "darwin";
    const args = isMac
      ? ["-c", String(count), "-W", String(Math.ceil(timeout / 1000)), host]
      : ["-c", String(count), "-W", String(Math.ceil(timeout / 1000)), host];

    try {
      const proc = Bun.spawn({
        cmd: ["ping", ...args],
        stdout: "pipe",
        stderr: "pipe",
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      return this.parsePingOutput(output, count, exitCode);
    } catch (error_) {
      const error = error_ instanceof Error ? error_.message : String(error_);
      return {
        packetsSent: count,
        packetsReceived: 0,
        packetLoss: 100,
        error,
      };
    }
  }

  private parsePingOutput(
    output: string,
    expectedCount: number,
    _exitCode: number,
  ): PingResultType {
    // Parse packet statistics
    const statsMatch = output.match(
      /(\d+) packets transmitted, (\d+) (?:packets )?received/,
    );
    const packetsSent = statsMatch
      ? Number.parseInt(statsMatch[1], 10)
      : expectedCount;
    const packetsReceived = statsMatch ? Number.parseInt(statsMatch[2], 10) : 0;
    const packetLoss =
      packetsSent > 0
        ? Math.round(((packetsSent - packetsReceived) / packetsSent) * 100)
        : 100;

    // Parse latency statistics (format varies by OS)
    // macOS: round-trip min/avg/max/stddev = 0.043/0.059/0.082/0.016 ms
    // Linux: rtt min/avg/max/mdev = 0.039/0.049/0.064/0.009 ms
    const latencyMatch = output.match(
      /(?:round-trip|rtt) min\/avg\/max\/(?:stddev|mdev) = ([\d.]+)\/([\d.]+)\/([\d.]+)/,
    );

    let minLatency: number | undefined;
    let avgLatency: number | undefined;
    let maxLatency: number | undefined;

    if (latencyMatch) {
      minLatency = Number.parseFloat(latencyMatch[1]);
      avgLatency = Number.parseFloat(latencyMatch[2]);
      maxLatency = Number.parseFloat(latencyMatch[3]);
    }

    return {
      packetsSent,
      packetsReceived,
      packetLoss,
      minLatency,
      avgLatency,
      maxLatency,
      ...(packetLoss === 100 && {
        error: "Host unreachable or 100% packet loss",
      }),
    };
  }
}
