import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createBackendPlugin } from "@checkmate/backend/src/plugin-system";
import { coreServices } from "@checkmate/backend/src/services/core-services";
import { jwtService } from "@checkmate/backend/src/services/jwt";
import * as schema from "./schema";

export default createBackendPlugin({
  pluginId: "auth-backend",
  register(env) {
    // 1. Register Init logic
    env.registerInit({
      deps: {
        database: coreServices.database,
        router: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      init: async ({ database, router, logger }) => {
        logger.info("Initializing Auth Backend...");

        const auth = betterAuth({
          database: drizzleAdapter(database, {
            provider: "pg",
            schema: { ...schema },
          }),
          emailAndPassword: { enabled: true },
        });

        router.on(["POST", "GET"], "/*", (c) => {
          return auth.handler(c.req.raw);
        });

        logger.info("✅ Auth Backend initialized.");
      },
    });
  },
});
