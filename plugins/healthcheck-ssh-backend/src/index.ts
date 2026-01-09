import {
  createBackendPlugin,
  coreServices,
} from "@checkstack/backend-api";
import { SshHealthCheckStrategy } from "./strategy";
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
        logger.debug("🔌 Registering SSH Health Check Strategy...");
        const strategy = new SshHealthCheckStrategy();
        healthCheckRegistry.register(strategy);
      },
    });
  },
});
