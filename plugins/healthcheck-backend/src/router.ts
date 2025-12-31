import { implement, ORPCError } from "@orpc/server";
import {
  autoAuthMiddleware,
  zod,
  type RpcContext,
} from "@checkmate/backend-api";
import { healthCheckContract } from "@checkmate/healthcheck-common";
import { HealthCheckService } from "./service";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Creates the healthcheck router using contract-based implementation.
 *
 * Auth and permissions are automatically enforced via autoAuthMiddleware
 * based on the contract's meta.userType and meta.permissions.
 */
export const createHealthCheckRouter = (
  database: NodePgDatabase<typeof schema>
) => {
  // Create contract implementer with context type AND auto auth middleware
  const os = implement(healthCheckContract)
    .$context<RpcContext>()
    .use(autoAuthMiddleware);

  return os.router({
    getStrategies: os.getStrategies.handler(async ({ context }) => {
      return context.healthCheckRegistry.getStrategies().map((s) => ({
        id: s.id,
        displayName: s.displayName,
        description: s.description,
        configSchema: zod.toJSONSchema(s.configSchema),
      }));
    }),

    getConfigurations: os.getConfigurations.handler(async () => {
      const service = new HealthCheckService(database);
      return service.getConfigurations();
    }),

    createConfiguration: os.createConfiguration.handler(async ({ input }) => {
      const service = new HealthCheckService(database);
      return service.createConfiguration(input);
    }),

    updateConfiguration: os.updateConfiguration.handler(async ({ input }) => {
      const service = new HealthCheckService(database);
      const config = await service.updateConfiguration(input.id, input.body);
      if (!config) {
        throw new ORPCError("NOT_FOUND", {
          message: "Configuration not found",
        });
      }
      return config;
    }),

    deleteConfiguration: os.deleteConfiguration.handler(async ({ input }) => {
      const service = new HealthCheckService(database);
      await service.deleteConfiguration(input);
    }),

    getSystemConfigurations: os.getSystemConfigurations.handler(
      async ({ input }) => {
        const service = new HealthCheckService(database);
        return service.getSystemConfigurations(input);
      }
    ),

    associateSystem: os.associateSystem.handler(async ({ input, context }) => {
      const service = new HealthCheckService(database);
      await service.associateSystem(
        input.systemId,
        input.body.configurationId,
        input.body.enabled
      );

      // If enabling the health check, schedule it immediately
      if (input.body.enabled) {
        const config = await service.getConfiguration(
          input.body.configurationId
        );
        if (config) {
          const { scheduleHealthCheck } = await import("./queue-executor");
          await scheduleHealthCheck({
            queueFactory: context.queueFactory,
            payload: {
              configId: config.id,
              systemId: input.systemId,
            },
            intervalSeconds: config.intervalSeconds,
          });
        }
      }
    }),

    disassociateSystem: os.disassociateSystem.handler(async ({ input }) => {
      const service = new HealthCheckService(database);
      await service.disassociateSystem(input.systemId, input.configId);
    }),

    getHistory: os.getHistory.handler(async ({ input }) => {
      const service = new HealthCheckService(database);
      const history = await service.getHistory(input);
      // Schema now uses pgEnum and typed jsonb - no manual casting needed
      return history.map((run) => ({
        id: run.id,
        configurationId: run.configurationId,
        systemId: run.systemId,
        status: run.status,
        result: run.result ?? {},
        timestamp: run.timestamp,
      }));
    }),
  });
};

export type HealthCheckRouter = ReturnType<typeof createHealthCheckRouter>;
