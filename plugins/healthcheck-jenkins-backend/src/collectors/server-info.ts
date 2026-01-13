import {
  Versioned,
  z,
  type HealthCheckRunForAggregation,
  type CollectorResult,
  type CollectorStrategy,
} from "@checkstack/backend-api";
import {
  healthResultNumber,
  healthResultString,
} from "@checkstack/healthcheck-common";
import { pluginMetadata } from "../plugin-metadata";
import type { JenkinsTransportClient } from "../transport-client";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const serverInfoConfigSchema = z.object({});

export type ServerInfoConfig = z.infer<typeof serverInfoConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const serverInfoResultSchema = z.object({
  jenkinsVersion: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Jenkins Version",
  }),
  mode: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Server Mode",
  }),
  numExecutors: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Executors",
  }),
  usableWorkers: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Usable Workers",
  }),
  totalJobs: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Total Jobs",
  }),
  uptime: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Uptime",
    "x-chart-unit": "hours",
  }).optional(),
});

export type ServerInfoResult = z.infer<typeof serverInfoResultSchema>;

const serverInfoAggregatedSchema = z.object({
  avgExecutors: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Executors",
  }),
  avgTotalJobs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Jobs",
  }),
});

export type ServerInfoAggregatedResult = z.infer<
  typeof serverInfoAggregatedSchema
>;

// ============================================================================
// SERVER INFO COLLECTOR
// ============================================================================

/**
 * Built-in collector for Jenkins server information.
 * Fetches basic server health metrics via /api/json.
 */
export class ServerInfoCollector
  implements
    CollectorStrategy<
      JenkinsTransportClient,
      ServerInfoConfig,
      ServerInfoResult,
      ServerInfoAggregatedResult
    >
{
  id = "server-info";
  displayName = "Server Info";
  description = "Collects Jenkins server information and health metrics";

  supportedPlugins = [pluginMetadata];

  config = new Versioned({ version: 1, schema: serverInfoConfigSchema });
  result = new Versioned({ version: 1, schema: serverInfoResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: serverInfoAggregatedSchema,
  });

  async execute({
    client,
  }: {
    config: ServerInfoConfig;
    client: JenkinsTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<ServerInfoResult>> {
    const response = await client.exec({
      path: "/api/json",
      query: {
        tree: "mode,numExecutors,usableWorkers,jobs[name]",
      },
    });

    if (response.error) {
      return {
        result: {
          jenkinsVersion: "",
          mode: "",
          numExecutors: 0,
          usableWorkers: 0,
          totalJobs: 0,
        },
        error: response.error,
      };
    }

    const data = response.data as {
      mode?: string;
      numExecutors?: number;
      usableWorkers?: number;
      jobs?: Array<{ name: string }>;
    };

    return {
      result: {
        jenkinsVersion: response.jenkinsVersion || "unknown",
        mode: data.mode || "NORMAL",
        numExecutors: data.numExecutors || 0,
        usableWorkers: data.usableWorkers || 0,
        totalJobs: data.jobs?.length || 0,
      },
    };
  }

  aggregateResult(
    runs: HealthCheckRunForAggregation<ServerInfoResult>[]
  ): ServerInfoAggregatedResult {
    const executors = runs
      .map((r) => r.metadata?.numExecutors)
      .filter((v): v is number => typeof v === "number");

    const jobs = runs
      .map((r) => r.metadata?.totalJobs)
      .filter((v): v is number => typeof v === "number");

    return {
      avgExecutors:
        executors.length > 0
          ? Math.round(executors.reduce((a, b) => a + b, 0) / executors.length)
          : 0,
      avgTotalJobs:
        jobs.length > 0
          ? Math.round(jobs.reduce((a, b) => a + b, 0) / jobs.length)
          : 0,
    };
  }
}
