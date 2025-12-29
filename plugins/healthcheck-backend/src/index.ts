import { Scheduler } from "./scheduler";
import * as schema from "./schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { permissionList } from "@checkmate/healthcheck-common";
import { createBackendPlugin, coreServices } from "@checkmate/backend-api";
import { createHealthCheckRouter } from "./router";

export default createBackendPlugin({
  pluginId: "healthcheck-backend",
  register(env) {
    env.registerPermissions(permissionList);

    env.registerInit({
      schema,
      deps: {
        logger: coreServices.logger,
        healthCheckRegistry: coreServices.healthCheckRegistry,
        rpc: coreServices.rpc,
        fetch: coreServices.fetch,
      },
      init: async ({ logger, database, healthCheckRegistry, rpc, fetch }) => {
        logger.info("🏥 Initializing Health Check Backend...");

        const scheduler = new Scheduler(
          database as unknown as NodePgDatabase<typeof schema>,
          healthCheckRegistry,
          logger,
          fetch
        );

        scheduler.start();

        const healthCheckRouter = createHealthCheckRouter(
          database as NodePgDatabase<typeof schema>
        );
        rpc.registerRouter("healthcheck-backend", healthCheckRouter);

        logger.info("✅ Health Check Backend initialized.");
      },
    });
  },
});
