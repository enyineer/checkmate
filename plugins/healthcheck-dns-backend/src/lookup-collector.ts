import {
  Versioned,
  z,
  type HealthCheckRunForAggregation,
  type CollectorResult,
  type CollectorStrategy,
  mergeAverage,
  mergeRate,
  averageStateSchema,
  rateStateSchema,
  type AverageState,
  type RateState,
} from "@checkstack/backend-api";
import {
  healthResultNumber,
  healthResultArray,
  healthResultSchema,
} from "@checkstack/healthcheck-common";
import { pluginMetadata } from "./plugin-metadata";
import type { DnsTransportClient } from "./transport-client";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const lookupConfigSchema = z.object({
  hostname: z.string().min(1).describe("Hostname to resolve"),
  recordType: z
    .enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"])
    .default("A")
    .describe("DNS record type"),
  nameserver: z.string().optional().describe("Custom nameserver (optional)"),
});

export type LookupConfig = z.infer<typeof lookupConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const lookupResultSchema = healthResultSchema({
  values: healthResultArray({
    "x-chart-type": "text",
    "x-chart-label": "Resolved Values",
  }),
  recordCount: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Record Count",
  }),
  resolutionTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Resolution Time",
    "x-chart-unit": "ms",
  }),
});

export type LookupResult = z.infer<typeof lookupResultSchema>;

// UI-visible aggregated fields (for charts)
const lookupAggregatedDisplaySchema = healthResultSchema({
  avgResolutionTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Resolution Time",
    "x-chart-unit": "ms",
  }),
  successRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Success Rate",
    "x-chart-unit": "%",
  }),
});

// Internal state for incremental aggregation (not shown in charts)
const lookupAggregatedInternalSchema = z.object({
  _resolutionTime: averageStateSchema.optional(),
  _success: rateStateSchema.optional(),
});

// Combined schema for storage
const lookupAggregatedSchema = lookupAggregatedDisplaySchema.merge(
  lookupAggregatedInternalSchema,
);

export type LookupAggregatedResult = z.infer<typeof lookupAggregatedSchema>;

// ============================================================================
// LOOKUP COLLECTOR
// ============================================================================

/**
 * Built-in DNS lookup collector.
 * Resolves DNS records and checks results.
 */
export class LookupCollector implements CollectorStrategy<
  DnsTransportClient,
  LookupConfig,
  LookupResult,
  LookupAggregatedResult
> {
  id = "lookup";
  displayName = "DNS Lookup";
  description = "Resolve DNS records and check the results";

  supportedPlugins = [pluginMetadata];

  allowMultiple = true;

  config = new Versioned({ version: 1, schema: lookupConfigSchema });
  result = new Versioned({ version: 1, schema: lookupResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: lookupAggregatedSchema,
  });

  async execute({
    config,
    client,
  }: {
    config: LookupConfig;
    client: DnsTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<LookupResult>> {
    const startTime = Date.now();

    const response = await client.exec({
      hostname: config.hostname,
      recordType: config.recordType,
    });

    const resolutionTimeMs = Date.now() - startTime;

    return {
      result: {
        values: response.values,
        recordCount: response.values.length,
        resolutionTimeMs,
      },
      error: response.error,
    };
  }

  mergeResult(
    existing: LookupAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<LookupResult>,
  ): LookupAggregatedResult {
    const metadata = run.metadata;

    // Merge resolution time average
    const resolutionTimeState = mergeAverage(
      existing?._resolutionTime as AverageState | undefined,
      metadata?.resolutionTimeMs,
    );

    // Merge success rate (recordCount > 0 means success)
    const isSuccess = (metadata?.recordCount ?? 0) > 0;
    const successState = mergeRate(
      existing?._success as RateState | undefined,
      isSuccess,
    );

    return {
      avgResolutionTimeMs: resolutionTimeState.avg,
      successRate: successState.rate,
      _resolutionTime: resolutionTimeState,
      _success: successState,
    };
  }
}
