import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";
import fs from "node:fs";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { adminPool, db } from "./db";
import { plugins } from "./schema";
import { eq } from "drizzle-orm";
import { ServiceRegistry } from "./services/service-registry";
import {
  coreServices,
  BackendPlugin,
  ServiceRef,
  ExtensionPoint,
  Deps,
  ResolvedDeps,
  AuthService,
  PluginRouter,
  RouteOptions,
  authenticationStrategyServiceRef,
} from "@checkmate/backend-api";
import type { Permission } from "@checkmate/common";
import { rootLogger } from "./logger";
import { jwtService } from "./services/jwt";
import { CoreHealthCheckRegistry } from "./services/health-check-registry";
import z, { ZodSchema } from "zod";
import { Context, MiddlewareHandler, Handler } from "hono";
import { zValidator } from "@hono/zod-validator";
import { fixMigrationsSchemaReferences } from "./utils/fix-migrations";

interface PluginManifest {
  name: string;
  path: string;
  enabled: boolean;
  type: "backend" | "frontend" | "common";
}

interface PendingInit {
  pluginId: string;
  pluginPath: string;
  deps: Record<string, ServiceRef<unknown>>;
  init: (deps: Record<string, unknown>) => Promise<void>;
  schema?: Record<string, unknown>;
}

export class PluginManager {
  private registry = new ServiceRegistry();
  private extensionPointProxies = new Map<string, unknown>();
  private pluginRouters = new Map<string, Hono>();

  constructor() {
    this.registerCoreServices();
  }

  private registerCoreServices() {
    // 1. Database Factory (Scoped)
    this.registry.registerFactory(coreServices.database, async (pluginId) => {
      const assignedSchema = `plugin_${pluginId}`;

      // Ensure Schema Exists
      await adminPool.query(`CREATE SCHEMA IF NOT EXISTS "${assignedSchema}"`);

      // Create Scoped Connection
      const baseUrl = process.env.DATABASE_URL;
      if (!baseUrl) throw new Error("DATABASE_URL is not defined");

      const connector = baseUrl.includes("?") ? "&" : "?";
      const scopedUrl = `${baseUrl}${connector}options=-c%20search_path%3D${assignedSchema}`;

      const pluginPool = new Pool({ connectionString: scopedUrl });
      return drizzle(pluginPool);
    });

    // 2. Logger Factory
    this.registry.registerFactory(coreServices.logger, (pluginId) => {
      return rootLogger.child({ plugin: pluginId });
    });

    // 3. Auth Factory (Scoped)
    this.registry.registerFactory(coreServices.auth, (pluginId) => {
      const authService: AuthService = {
        authenticate: async (c: Context) => {
          const token = c.req.header("Authorization")?.replace("Bearer ", "");

          // Strategy A: Service Token
          if (token) {
            const payload = await jwtService.verify(token);
            if (payload) {
              return {
                id: (payload.sub as string) || (payload.service as string),
                permissions: ["*"], // Service tokens grant all
                roles: ["service"],
              };
            }
          }

          // Strategy B: User Token (via registered strategy)
          try {
            const authStrategy = await this.registry.get(
              authenticationStrategyServiceRef,
              pluginId
            );
            if (authStrategy) {
              return await authStrategy.validate(c.req.raw);
            }
          } catch {
            // No strategy registered yet
          }
        },

        getCredentials: async (c?: Context) => {
          if (c) {
            const authHeader = c.req.header("Authorization");
            if (authHeader) {
              return { headers: { Authorization: authHeader } };
            }
          }
          const token = await jwtService.sign({ service: pluginId }, "5m");
          return { headers: { Authorization: `Bearer ${token}` } };
        },

        authorize: (permission: string | string[]) => {
          return createMiddleware(async (c, next) => {
            const user = await authService.authenticate(c);
            if (!user) {
              return c.json({ error: "Unauthorized" }, 401);
            }

            const userPermissions = user.permissions || [];
            const perms = Array.isArray(permission) ? permission : [permission];

            const hasPermission = perms.some((p) => {
              const fullId = `${pluginId}.${p}`;
              return (
                userPermissions.includes("*") ||
                userPermissions.includes(fullId) ||
                userPermissions.includes(p)
              );
            });

            if (!hasPermission) {
              return c.json(
                { error: `Forbidden: Missing ${perms.join(" or ")}` },
                403
              );
            }

            await next();
          });
        },

        validate: (schema: ZodSchema) => createValidationMiddleware(schema),
      };
      return authService;
    });

    // 4. Fetch Factory (Scoped)
    this.registry.registerFactory(coreServices.fetch, async (pluginId) => {
      const auth = await this.registry.get(coreServices.auth, pluginId);
      return {
        fetch: async (input, init) => {
          const { headers } = await auth.getCredentials();
          const mergedHeaders = new Headers(init?.headers);
          for (const [k, v] of Object.entries(headers)) {
            mergedHeaders.set(k, v);
          }
          return fetch(input, { ...init, headers: mergedHeaders });
        },
      };
    });

    // 5. Health Check Registry (Global Singleton)
    const healthCheckRegistry = new CoreHealthCheckRegistry();
    this.registry.registerFactory(
      coreServices.healthCheckRegistry,
      () => healthCheckRegistry
    );

    // 6. Router Factory (Scoped)
    this.registry.registerFactory(coreServices.httpRouter, async (pluginId) => {
      const auth = await this.registry.get(coreServices.auth, pluginId);
      return this.createPluginRouter(pluginId, auth);
    });
  }

  private createPluginRouter(
    pluginId: string,
    authService: AuthService
  ): PluginRouter {
    const honoRouter = new Hono();
    this.pluginRouters.set(pluginId, honoRouter);

    const wrap = (
      method: "get" | "post" | "put" | "patch" | "delete" | "all"
    ) => {
      return (path: string, ...args: unknown[]) => {
        let options: RouteOptions | undefined;
        let handler: Handler;

        if (
          args.length === 2 &&
          typeof args[0] === "object" &&
          args[0] !== null &&
          !Array.isArray(args[0])
        ) {
          options = args[0] as RouteOptions;
          handler = args[1] as Handler;
        } else {
          handler = args.at(-1) as Handler;
        }

        const middlewares: MiddlewareHandler[] = [];
        if (options?.permission) {
          middlewares.push(authService.authorize(options.permission));
        }
        if (options?.schema) {
          middlewares.push(authService.validate(options.schema));
        }

        // We use a type cast to access the method dynamically while staying safe
        const router = honoRouter as unknown as Record<
          string,
          (path: string, ...handlers: MiddlewareHandler[]) => void
        >;
        router[method](
          path,
          ...middlewares,
          handler as unknown as MiddlewareHandler
        );
      };
    };

    return {
      get: wrap("get"),
      post: wrap("post"),
      put: wrap("put"),
      patch: wrap("patch"),
      delete: wrap("delete"),
      all: wrap("all"),
      use: (...args: unknown[]) =>
        (
          honoRouter as unknown as Record<string, (...a: unknown[]) => void>
        ).use(...args),
      hono: honoRouter,
    };
  }

  registerExtensionPoint<T>(ref: ExtensionPoint<T>, impl: T) {
    const proxy = this.getExtensionPointProxy(ref);
    (proxy as Record<string, (...args: unknown[]) => unknown>)[
      "$$setImplementation"
    ](impl);
    rootLogger.info(`   -> Registered extension point '${ref.id}'`);
  }

  getExtensionPoint<T>(ref: ExtensionPoint<T>): T {
    return this.getExtensionPointProxy(ref);
  }

  registerPermissions(pluginId: string, permissions: Permission[]) {
    const prefixed = permissions.map((p) => ({
      ...p,
      id: `${pluginId}.${p.id}`,
    }));
    rootLogger.info(
      `   -> Registered ${prefixed.length} permissions for ${pluginId}`
    );
    // TODO: Store these in a database or central registry
  }

  public sortPlugins(
    pendingInits: {
      pluginId: string;
      deps: Record<string, ServiceRef<unknown>>;
    }[],
    providedBy: Map<string, string>
  ): string[] {
    rootLogger.debug("🔄 Calculating initialization order...");

    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    for (const p of pendingInits) {
      inDegree.set(p.pluginId, 0);
      graph.set(p.pluginId, []);
    }

    for (const p of pendingInits) {
      const consumerId = p.pluginId;
      for (const [, ref] of Object.entries(p.deps)) {
        const serviceId = ref.id;
        const providerId = providedBy.get(serviceId);

        if (providerId && providerId !== consumerId) {
          if (!graph.has(providerId)) {
            graph.set(providerId, []);
          }
          graph.get(providerId)!.push(consumerId);
          inDegree.set(consumerId, (inDegree.get(consumerId) || 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [id, count] of inDegree.entries()) {
      if (count === 0) {
        queue.push(id);
      }
    }

    const sortedIds: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedIds.push(u);

      const dependents = graph.get(u) || [];
      for (const v of dependents) {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (sortedIds.length !== pendingInits.length) {
      throw new Error("Circular dependency detected");
    }

    return sortedIds;
  }

  private getExtensionPointProxy<T>(ref: ExtensionPoint<T>): T {
    let proxy = this.extensionPointProxies.get(ref.id) as T | undefined;
    if (!proxy) {
      const buffer: { method: string | symbol; args: unknown[] }[] = [];
      let implementation: T | undefined;

      proxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            if (prop === "$$setImplementation") {
              return (impl: T) => {
                implementation = impl;
                for (const call of buffer) {
                  (
                    implementation as Record<
                      string | symbol,
                      (...args: unknown[]) => unknown
                    >
                  )[call.method](...call.args);
                }
                buffer.length = 0;
              };
            }
            return (...args: unknown[]) => {
              if (implementation) {
                return (
                  implementation as Record<
                    string | symbol,
                    (...args: unknown[]) => unknown
                  >
                )[prop](...args);
              } else {
                buffer.push({ method: prop, args });
              }
            };
          },
        }
      ) as T;
      this.extensionPointProxies.set(ref.id, proxy);
    }
    return proxy;
  }

  async loadPlugins(rootRouter: Hono, manualPlugins: BackendPlugin[] = []) {
    rootLogger.info("🔍 Discovering plugins...");

    // 1. Discover local plugins from monorepo
    const localPlugins: PluginManifest[] = [];
    const pluginsDir = path.join(__dirname, "..", "..", "..", "plugins");

    if (fs.existsSync(pluginsDir)) {
      const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith("-backend")) {
          const pluginPath = path.join(pluginsDir, entry.name);
          localPlugins.push({
            name: entry.name,
            path: pluginPath,
            enabled: true, // Local plugins are always enabled in monorepo
            type: "backend",
          });
          rootLogger.debug(
            `   -> Discovered local backend plugin: ${entry.name}`
          );
        }
      }
    }

    // 2. Load remote plugins from database
    const dbPlugins = await db
      .select()
      .from(plugins)
      .where(eq(plugins.enabled, true));

    // 3. Combine and Deduplicate (Local takes precedence)
    const allPlugins: PluginManifest[] = [...localPlugins];
    const localNames = new Set(localPlugins.map((p) => p.name));

    for (const dbP of dbPlugins) {
      if (!localNames.has(dbP.name)) {
        allPlugins.push({
          name: dbP.name,
          path: dbP.path,
          enabled: dbP.enabled,
          type: dbP.type as "backend" | "frontend" | "common",
        });
      }
    }

    if (allPlugins.length === 0) {
      rootLogger.info("ℹ️  No enabled plugins found.");
      return;
    }

    // Phase 1: Load Modules & Register Services
    const pendingInits: PendingInit[] = [];

    const providedBy = new Map<string, string>(); // ServiceId -> PluginId

    for (const plugin of allPlugins) {
      rootLogger.info(`🔌 Loading module ${plugin.name}...`);

      let pluginModule;
      try {
        try {
          pluginModule = await import(plugin.name);
        } catch {
          pluginModule = await import(plugin.path);
        }

        const backendPlugin: BackendPlugin = pluginModule.default;
        this.registerPlugin(
          backendPlugin,
          plugin.path,
          pendingInits,
          providedBy
        );
      } catch (error) {
        rootLogger.error(`❌ Failed to load module for ${plugin.name}:`, error);
      }
    }

    // Phase 1.5: Register manual plugins
    for (const backendPlugin of manualPlugins) {
      this.registerPlugin(backendPlugin, "", pendingInits, providedBy);
    }

    // Phase 2: Initialize Plugins (Topological Sort)
    const sortedIds = this.sortPlugins(pendingInits, providedBy);
    rootLogger.info(`✅ Initialization Order: ${sortedIds.join(" -> ")}`);

    for (const id of sortedIds) {
      const p = pendingInits.find((x) => x.pluginId === id)!;
      rootLogger.info(`🚀 Initializing ${p.pluginId}...`);

      try {
        const pluginDb = await this.registry.get(
          coreServices.database,
          p.pluginId
        );

        // Run Migrations
        const migrationsFolder = path.join(p.pluginPath, "drizzle");
        if (fs.existsSync(migrationsFolder)) {
          try {
            // Fix any hardcoded "public" schema references
            fixMigrationsSchemaReferences(migrationsFolder);

            rootLogger.debug(
              `   -> Running migrations for ${p.pluginId} from ${migrationsFolder}`
            );
            await migrate(pluginDb, { migrationsFolder });
          } catch (error) {
            rootLogger.error(
              `❌ Failed migration of plugin ${p.pluginId}:`,
              error
            );
          }
        } else {
          rootLogger.debug(
            `   -> No migrations found for ${p.pluginId} (skipping)`
          );
        }

        // Resolve Dependencies
        const resolvedDeps: Record<string, unknown> = {};
        for (const [key, ref] of Object.entries(p.deps)) {
          resolvedDeps[key] = await this.registry.get(
            ref as ServiceRef<unknown>,
            p.pluginId
          );
        }

        // Inject Schema-aware Database if schema is provided
        // This takes precedence over any 'database' requested in deps
        if (p.schema) {
          const baseUrl = process.env.DATABASE_URL;
          const assignedSchema = `plugin_${p.pluginId}`;
          // Force search_path
          const scopedUrl = `${baseUrl}?options=-c%20search_path%3D${assignedSchema}`;
          const pluginPool = new Pool({ connectionString: scopedUrl });

          // Create schema-aware Drizzle instance
          resolvedDeps["database"] = drizzle(pluginPool, {
            schema: p.schema,
          });
        }

        try {
          await p.init(resolvedDeps);
          rootLogger.debug(`   -> Initialized ${p.pluginId}`);

          // Mount router if it was created
          const pluginRouter = this.pluginRouters.get(p.pluginId);
          if (pluginRouter) {
            rootRouter.route(`/api/${p.pluginId}`, pluginRouter);
          }
        } catch (error) {
          rootLogger.error(`❌ Failed to initialize ${p.pluginId}:`, error);
        }
      } catch (error) {
        rootLogger.error(
          `❌ Critical error loading plugin ${p.pluginId}:`,
          error
        );
      }
    }
  }

  private registerPlugin(
    backendPlugin: BackendPlugin,
    pluginPath: string,
    pendingInits: PendingInit[],
    providedBy: Map<string, string>
  ) {
    if (!backendPlugin || typeof backendPlugin.register !== "function") {
      rootLogger.warn(
        `Plugin ${
          backendPlugin?.pluginId || "unknown"
        } is not using new API. Skipping.`
      );
      return;
    }

    // Execute Register
    backendPlugin.register({
      registerInit: <
        D extends Deps,
        S extends Record<string, unknown> | undefined = undefined
      >(args: {
        deps: D;
        schema?: S;
        init: (
          deps: ResolvedDeps<D> &
            (S extends undefined
              ? unknown
              : { database: NodePgDatabase<NonNullable<S>> })
        ) => Promise<void>;
      }) => {
        pendingInits.push({
          pluginId: backendPlugin.pluginId,
          pluginPath: pluginPath,
          deps: args.deps,
          init: args.init as (deps: Record<string, unknown>) => Promise<void>,
          schema: args.schema,
        });
      },
      registerService: (ref: ServiceRef<unknown>, impl: unknown) => {
        this.registry.register(ref, impl);
        providedBy.set(ref.id, backendPlugin.pluginId);
        rootLogger.debug(`   -> Registered service '${ref.id}'`);
      },
      registerExtensionPoint: (ref, impl) => {
        this.registerExtensionPoint(ref, impl);
      },
      getExtensionPoint: (ref) => {
        return this.getExtensionPoint(ref);
      },
      registerPermissions: (permissions: Permission[]) => {
        this.registerPermissions(backendPlugin.pluginId, permissions);
      },
    });
  }

  async getService<T>(ref: ServiceRef<T>): Promise<T | undefined> {
    try {
      return await this.registry.get(ref, "core"); // Use 'core' as requester
    } catch {
      return undefined;
    }
  }

  registerService<T>(ref: ServiceRef<T>, impl: T) {
    this.registry.register(ref, impl);
  }
}

// Direct zValidator fits the signature logic but needs explicit typing for strictness
const createValidationMiddleware = (schema: ZodSchema): MiddlewareHandler =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: z.treeifyError(result.error) }, 400);
    }
  }) as unknown as MiddlewareHandler;
