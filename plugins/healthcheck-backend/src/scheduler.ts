import { HealthCheckRegistry, Logger } from "@checkmate/backend-api";
import {
  healthCheckConfigurations,
  systemHealthChecks,
  healthCheckRuns,
} from "./schema";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

type Db = NodePgDatabase<typeof schema>;

export class Scheduler {
  private interval: Timer | undefined;
  private isRunning = false;

  constructor(
    private db: Db,
    private registry: HealthCheckRegistry,
    private logger: Logger
  ) {}

  start(intervalMs = 10_000) {
    if (this.interval) return;
    this.logger.info("⏱️ Starting Health Check Scheduler...");
    this.interval = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private async tick() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // 1. Find checks that need to run
      // A check needs to run if:
      // - It is enabled for a system
      // - (Now - LastRun) > Interval  OR LastRun is null
      // For simplicity in this iteration, we will implement a naive "run everything every tick"
      // or "run if explicit interval passed" logic if we tracked last_run per system-config.
      // We didn't add last_run to systemHealthChecks yet, so we'll just run all enabled checks
      // and maybe optimize later or add it to schema now?
      // Optimization: Let's fetch all enabled system checks.

      const checksToRun = await this.db
        .select({
          systemId: systemHealthChecks.systemId,
          configId: healthCheckConfigurations.id,
          strategyId: healthCheckConfigurations.strategyId,
          config: healthCheckConfigurations.config,
          interval: healthCheckConfigurations.intervalSeconds,
        })
        .from(systemHealthChecks)
        .innerJoin(
          healthCheckConfigurations,
          eq(systemHealthChecks.configurationId, healthCheckConfigurations.id)
        )
        .where(eq(systemHealthChecks.enabled, true));

      for (const check of checksToRun) {
        // TODO: Check last run time to respect interval.
        // For now, we will just run it.
        await this.executeCheck({
          ...check,
          config: check.config as Record<string, unknown>,
        });
      }
    } catch (error) {
      this.logger.error("Error in Scheduler tick", error);
    } finally {
      this.isRunning = false;
    }
  }

  private async executeCheck(check: {
    systemId: string;
    configId: string;
    strategyId: string;
    config: Record<string, unknown>;
  }) {
    const strategy = this.registry.getStrategy(check.strategyId);
    if (!strategy) {
      this.logger.warn(
        `Strategy ${check.strategyId} not found for config ${check.configId}`
      );
      return;
    }

    try {
      const result = await strategy.execute(check.config);

      await this.db.insert(healthCheckRuns).values({
        configurationId: check.configId,
        systemId: check.systemId,
        status: result.status,
        result: result,
      });

      this.logger.debug(
        `Ran check ${check.configId} for system ${check.systemId}: ${result.status}`
      );
    } catch (error) {
      this.logger.error(`Failed to execute check ${check.configId}`, error);
      await this.db.insert(healthCheckRuns).values({
        configurationId: check.configId,
        systemId: check.systemId,
        status: "unhealthy",
        result: { error: String(error) },
      });
    }
  }
}
