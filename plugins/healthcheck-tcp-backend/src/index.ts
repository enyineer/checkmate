import {
  createBackendPlugin,
  coreServices,
} from "@checkstack/backend-api";
import { TcpHealthCheckStrategy } from "./strategy";
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
        logger.debug("🔌 Registering TCP Health Check Strategy...");
        const strategy = new TcpHealthCheckStrategy();
        healthCheckRegistry.register(strategy);
      },
    });
  },
});
