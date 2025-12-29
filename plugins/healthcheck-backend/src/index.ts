import { HealthCheckService } from "./service";
import { Scheduler } from "./scheduler";
import * as schema from "./schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  CreateHealthCheckConfigurationSchema,
  UpdateHealthCheckConfigurationSchema,
  AssociateHealthCheckSchema,
  permissionList,
  permissions,
} from "@checkmate/healthcheck-common";
import { createBackendPlugin, coreServices, z } from "@checkmate/backend-api";

export default createBackendPlugin({
  pluginId: "healthcheck-backend",
  register(env) {
    env.registerPermissions(permissionList);

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
        healthCheckRegistry: coreServices.healthCheckRegistry,
        router: coreServices.httpRouter,
        fetch: coreServices.fetch,
        auth: coreServices.auth,
      },
      init: async ({
        logger,
        database,
        healthCheckRegistry,
        router,
        fetch,
        auth,
      }) => {
        logger.info("🏥 Initializing Health Check Backend...");

        const service = new HealthCheckService(
          database as unknown as NodePgDatabase<typeof schema>
        );
        const scheduler = new Scheduler(
          database as unknown as NodePgDatabase<typeof schema>,
          healthCheckRegistry,
          logger,
          fetch,
          auth
        );

        scheduler.start();

        // Strategies
        router.get(
          "/strategies",
          { permission: permissions.healthCheckRead.id },
          (c) => {
            try {
              const strategies = healthCheckRegistry
                .getStrategies()
                .map((s) => ({
                  id: s.id,
                  displayName: s.displayName,
                  description: s.description,
                  configSchema: z.toJSONSchema(s.configSchema),
                }));
              return c.json(strategies);
            } catch (error) {
              console.error("Error fetching strategies:", error);
              return c.json({ error: String(error) }, 500);
            }
          }
        );

        // Configurations CRUD
        router.get(
          "/configurations",
          { permission: permissions.healthCheckRead.id },
          async (c) => {
            const configs = await service.getConfigurations();
            return c.json(configs);
          }
        );

        router.post(
          "/configurations",
          {
            permission: permissions.healthCheckManage.id,
            schema: CreateHealthCheckConfigurationSchema,
          },
          async (c) => {
            const body = await c.req.json();
            const config = await service.createConfiguration(body);
            return c.json(config, 201);
          }
        );

        router.put(
          "/configurations/:id",
          {
            permission: permissions.healthCheckManage.id,
            schema: UpdateHealthCheckConfigurationSchema,
          },
          async (c) => {
            const id = c.req.param("id");
            const body = await c.req.json();
            const config = await service.updateConfiguration(id, body);
            if (!config) return c.json({ error: "Not found" }, 404);
            return c.json(config);
          }
        );

        router.delete(
          "/configurations/:id",
          { permission: permissions.healthCheckManage.id },
          async (c) => {
            const id = c.req.param("id");
            await service.deleteConfiguration(id);
            // eslint-disable-next-line unicorn/no-null
            return c.body(null, 204);
          }
        );

        // System Associations
        router.get(
          "/systems/:systemId/checks",
          { permission: permissions.healthCheckRead.id },
          async (c) => {
            const systemId = c.req.param("systemId");
            const configs = await service.getSystemConfigurations(systemId);
            return c.json(configs);
          }
        );

        router.post(
          "/systems/:systemId/checks",
          {
            permission: permissions.healthCheckManage.id,
            schema: AssociateHealthCheckSchema,
          },
          async (c) => {
            const systemId = c.req.param("systemId");
            const { configurationId, enabled } = await c.req.json();
            await service.associateSystem(systemId, configurationId, enabled);
            // eslint-disable-next-line unicorn/no-null
            return c.body(null, 201);
          }
        );

        router.delete(
          "/systems/:systemId/checks/:configId",
          { permission: permissions.healthCheckManage.id },
          async (c) => {
            const systemId = c.req.param("systemId");
            const configId = c.req.param("configId");
            await service.disassociateSystem(systemId, configId);
            // eslint-disable-next-line unicorn/no-null
            return c.body(null, 204);
          }
        );

        router.get(
          "/history",
          { permission: permissions.healthCheckRead.id },
          async (c) => {
            const systemId = c.req.query("systemId");
            const configurationId = c.req.query("configurationId");
            const limit = c.req.query("limit")
              ? Number.parseInt(c.req.query("limit")!, 10)
              : undefined;

            const history = await service.getHistory({
              systemId,
              configurationId,
              limit,
            });
            return c.json(history);
          }
        );
      },
    });
  },
});
