import {
  Versioned,
  z,
  type HealthCheckRunForAggregation,
  type CollectorResult,
  type CollectorStrategy,
  mergeAverage,
  averageStateSchema,
  mergeRate,
  rateStateSchema,
  type AverageState,
  type RateState,
} from "@checkstack/backend-api";
import {
  healthResultNumber,
  healthResultString,
  healthResultBoolean,
  healthResultSchema,
} from "@checkstack/healthcheck-common";
import { pluginMetadata } from "./plugin-metadata";
import type { TcpTransportClient } from "./transport-client";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const bannerConfigSchema = z.object({
  timeout: z
    .number()
    .min(100)
    .default(5000)
    .describe("Timeout for banner read in milliseconds"),
});

export type BannerConfig = z.infer<typeof bannerConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const bannerResultSchema = healthResultSchema({
  banner: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Banner",
  }).optional(),
  hasBanner: healthResultBoolean({
    "x-chart-type": "boolean",
    "x-chart-label": "Has Banner",
  }),
  readTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Read Time",
    "x-chart-unit": "ms",
  }),
});

export type BannerResult = z.infer<typeof bannerResultSchema>;

const bannerAggregatedDisplaySchema = healthResultSchema({
  avgReadTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Read Time",
    "x-chart-unit": "ms",
  }),
  bannerRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Banner Rate",
    "x-chart-unit": "%",
  }),
});

const bannerAggregatedInternalSchema = z.object({
  _readTime: averageStateSchema
    .optional(),
  _banner: rateStateSchema
    .optional(),
});

const bannerAggregatedSchema = bannerAggregatedDisplaySchema.merge(
  bannerAggregatedInternalSchema,
);

export type BannerAggregatedResult = z.infer<typeof bannerAggregatedSchema>;

// ============================================================================
// BANNER COLLECTOR
// ============================================================================

/**
 * Built-in TCP banner collector.
 * Reads the initial banner/greeting from a TCP server.
 */
export class BannerCollector implements CollectorStrategy<
  TcpTransportClient,
  BannerConfig,
  BannerResult,
  BannerAggregatedResult
> {
  id = "banner";
  displayName = "TCP Banner";
  description = "Read the initial banner/greeting from the server";

  supportedPlugins = [pluginMetadata];

  allowMultiple = false;

  config = new Versioned({ version: 1, schema: bannerConfigSchema });
  result = new Versioned({ version: 1, schema: bannerResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: bannerAggregatedSchema,
  });

  async execute({
    config,
    client,
  }: {
    config: BannerConfig;
    client: TcpTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<BannerResult>> {
    const startTime = Date.now();

    const response = await client.exec({
      type: "read",
      timeout: config.timeout,
    });

    const readTimeMs = Date.now() - startTime;

    return {
      result: {
        banner: response.banner,
        hasBanner: !!response.banner,
        readTimeMs,
      },
    };
  }

  mergeResult(
    existing: BannerAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<BannerResult>,
  ): BannerAggregatedResult {
    const metadata = run.metadata;

    const readTimeState = mergeAverage(
      existing?._readTime as AverageState | undefined,
      metadata?.readTimeMs,
    );

    const bannerState = mergeRate(
      existing?._banner as RateState | undefined,
      metadata?.hasBanner,
    );

    return {
      avgReadTimeMs: readTimeState.avg,
      bannerRate: bannerState.rate,
      _readTime: readTimeState,
      _banner: bannerState,
    };
  }
}
