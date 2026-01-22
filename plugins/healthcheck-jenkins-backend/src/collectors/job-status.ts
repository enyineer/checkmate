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
  healthResultString,
  healthResultBoolean,
} from "@checkstack/healthcheck-common";
import { pluginMetadata } from "../plugin-metadata";
import type { JenkinsTransportClient } from "../transport-client";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const jobStatusConfigSchema = z.object({
  jobName: z
    .string()
    .min(1)
    .describe("Full job path (e.g., 'folder/job-name' or 'my-job')"),
  checkLastBuild: z
    .boolean()
    .default(true)
    .describe("Check the last build status"),
});

export type JobStatusConfig = z.infer<typeof jobStatusConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const jobStatusResultSchema = z.object({
  jobName: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Job Name",
  }),
  buildable: healthResultBoolean({
    "x-chart-type": "boolean",
    "x-chart-label": "Buildable",
  }),
  lastBuildNumber: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Last Build #",
  }).optional(),
  lastBuildResult: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Last Build Result",
  }).optional(),
  lastBuildDurationMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Build Duration",
    "x-chart-unit": "ms",
  }).optional(),
  lastBuildTimestamp: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Last Build Time",
  }).optional(),
  timeSinceLastBuildMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Time Since Last Build",
    "x-chart-unit": "ms",
  }).optional(),
  inQueue: healthResultBoolean({
    "x-chart-type": "boolean",
    "x-chart-label": "In Queue",
  }),
  color: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Status Color",
  }),
});

export type JobStatusResult = z.infer<typeof jobStatusResultSchema>;

const jobStatusAggregatedDisplaySchema = z.object({
  avgBuildDurationMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Build Duration",
    "x-chart-unit": "ms",
  }),
  successRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Success Rate",
    "x-chart-unit": "%",
  }),
  buildableRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Enabled Rate",
    "x-chart-unit": "%",
  }),
});

const jobStatusAggregatedInternalSchema = z.object({
  _duration: averageStateSchema.optional(),
  _success: rateStateSchema.optional(),
  _buildable: rateStateSchema.optional(),
});

const jobStatusAggregatedSchema = jobStatusAggregatedDisplaySchema.merge(
  jobStatusAggregatedInternalSchema,
);

export type JobStatusAggregatedResult = z.infer<
  typeof jobStatusAggregatedSchema
>;

// ============================================================================
// JOB STATUS COLLECTOR
// ============================================================================

/**
 * Collector for Jenkins job status.
 * Monitors individual job health and last build information.
 */
export class JobStatusCollector implements CollectorStrategy<
  JenkinsTransportClient,
  JobStatusConfig,
  JobStatusResult,
  JobStatusAggregatedResult
> {
  id = "job-status";
  displayName = "Job Status";
  description = "Monitor Jenkins job status and last build information";

  supportedPlugins = [pluginMetadata];
  allowMultiple = true;

  config = new Versioned({ version: 1, schema: jobStatusConfigSchema });
  result = new Versioned({ version: 1, schema: jobStatusResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: jobStatusAggregatedSchema,
  });

  async execute({
    config,
    client,
  }: {
    config: JobStatusConfig;
    client: JenkinsTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<JobStatusResult>> {
    // Encode job path for URL (handle folders)
    const jobPath = config.jobName
      .split("/")
      .map((part) => `job/${encodeURIComponent(part)}`)
      .join("/");

    const response = await client.exec({
      path: `/${jobPath}/api/json`,
      query: {
        tree: "name,buildable,color,inQueue,lastBuild[number,result,duration,timestamp]",
      },
    });

    if (response.error) {
      return {
        result: {
          jobName: config.jobName,
          buildable: false,
          inQueue: false,
          color: "notbuilt",
        },
        error: response.error,
      };
    }

    const data = response.data as {
      name?: string;
      buildable?: boolean;
      color?: string;
      inQueue?: boolean;
      lastBuild?: {
        number?: number;
        result?: string;
        duration?: number;
        timestamp?: number;
      };
    };

    const result: JobStatusResult = {
      jobName: data.name || config.jobName,
      buildable: data.buildable ?? true,
      color: data.color || "notbuilt",
      inQueue: data.inQueue ?? false,
    };

    if (config.checkLastBuild && data.lastBuild) {
      result.lastBuildNumber = data.lastBuild.number;
      result.lastBuildResult = data.lastBuild.result || "UNKNOWN";
      result.lastBuildDurationMs = data.lastBuild.duration;
      result.lastBuildTimestamp = data.lastBuild.timestamp;

      if (data.lastBuild.timestamp) {
        result.timeSinceLastBuildMs = Date.now() - data.lastBuild.timestamp;
      }
    }

    // Determine if there's an error based on build result
    const isFailure =
      result.lastBuildResult === "FAILURE" ||
      result.lastBuildResult === "ABORTED";

    return {
      result,
      error: isFailure ? `Last build: ${result.lastBuildResult}` : undefined,
    };
  }

  mergeResult(
    existing: JobStatusAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<JobStatusResult>,
  ): JobStatusAggregatedResult {
    const metadata = run.metadata;

    const durationState = mergeAverage(
      existing?._duration as AverageState | undefined,
      metadata?.lastBuildDurationMs,
    );

    // Success is when lastBuildResult === "SUCCESS"
    const successState = mergeRate(
      existing?._success as RateState | undefined,
      metadata?.lastBuildResult === "SUCCESS",
    );

    const buildableState = mergeRate(
      existing?._buildable as RateState | undefined,
      metadata?.buildable,
    );

    return {
      avgBuildDurationMs: durationState.avg,
      successRate: successState.rate,
      buildableRate: buildableState.rate,
      _duration: durationState,
      _success: successState,
      _buildable: buildableState,
    };
  }
}
