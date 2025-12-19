import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createBackendPlugin } from "@checkmate/backend/src/plugin-system";
import { coreServices } from "@checkmate/backend/src/services/core-services";
import { jwtService } from "@checkmate/backend/src/services/jwt";
import { authServiceRef } from "./service-refs";
import * as schema from "./schema";

export default createBackendPlugin({
  pluginId: "auth-backend",
  register(env) {
    // 1. Register the AuthService implementation
    env.registerService(authServiceRef, {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        // Sign a short-lived service token
        const token = await jwtService.sign(
          { service: "auth-backend-client" },
          "5m"
        );
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
      verify: async (token: string) => {
        return await jwtService.verify(token);
      },
    });

    // 2. Register Init logic
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
