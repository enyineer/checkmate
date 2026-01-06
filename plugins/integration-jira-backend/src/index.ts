import {
  createBackendPlugin,
  coreServices,
} from "@checkmate-monitor/backend-api";
import { integrationProviderExtensionPoint } from "@checkmate-monitor/integration-backend";
import { pluginMetadata } from "@checkmate-monitor/integration-jira-common";
import { createConnectionService } from "./connection-service";
import { createJiraProvider } from "./provider";

export const jiraPlugin = createBackendPlugin({
  metadata: pluginMetadata,

  register(env) {
    // Register the Jira provider
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.config,
      },
      init: async ({ logger, config }) => {
        logger.debug("🔌 Registering Jira Integration Provider...");

        // Create connection service
        const connectionService = createConnectionService({
          configService: config,
          logger,
        });

        // Create and register the Jira provider
        const jiraProvider = createJiraProvider({ connectionService });
        const integrationExt = env.getExtensionPoint(
          integrationProviderExtensionPoint
        );
        integrationExt.addProvider(jiraProvider, pluginMetadata);

        logger.info("✅ Jira Integration Plugin registered");
      },
    });
  },
});

export default jiraPlugin;
