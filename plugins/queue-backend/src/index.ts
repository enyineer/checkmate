import { createBackendPlugin, coreServices, z } from "@checkmate/backend-api";
import {
  permissionList,
  permissions,
  UpdateQueueConfigurationSchema,
} from "@checkmate/queue-common";

export default createBackendPlugin({
  pluginId: "queue-backend",
  register(env) {
    env.registerPermissions(permissionList);

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        queuePluginRegistry: coreServices.queuePluginRegistry,
        queueFactory: coreServices.queueFactory,
        router: coreServices.httpRouter,
      },
      init: async ({ logger, queuePluginRegistry, queueFactory, router }) => {
        logger.info("📋 Initializing Queue Settings Backend...");

        // Get available queue plugins
        router.get(
          "/plugins",
          { permission: permissions.queueRead.id },
          (c) => {
            try {
              const plugins = queuePluginRegistry.getPlugins().map((p) => ({
                id: p.id,
                displayName: p.displayName,
                description: p.description,
                configVersion: p.configVersion,
                configSchema: z.toJSONSchema(p.configSchema),
              }));
              return c.json(plugins);
            } catch (error) {
              logger.error("Error fetching queue plugins:", error);
              return c.json({ error: String(error) }, 500);
            }
          }
        );

        // Get current queue configuration
        router.get(
          "/configuration",
          { permission: permissions.queueRead.id },
          async (c) => {
            try {
              const activePluginId = queueFactory.getActivePlugin();
              const plugin = queuePluginRegistry.getPlugin(activePluginId);

              if (!plugin) {
                return c.json({ error: "Active queue plugin not found" }, 404);
              }

              return c.json({
                pluginId: activePluginId,
                config: {}, // TODO: Store and retrieve actual config
              });
            } catch (error) {
              logger.error("Error fetching queue configuration:", error);
              return c.json({ error: String(error) }, 500);
            }
          }
        );

        // Update queue configuration
        router.put(
          "/configuration",
          {
            permission: permissions.queueManage.id,
            schema: UpdateQueueConfigurationSchema,
          },
          async (c) => {
            try {
              const { pluginId, config } = await c.req.json();

              await queueFactory.setActivePlugin(pluginId, config);

              logger.info(`Queue configuration updated to plugin: ${pluginId}`);

              return c.json({
                pluginId,
                config,
              });
            } catch (error) {
              logger.error("Error updating queue configuration:", error);
              return c.json({ error: String(error) }, 500);
            }
          }
        );
      },
    });
  },
});
