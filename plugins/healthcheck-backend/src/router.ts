import {
  os,
  authedProcedure,
  permissionMiddleware,
  zod,
} from "@checkmate/backend-api";
import {
  CreateHealthCheckConfigurationSchema,
  UpdateHealthCheckConfigurationSchema,
  AssociateHealthCheckSchema,
  permissions,
} from "@checkmate/healthcheck-common";
import { HealthCheckService } from "./service";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const healthCheckRead = permissionMiddleware(permissions.healthCheckRead.id);
const healthCheckManage = permissionMiddleware(
  permissions.healthCheckManage.id
);

export const createHealthCheckRouter = (
  database: NodePgDatabase<typeof schema>
) => {
  return os.router({
    getStrategies: authedProcedure
      .use(healthCheckRead)
      .handler(async ({ context }) => {
        return context.healthCheckRegistry.getStrategies().map((s) => ({
          id: s.id,
          displayName: s.displayName,
          description: s.description,
          configSchema: zod.toJSONSchema(s.configSchema),
        }));
      }),

    getConfigurations: authedProcedure
      .use(healthCheckRead)
      .handler(async () => {
        const service = new HealthCheckService(database);
        return service.getConfigurations();
      }),

    createConfiguration: authedProcedure
      .use(healthCheckManage)
      .input(CreateHealthCheckConfigurationSchema)
      .handler(async ({ input }) => {
        const service = new HealthCheckService(database);
        return service.createConfiguration(input);
      }),

    updateConfiguration: authedProcedure
      .use(healthCheckManage)
      .input(
        zod.object({
          id: zod.string(),
          body: UpdateHealthCheckConfigurationSchema,
        })
      )
      .handler(async ({ input }) => {
        const service = new HealthCheckService(database);
        const config = await service.updateConfiguration(input.id, input.body);
        if (!config) throw new Error("Not found");
        return config;
      }),

    deleteConfiguration: authedProcedure
      .use(healthCheckManage)
      .input(zod.string())
      .handler(async ({ input }) => {
        const service = new HealthCheckService(database);
        await service.deleteConfiguration(input);
      }),

    getSystemConfigurations: authedProcedure
      .use(healthCheckRead)
      .input(zod.string())
      .handler(async ({ input }) => {
        const service = new HealthCheckService(database);
        return service.getSystemConfigurations(input);
      }),

    associateSystem: authedProcedure
      .use(healthCheckManage)
      .input(
        zod.object({ systemId: zod.string(), body: AssociateHealthCheckSchema })
      )
      .handler(async ({ input, context }) => {
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
            // Import scheduleHealthCheck at the top of the function to avoid circular dependencies
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

    disassociateSystem: authedProcedure
      .use(healthCheckManage)
      .input(zod.object({ systemId: zod.string(), configId: zod.string() }))
      .handler(async ({ input }) => {
        const service = new HealthCheckService(database);
        await service.disassociateSystem(input.systemId, input.configId);
      }),

    getHistory: authedProcedure
      .use(healthCheckRead)
      .input(
        zod.object({
          systemId: zod.string().optional(),
          configurationId: zod.string().optional(),
          limit: zod.number().optional(),
        })
      )
      .handler(async ({ input }) => {
        const service = new HealthCheckService(database);
        return service.getHistory(input);
      }),
  });
};

export type HealthCheckRouter = ReturnType<typeof createHealthCheckRouter>;
