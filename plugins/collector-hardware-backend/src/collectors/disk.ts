import {
  Versioned,
  z,
  type HealthCheckRunForAggregation,
  type CollectorResult,
  type CollectorStrategy,
  mergeAverage,
  mergeMinMax,
  averageStateSchema,
  minMaxStateSchema,
  type AverageState,
  type MinMaxState,
} from "@checkstack/backend-api";
import {
  healthResultNumber,
  healthResultString,
} from "@checkstack/healthcheck-common";
import {
  pluginMetadata as sshPluginMetadata,
  type SshTransportClient,
} from "@checkstack/healthcheck-ssh-common";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const diskConfigSchema = z.object({
  mountPoint: z
    .string()
    .default("/")
    .describe("Mount point to monitor (e.g., /, /home, /var)"),
});

export type DiskConfig = z.infer<typeof diskConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const diskResultSchema = z.object({
  filesystem: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Filesystem",
  }),
  totalGb: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Total Disk",
    "x-chart-unit": "GB",
  }),
  usedGb: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Used Disk",
    "x-chart-unit": "GB",
  }),
  availableGb: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Available Disk",
    "x-chart-unit": "GB",
  }),
  usedPercent: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Disk Usage",
    "x-chart-unit": "%",
  }),
  mountPoint: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Mount Point",
  }),
});

export type DiskResult = z.infer<typeof diskResultSchema>;

const diskAggregatedDisplaySchema = z.object({
  avgUsedPercent: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Disk Usage",
    "x-chart-unit": "%",
  }),
  maxUsedPercent: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Max Disk Usage",
    "x-chart-unit": "%",
  }),
});

const diskAggregatedInternalSchema = z.object({
  _usage: averageStateSchema.optional(),
  _maxUsage: minMaxStateSchema.optional(),
});

const diskAggregatedSchema = diskAggregatedDisplaySchema.merge(
  diskAggregatedInternalSchema,
);

export type DiskAggregatedResult = z.infer<typeof diskAggregatedSchema>;

// ============================================================================
// DISK COLLECTOR
// ============================================================================

export class DiskCollector implements CollectorStrategy<
  SshTransportClient,
  DiskConfig,
  DiskResult,
  DiskAggregatedResult
> {
  id = "disk";
  displayName = "Disk Metrics";
  description = "Collects disk usage for a specific mount point via SSH";

  supportedPlugins = [sshPluginMetadata];

  config = new Versioned({ version: 1, schema: diskConfigSchema });
  result = new Versioned({ version: 1, schema: diskResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: diskAggregatedSchema,
  });

  async execute({
    config,
    client,
  }: {
    config: DiskConfig;
    client: SshTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<DiskResult>> {
    // Use df with specific mount point, output in 1G blocks
    const dfResult = await client.exec(`df -BG ${config.mountPoint} | tail -1`);
    const parsed = this.parseDfOutput(dfResult.stdout, config.mountPoint);

    return { result: parsed };
  }

  mergeResult(
    existing: DiskAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<DiskResult>,
  ): DiskAggregatedResult {
    const metadata = run.metadata;

    const usageState = mergeAverage(
      existing?._usage as AverageState | undefined,
      metadata?.usedPercent,
    );

    const maxUsageState = mergeMinMax(
      existing?._maxUsage as MinMaxState | undefined,
      metadata?.usedPercent,
    );

    return {
      avgUsedPercent: usageState.avg,
      maxUsedPercent: maxUsageState.max,
      _usage: usageState,
      _maxUsage: maxUsageState,
    };
  }

  // ============================================================================
  // PARSING HELPERS
  // ============================================================================

  private parseGb(val: string): number {
    // Remove 'G' suffix and parse
    return Number.parseInt(val.replace(/G$/i, ""), 10) || 0;
  }

  private parseDfOutput(output: string, mountPoint: string): DiskResult {
    // Format: Filesystem     1G-blocks  Used Available Use% Mounted on
    //         /dev/sda1          100G   45G       55G  45% /
    const parts = output.trim().split(/\s+/);

    const filesystem = parts[0] || "unknown";
    const totalGb = this.parseGb(parts[1]);
    const usedGb = this.parseGb(parts[2]);
    const availableGb = this.parseGb(parts[3]);
    const usedPercent = Number.parseInt(parts[4]?.replace(/%$/, ""), 10) || 0;

    return {
      filesystem,
      totalGb,
      usedGb,
      availableGb,
      usedPercent,
      mountPoint,
    };
  }

  private avg(nums: number[]): number {
    return (
      Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
    );
  }
}
