import { createBackendPlugin } from "@checkmate-monitor/backend-api";
import { coreServices } from "@checkmate-monitor/backend-api";
import {
  pluginMetadata,
  commandContract,
} from "@checkmate-monitor/command-common";
import { createCommandRouter } from "./router";

// Re-export registry functions for other plugins to use
export {
  registerSearchProvider,
  unregisterSearchProvider,
  clearRegistry,
  type BackendSearchProvider,
  type SearchContext,
  type CommandDefinition,
  type RegisterSearchProviderOptions,
} from "./registry";

export default createBackendPlugin({
  metadata: pluginMetadata,
  register(env) {
    env.registerInit({
      deps: {
        rpc: coreServices.rpc,
        logger: coreServices.logger,
      },
      init: async ({ rpc, logger }) => {
        logger.debug("Initializing Command Backend...");

        // Register oRPC router
        const commandRouter = createCommandRouter();
        rpc.registerRouter(commandRouter, commandContract);

        logger.debug("✅ Command Backend initialized.");
      },
    });
  },
});
