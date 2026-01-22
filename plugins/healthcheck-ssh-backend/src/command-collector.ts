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
  healthResultSchema,
} from "@checkstack/healthcheck-common";
import { pluginMetadata as sshPluginMetadata } from "./plugin-metadata";
import type { SshTransportClient } from "@checkstack/healthcheck-ssh-common";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const commandConfigSchema = z.object({
  command: z.string().min(1).describe("Shell command to execute"),
});

export type CommandConfig = z.infer<typeof commandConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const commandResultSchema = healthResultSchema({
  exitCode: healthResultNumber({
    "x-chart-type": "counter",
    "x-chart-label": "Exit Code",
  }),
  stdout: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Standard Output",
  }),
  stderr: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Standard Error",
  }),
  executionTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Execution Time",
    "x-chart-unit": "ms",
  }),
});

export type CommandResult = z.infer<typeof commandResultSchema>;

const commandAggregatedDisplaySchema = healthResultSchema({
  avgExecutionTimeMs: healthResultNumber({
    "x-chart-type": "line",
    "x-chart-label": "Avg Execution Time",
    "x-chart-unit": "ms",
  }),
  successRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Success Rate",
    "x-chart-unit": "%",
  }),
});

const commandAggregatedInternalSchema = z.object({
  _executionTime: averageStateSchema
    .optional(),
  _success: rateStateSchema
    .optional(),
});

const commandAggregatedSchema = commandAggregatedDisplaySchema.merge(
  commandAggregatedInternalSchema,
);

export type CommandAggregatedResult = z.infer<typeof commandAggregatedSchema>;

// ============================================================================
// COMMAND COLLECTOR (PSEUDO-COLLECTOR)
// ============================================================================

/**
 * Built-in command collector for SSH strategy.
 * Allows users to run arbitrary shell commands as check items.
 * This is the "basic mode" functionality exposed as a collector.
 */
export class CommandCollector implements CollectorStrategy<
  SshTransportClient,
  CommandConfig,
  CommandResult,
  CommandAggregatedResult
> {
  /**
   * ID for this collector.
   * Built-in collectors are identified by ownerPlugin matching the strategy's plugin.
   * Fully-qualified: healthcheck-ssh.command
   */
  id = "command";
  displayName = "Shell Command";
  description = "Execute a shell command and check the result";

  supportedPlugins = [sshPluginMetadata];

  /** Allow multiple command instances per config */
  allowMultiple = true;

  config = new Versioned({ version: 1, schema: commandConfigSchema });
  result = new Versioned({ version: 1, schema: commandResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: commandAggregatedSchema,
  });

  async execute({
    config,
    client,
  }: {
    config: CommandConfig;
    client: SshTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<CommandResult>> {
    const startTime = Date.now();
    const result = await client.exec(config.command);
    const executionTimeMs = Date.now() - startTime;

    return {
      result: {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTimeMs,
      },
    };
  }

  mergeResult(
    existing: CommandAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<CommandResult>,
  ): CommandAggregatedResult {
    const metadata = run.metadata;

    const executionTimeState = mergeAverage(
      existing?._executionTime as AverageState | undefined,
      metadata?.executionTimeMs,
    );

    // Success is exit code 0
    const successState = mergeRate(
      existing?._success as RateState | undefined,
      metadata?.exitCode === 0,
    );

    return {
      avgExecutionTimeMs: executionTimeState.avg,
      successRate: successState.rate,
      _executionTime: executionTimeState,
      _success: successState,
    };
  }
}
