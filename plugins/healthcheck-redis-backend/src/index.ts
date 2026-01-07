import {
  createBackendPlugin,
  coreServices,
} from "@checkmate-monitor/backend-api";
import { RedisHealthCheckStrategy } from "./strategy";
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
        logger.debug("🔌 Registering Redis Health Check Strategy...");
        const strategy = new RedisHealthCheckStrategy();
        healthCheckRegistry.register(strategy);
      },
    });
  },
});
