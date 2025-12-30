import { createBackendPlugin, coreServices } from "@checkmate/backend-api";
import { BullMQPlugin } from "./plugin";
import { permissionList } from "@checkmate/queue-bullmq-common";

export default createBackendPlugin({
  pluginId: "queue-bullmq-backend",
  register(env) {
    env.registerPermissions(permissionList);

    env.registerInit({
      deps: {
        queuePluginRegistry: coreServices.queuePluginRegistry,
        logger: coreServices.logger,
      },
      init: async ({ queuePluginRegistry, logger }) => {
        logger.debug("🔌 Registering BullMQ Queue Plugin...");
        const plugin = new BullMQPlugin();
        queuePluginRegistry.register(plugin);
      },
    });
  },
});
