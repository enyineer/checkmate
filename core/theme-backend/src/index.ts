import { createBackendPlugin, coreServices } from "@checkmate/backend-api";
import { pluginMetadata } from "@checkmate/theme-common";
import * as schema from "./schema";
import { createThemeRouter } from "./router";

export default createBackendPlugin({
  metadata: pluginMetadata,

  register(env) {
    // Register initialization logic with schema
    env.registerInit({
      schema,
      deps: {
        database: coreServices.database,
        rpc: coreServices.rpc,
      },
      init: async ({ database, rpc }) => {
        // Create and register the theme router
        const router = createThemeRouter(database);
        rpc.registerRouter(router);
      },
    });
  },
});
