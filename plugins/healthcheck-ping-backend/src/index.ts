import {
  createBackendPlugin,
  coreServices,
} from "@checkmate-monitor/backend-api";
import { PingHealthCheckStrategy } from "./strategy";
import { pluginMetadata } from "./plugin-metadata";

export default createBackendPlugin({
  metadata: pluginMetadata,
  register(env) {
    env.registerInit({
      deps: {
        healthCheckRegistry: coreServices.healthCheckRegistry,
        logger: coreServices.logger,
      },
      init: async ({ healthCheckRegistry, logger }) => {
        logger.debug("🔌 Registering Ping Health Check Strategy...");
        const strategy = new PingHealthCheckStrategy();
        healthCheckRegistry.register(strategy);
      },
    });
  },
});
