import {
  Versioned,
  z,
  type HealthCheckRunForAggregation,
  type CollectorResult,
  type CollectorStrategy,
} from "@checkstack/backend-api";
import {
  healthResultBoolean,
  healthResultNumber,
  healthResultString,
} from "@checkstack/healthcheck-common";
import { pluginMetadata } from "../plugin-metadata";
import type { JenkinsTransportClient } from "../transport-client";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const nodeHealthConfigSchema = z.object({
  nodeName: z
    .string()
    .optional()
    .describe("Specific node name to check (leave empty for all nodes)"),
});

export type NodeHealthConfig = z.infer<typeof nodeHealthConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const nodeHealthResultSchema = z.object({
  totalNodes: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Total Nodes",
  }),
  onlineNodes: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Online Nodes",
  }),
  offlineNodes: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Offline Nodes",
  }),
  busyExecutors: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Busy Executors",
  }),
  idleExecutors: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Idle Executors",
  }),
  totalExecutors: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Total Executors",
  }),
  executorUtilization: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Executor Utilization",
    "x-chart-unit": "%",
  }),
  // For single node mode
  nodeDisplayName: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Node Name",
  }).optional(),
  nodeOffline: healthResultBoolean({
    "x-chart-type": "boolean",
    "x-chart-label": "Node Offline",
  }).optional(),
  nodeOfflineReason: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Offline Reason",
  }).optional(),
});

export type NodeHealthResult = z.infer<typeof nodeHealthResultSchema>;

const nodeHealthAggregatedSchema = z.object({
  avgOnlineNodes: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Online Nodes",
  }),
  avgUtilization: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Avg Utilization",
    "x-chart-unit": "%",
  }),
  minOnlineNodes: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Min Online Nodes",
  }),
});

export type NodeHealthAggregatedResult = z.infer<
  typeof nodeHealthAggregatedSchema
>;

// ============================================================================
// NODE HEALTH COLLECTOR
// ============================================================================

/**
 * Collector for Jenkins node/agent health.
 * Monitors node availability and executor utilization.
 */
export class NodeHealthCollector
  implements
    CollectorStrategy<
      JenkinsTransportClient,
      NodeHealthConfig,
      NodeHealthResult,
      NodeHealthAggregatedResult
    >
{
  id = "node-health";
  displayName = "Node Health";
  description = "Monitor Jenkins agent/node availability and executor usage";

  supportedPlugins = [pluginMetadata];
  allowMultiple = true;

  config = new Versioned({ version: 1, schema: nodeHealthConfigSchema });
  result = new Versioned({ version: 1, schema: nodeHealthResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: nodeHealthAggregatedSchema,
  });

  async execute({
    config,
    client,
  }: {
    config: NodeHealthConfig;
    client: JenkinsTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<NodeHealthResult>> {
    // If checking a specific node
    if (config.nodeName) {
      return this.executeForSingleNode(config.nodeName, client);
    }

    // Otherwise, get all nodes
    return this.executeForAllNodes(client);
  }

  private async executeForSingleNode(
    nodeName: string,
    client: JenkinsTransportClient
  ): Promise<CollectorResult<NodeHealthResult>> {
    const encodedName = encodeURIComponent(nodeName);
    const response = await client.exec({
      path: `/computer/${encodedName}/api/json`,
      query: {
        tree: "displayName,offline,offlineCauseReason,numExecutors,idle,temporarilyOffline",
      },
    });

    if (response.error) {
      return {
        result: {
          totalNodes: 0,
          onlineNodes: 0,
          offlineNodes: 0,
          busyExecutors: 0,
          idleExecutors: 0,
          totalExecutors: 0,
          executorUtilization: 0,
        },
        error: response.error,
      };
    }

    const data = response.data as {
      displayName?: string;
      offline?: boolean;
      offlineCauseReason?: string;
      numExecutors?: number;
      idle?: boolean;
      temporarilyOffline?: boolean;
    };

    const isOffline = data.offline ?? false;
    const numExecutors = data.numExecutors ?? 0;
    const busyExecutors = isOffline ? 0 : data.idle ? 0 : numExecutors;
    const idleExecutors = numExecutors - busyExecutors;

    const result: NodeHealthResult = {
      totalNodes: 1,
      onlineNodes: isOffline ? 0 : 1,
      offlineNodes: isOffline ? 1 : 0,
      busyExecutors,
      idleExecutors,
      totalExecutors: numExecutors,
      executorUtilization:
        numExecutors > 0 ? Math.round((busyExecutors / numExecutors) * 100) : 0,
      nodeDisplayName: data.displayName,
      nodeOffline: isOffline,
      nodeOfflineReason: data.offlineCauseReason,
    };

    return {
      result,
      error: isOffline
        ? `Node offline: ${data.offlineCauseReason || "Unknown reason"}`
        : undefined,
    };
  }

  private async executeForAllNodes(
    client: JenkinsTransportClient
  ): Promise<CollectorResult<NodeHealthResult>> {
    const response = await client.exec({
      path: "/computer/api/json",
      query: {
        tree: "busyExecutors,computer[displayName,offline,numExecutors,idle],totalExecutors",
      },
    });

    if (response.error) {
      return {
        result: {
          totalNodes: 0,
          onlineNodes: 0,
          offlineNodes: 0,
          busyExecutors: 0,
          idleExecutors: 0,
          totalExecutors: 0,
          executorUtilization: 0,
        },
        error: response.error,
      };
    }

    const data = response.data as {
      busyExecutors?: number;
      totalExecutors?: number;
      computer?: Array<{
        displayName?: string;
        offline?: boolean;
        numExecutors?: number;
        idle?: boolean;
      }>;
    };

    const nodes = data.computer || [];
    const onlineNodes = nodes.filter((n) => !n.offline).length;
    const offlineNodes = nodes.filter((n) => n.offline).length;
    const totalExecutors = data.totalExecutors ?? 0;
    const busyExecutors = data.busyExecutors ?? 0;
    const idleExecutors = totalExecutors - busyExecutors;

    const result: NodeHealthResult = {
      totalNodes: nodes.length,
      onlineNodes,
      offlineNodes,
      busyExecutors,
      idleExecutors,
      totalExecutors,
      executorUtilization:
        totalExecutors > 0
          ? Math.round((busyExecutors / totalExecutors) * 100)
          : 0,
    };

    // Warn if nodes are offline
    const hasIssue = offlineNodes > 0;

    return {
      result,
      error: hasIssue
        ? `${offlineNodes} of ${nodes.length} nodes offline`
        : undefined,
    };
  }

  aggregateResult(
    runs: HealthCheckRunForAggregation<NodeHealthResult>[]
  ): NodeHealthAggregatedResult {
    const onlineNodes = runs
      .map((r) => r.metadata?.onlineNodes)
      .filter((v): v is number => typeof v === "number");

    const utilizations = runs
      .map((r) => r.metadata?.executorUtilization)
      .filter((v): v is number => typeof v === "number");

    return {
      avgOnlineNodes:
        onlineNodes.length > 0
          ? Math.round(
              onlineNodes.reduce((a, b) => a + b, 0) / onlineNodes.length
            )
          : 0,
      avgUtilization:
        utilizations.length > 0
          ? Math.round(
              utilizations.reduce((a, b) => a + b, 0) / utilizations.length
            )
          : 0,
      minOnlineNodes: onlineNodes.length > 0 ? Math.min(...onlineNodes) : 0,
    };
  }
}
