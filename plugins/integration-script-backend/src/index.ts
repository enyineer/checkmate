import { createBackendPlugin, coreServices } from "@checkstack/backend-api";
import { integrationProviderExtensionPoint } from "@checkstack/integration-backend";
import { pluginMetadata } from "./plugin-metadata";
import { scriptProvider } from "./provider";
import { bashProvider } from "./bash-provider";

export default createBackendPlugin({
  metadata: pluginMetadata,

  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
      },
      init: async ({ logger }) => {
        logger.debug("🔌 Registering Script Integration Providers...");

        // Get the integration provider extension point
        const extensionPoint = env.getExtensionPoint(
          integrationProviderExtensionPoint,
        );

        // Register both providers
        extensionPoint.addProvider(scriptProvider, pluginMetadata);
        extensionPoint.addProvider(bashProvider, pluginMetadata);

        logger.debug("✅ Script and Bash Integration Providers registered.");
      },
    });
  },
});
