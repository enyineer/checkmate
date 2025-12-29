import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  createBackendPlugin,
  authenticationStrategyServiceRef,
  RpcContext,
} from "@checkmate/backend-api";
import { coreServices } from "@checkmate/backend-api";
import { userInfoRef } from "./services/user-info";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { User } from "better-auth/types";
import { hashPassword } from "better-auth/crypto";
import { createExtensionPoint } from "@checkmate/backend-api";
import { enrichUser } from "./utils/user";
import { permissionList } from "@checkmate/auth-common";
import { createAuthRouter } from "./router";
import { call } from "@orpc/server";
import { decrypt, isEncrypted } from "./utils/encryption";
import { isSecretSchema, type AuthStrategy } from "@checkmate/backend-api";
import * as zod from "zod";

/**
 * Decrypts secret fields in a configuration object.
 */
function decryptSecrets(
  zodSchema: zod.ZodTypeAny,
  config: Record<string, unknown>
): Record<string, unknown> {
  if (!("shape" in zodSchema)) return config;

  const objectSchema = zodSchema as zod.ZodObject<zod.ZodRawShape>;
  const result: Record<string, unknown> = { ...config };

  for (const [key, fieldSchema] of Object.entries(objectSchema.shape)) {
    if (isSecretSchema(fieldSchema as zod.ZodTypeAny)) {
      const value = config[key];
      if (typeof value === "string" && isEncrypted(value)) {
        result[key] = decrypt(value);
      }
    }
  }

  return result;
}

export interface BetterAuthExtensionPoint {
  addStrategy(strategy: AuthStrategy<unknown>): void;
}

export const betterAuthExtensionPoint =
  createExtensionPoint<BetterAuthExtensionPoint>(
    "auth.betterAuthExtensionPoint"
  );

export default createBackendPlugin({
  pluginId: "auth-backend",
  register(env) {
    let auth: ReturnType<typeof betterAuth> | undefined;
    let db: NodePgDatabase<typeof schema> | undefined;

    const strategies: AuthStrategy<unknown>[] = [];

    // Strategy registry
    const strategyRegistry = {
      getStrategies: () => strategies,
    };

    env.registerPermissions(permissionList);

    env.registerExtensionPoint(betterAuthExtensionPoint, {
      addStrategy: (s) => strategies.push(s),
    });

    // Helper to fetch permissions
    const enrichUserLocal = async (user: User) => {
      if (!db) return user;
      return enrichUser(user, db);
    };

    // 1. Register User Info Service
    env.registerService(userInfoRef, {
      getUser: async (headers: Headers) => {
        if (!auth) {
          throw new Error("Auth backend not initialized");
        }

        const session = await auth.api.getSession({
          headers,
        });
        if (!session?.user) return;
        return enrichUserLocal(session.user);
      },
    });

    // 2. Register Authentication Strategy (used by Core AuthService)
    env.registerService(authenticationStrategyServiceRef, {
      validate: async (request: Request) => {
        if (!auth) {
          return; // Not initialized yet
        }

        // better-auth needs headers to validate session
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (!session?.user) return;
        return enrichUserLocal(session.user);
      },
    });

    // 3. Register Init logic
    env.registerInit({
      schema,
      deps: {
        database: coreServices.database,
        rpc: coreServices.rpc,
        logger: coreServices.logger,
        auth: coreServices.auth,
      },
      init: async ({ database, rpc, logger, auth: _auth }) => {
        logger.info("[auth-backend] Initializing Auth Backend...");

        db = database;

        // Function to initialize/reinitialize better-auth
        const initializeBetterAuth = async () => {
          // Fetch strategy configs from database
          const dbStrategies = await database
            .select()
            .from(schema.authStrategy);
          const isDisabled = (id: string) =>
            dbStrategies.find((s) => s.id === id)?.enabled === false;

          const socialProviders: Record<string, unknown> = {};
          for (const strategy of strategies) {
            logger.info(
              `[auth-backend]    -> Adding auth strategy: ${strategy.id}`
            );

            // Skip credential strategy - it's built into better-auth
            if (strategy.id === "credential") continue;

            // Find the database config for this strategy
            const dbStrategy = dbStrategies.find((s) => s.id === strategy.id);

            // Skip if disabled
            if (dbStrategy?.enabled === false) {
              logger.info(
                `[auth-backend]    -> Strategy ${strategy.id} is disabled, skipping`
              );
              continue;
            }

            // Get config from database
            if (!dbStrategy?.config) {
              logger.info(
                `[auth-backend]    -> Strategy ${strategy.id} has no config, skipping`
              );
              continue;
            }

            const versionedConfig = dbStrategy.config as {
              data: Record<string, unknown>;
              version: number;
            };

            // Decrypt secrets in the config
            const decryptedConfig = decryptSecrets(
              strategy.configSchema,
              versionedConfig.data
            );

            // Add to socialProviders
            socialProviders[strategy.id] = decryptedConfig;
          }

          return betterAuth({
            database: drizzleAdapter(database, {
              provider: "pg",
              schema: { ...schema },
            }),
            emailAndPassword: { enabled: !isDisabled("credential") },
            socialProviders,
            basePath: "/api/auth-backend",
            baseURL: process.env.VITE_API_BASE_URL || "http://localhost:3000",
            trustedOrigins: [
              process.env.FRONTEND_URL || "http://localhost:5173",
            ],
          });
        };

        // Initialize better-auth
        auth = await initializeBetterAuth();

        // Reload function for dynamic auth config changes
        const reloadAuth = async () => {
          logger.info(
            "[auth-backend] Reloading authentication configuration..."
          );
          auth = await initializeBetterAuth();
          logger.info("[auth-backend] ✅ Authentication reloaded successfully");
        };

        // 4. Register oRPC router
        const authRouter = createAuthRouter(
          database as NodePgDatabase<typeof schema>,
          strategyRegistry,
          reloadAuth
        );
        rpc.registerRouter("auth-backend", authRouter);

        // 5. Register Better Auth native handler
        rpc.registerHttpHandler("/api/auth-backend", (req) =>
          auth!.handler(req)
        );

        // REST Compatibility Layer for legacy frontend calls
        rpc.registerHttpHandler(
          "/api/auth-backend/permissions",
          async (req) => {
            const session = await auth!.api.getSession({
              headers: req.headers,
            });
            const user = session?.user
              ? await enrichUserLocal(session.user)
              : undefined;
            return Response.json({
              permissions:
                (user as { permissions?: string[] })?.permissions || [],
            });
          }
        );

        rpc.registerHttpHandler("/api/auth-backend/users", async () => {
          const users = await call(authRouter.getUsers, undefined, {
            context: {} as RpcContext,
          });
          return Response.json(users);
        });

        rpc.registerHttpHandler("/api/auth-backend/roles", async () => {
          const roles = await call(authRouter.getRoles, undefined, {
            context: {} as RpcContext,
          });
          return Response.json(roles);
        });

        rpc.registerHttpHandler("/api/auth-backend/strategies", async () => {
          const strategies = await call(authRouter.getStrategies, undefined, {
            context: {} as RpcContext,
          });
          return Response.json(strategies);
        });

        // User management and strategy settings are now handled via oRPC router in ./router.ts

        // 4. Idempotent Seeding
        logger.info("🌱 Checking for initial admin user...");
        const adminRole = await database
          .select()
          .from(schema.role)
          .where(eq(schema.role.id, "admin"));
        if (adminRole.length === 0) {
          await database.insert(schema.role).values({
            id: "admin",
            name: "Administrator",
            isSystem: true,
          });
          logger.info("   -> Created 'admin' role.");
        }

        const adminUser = await database
          .select()
          .from(schema.user)
          .where(eq(schema.user.email, "admin@checkmate.local"));

        if (adminUser.length === 0) {
          const adminId = "initial-admin-id";
          await database.insert(schema.user).values({
            id: adminId,
            name: "Admin",
            email: "admin@checkmate.local",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const hashedAdminPassword = await hashPassword("admin");
          await database.insert(schema.account).values({
            id: "initial-admin-account-id",
            accountId: "admin@checkmate.local",
            providerId: "credential",
            userId: adminId,
            password: hashedAdminPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await database.insert(schema.userRole).values({
            userId: adminId,
            roleId: "admin",
          });

          logger.info(
            "   -> Created initial admin user (admin@checkmate.local : admin)"
          );
        }

        logger.info("✅ Auth Backend initialized.");
      },
    });
  },
});
