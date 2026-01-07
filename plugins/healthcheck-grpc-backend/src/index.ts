import {
  createBackendPlugin,
  coreServices,
} from "@checkmate-monitor/backend-api";
import { GrpcHealthCheckStrategy } from "./strategy";
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
        logger.debug("🔌 Registering gRPC Health Check Strategy...");
        const strategy = new GrpcHealthCheckStrategy();
        healthCheckRegistry.register(strategy);
      },
    });
  },
});
