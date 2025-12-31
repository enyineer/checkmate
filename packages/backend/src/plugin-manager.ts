import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";
import fs from "node:fs";
import { Hono } from "hono";
import { adminPool, db } from "./db";
import { plugins } from "./schema";
import { eq, and } from "drizzle-orm";
import { ServiceRegistry } from "./services/service-registry";
import {
  coreServices,
  BackendPlugin,
  AfterPluginsReadyContext,
  DatabaseDeps,
  ServiceRef,
  ExtensionPoint,
  Deps,
  ResolvedDeps,
  coreHooks,
  HookSubscribeOptions,
} from "@checkmate/backend-api";
import type { Permission } from "@checkmate/common";
import { rootLogger } from "./logger";
import { fixMigrationsSchemaReferences } from "./utils/fix-migrations";
import {
  discoverLocalPlugins,
  syncPluginsToDatabase,
} from "./utils/plugin-discovery";

// Extracted modules
import { type InitCallback, type PendingInit } from "./plugin-manager/types";
import { registerCoreServices } from "./plugin-manager/core-services";
import {
  createApiRouteHandler,
  registerApiRoute,
} from "./plugin-manager/api-router";

export class PluginManager {
  private registry = new ServiceRegistry();
  private extensionPointProxies = new Map<string, unknown>();
  private pluginRpcRouters = new Map<string, unknown>();
  private pluginHttpHandlers = new Map<
    string,
    (req: Request) => Promise<Response>
  >();

  constructor() {
    registerCoreServices({
      registry: this.registry,
      adminPool,
      pluginRpcRouters: this.pluginRpcRouters,
      pluginHttpHandlers: this.pluginHttpHandlers,
    });
  }

  registerExtensionPoint<T>(ref: ExtensionPoint<T>, impl: T) {
    const proxy = this.getExtensionPointProxy(ref);
    (proxy as Record<string, (...args: unknown[]) => unknown>)[
      "$$setImplementation"
    ](impl);
    rootLogger.debug(`   -> Registered extension point '${ref.id}'`);
  }

  getExtensionPoint<T>(ref: ExtensionPoint<T>): T {
    return this.getExtensionPointProxy(ref);
  }

  private registeredPermissions: { id: string; description?: string }[] = [];
  private deferredPermissionRegistrations: Array<{
    pluginId: string;
    permissions: { id: string; description?: string }[];
  }> = [];

  registerPermissions(pluginId: string, permissions: Permission[]) {
    const prefixed = permissions.map((p) => ({
      ...p,
      id: `${pluginId}.${p.id}`,
    }));

    // Store permissions in central registry
    this.registeredPermissions.push(...prefixed);

    rootLogger.debug(
      `   -> Registered ${prefixed.length} permissions for ${pluginId}`
    );

    // Defer hook emission until all plugins are initialized
    // This ensures queue plugins are available before event bus tries to create queues
    this.deferredPermissionRegistrations.push({
      pluginId,
      permissions: prefixed,
    });
  }

  getAllPermissions(): { id: string; description?: string }[] {
    return [...this.registeredPermissions];
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

    // Track queue plugin providers (plugins that depend on queuePluginRegistry)
    const queuePluginProviders = new Set<string>();
    for (const p of pendingInits) {
      for (const [, ref] of Object.entries(p.deps)) {
        if (ref.id === "core.queue-plugin-registry") {
          queuePluginProviders.add(p.pluginId);
        }
      }
    }

    // Build dependency graph
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

      // Special handling: if this plugin uses queueFactory, it must wait for all queue plugin providers
      const usesQueueFactory = Object.values(p.deps).some(
        (ref) => ref.id === "core.queue-factory"
      );
      if (usesQueueFactory) {
        for (const qpp of queuePluginProviders) {
          if (qpp !== consumerId) {
            if (!graph.has(qpp)) {
              graph.set(qpp, []);
            }
            // Add edge: queue plugin provider -> queue consumer
            if (!graph.get(qpp)!.includes(consumerId)) {
              graph.get(qpp)!.push(consumerId);
              inDegree.set(consumerId, (inDegree.get(consumerId) || 0) + 1);
            }
          }
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

    // 1. Discover local BACKEND plugins from monorepo using package.json metadata
    const workspaceRoot = path.join(__dirname, "..", "..", "..");
    const localPlugins = discoverLocalPlugins({
      workspaceRoot,
      type: "backend", // Only discover backend plugins
    });

    rootLogger.debug(
      `   -> Found ${localPlugins.length} local backend plugin(s) in workspace`
    );
    rootLogger.debug("   -> Discovered plugins:");
    for (const p of localPlugins) {
      rootLogger.debug(`      • ${p.packageName}`);
    }

    // 2. Sync local plugins to database (prevents stale entries)
    await syncPluginsToDatabase({ localPlugins, db });

    // 3. Load all enabled BACKEND plugins from database (now always up-to-date)
    const allPlugins = await db
      .select()
      .from(plugins)
      .where(and(eq(plugins.enabled, true), eq(plugins.type, "backend")));

    rootLogger.debug(
      `   -> ${allPlugins.length} enabled backend plugins in database:`
    );
    for (const p of allPlugins) {
      rootLogger.debug(`      • ${p.name}`);
    }

    if (allPlugins.length === 0 && manualPlugins.length === 0) {
      rootLogger.info("ℹ️  No enabled plugins found.");
      return;
    }

    // Phase 1: Load Modules & Register Services
    const pendingInits: PendingInit[] = [];

    const providedBy = new Map<string, string>(); // ServiceId -> PluginId

    for (const plugin of allPlugins) {
      rootLogger.debug(`🔌 Loading module ${plugin.name}...`);

      try {
        // Try to import by package name first (works for npm-installed plugins)
        // Fall back to path for local plugins in plugins/ directory
        let pluginModule;
        try {
          pluginModule = await import(plugin.name);
        } catch {
          // For local plugins, the package name won't resolve, so use the path
          rootLogger.debug(
            `   -> Package name import failed, trying path: ${plugin.path}`
          );
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
        rootLogger.error(`   Expected path: ${plugin.path}`);
      }
    }

    // Phase 1.5: Register manual plugins
    for (const backendPlugin of manualPlugins) {
      this.registerPlugin(backendPlugin, "", pendingInits, providedBy);
    }

    // Phase 2: Initialize Plugins (Topological Sort)
    const sortedIds = this.sortPlugins(pendingInits, providedBy);
    rootLogger.debug(`✅ Initialization Order: ${sortedIds.join(" -> ")}`);

    // IMPORTANT: Register /api/* route BEFORE plugin initialization
    // This prevents race conditions where plugins make RPC calls during init
    // before the route is registered, causing Hono to compile its router early
    // and then fail when we try to add more routes.
    const apiHandler = createApiRouteHandler({
      registry: this.registry,
      pluginRpcRouters: this.pluginRpcRouters,
      pluginHttpHandlers: this.pluginHttpHandlers,
    });
    registerApiRoute(rootRouter, apiHandler);

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

    // Now that all plugins are initialized, emit deferred permission registration hooks
    rootLogger.debug("📢 Emitting deferred permission registration hooks...");
    for (const { pluginId, permissions } of this
      .deferredPermissionRegistrations) {
      try {
        const eventBus = await this.registry.get(coreServices.eventBus, "core");
        await eventBus.emit(coreHooks.permissionsRegistered, {
          pluginId,
          permissions,
        });
      } catch (error) {
        rootLogger.error(
          `Failed to emit permissionsRegistered hook for ${pluginId}:`,
          error
        );
      }
    }
    // Clear deferred registrations after emission
    this.deferredPermissionRegistrations = [];

    // Phase 3: Run afterPluginsReady callbacks
    // Now all routers are registered, so cross-plugin RPC calls are safe
    rootLogger.debug("🔄 Running afterPluginsReady callbacks...");
    for (const p of pendingInits) {
      if (p.afterPluginsReady) {
        try {
          // Re-resolve deps for the ready phase
          const resolvedDeps: Record<string, unknown> = {};
          for (const [key, ref] of Object.entries(p.deps)) {
            resolvedDeps[key] = await this.registry.get(
              ref as ServiceRef<unknown>,
              p.pluginId
            );
          }

          // Add database if schema was provided
          if (p.schema) {
            const baseUrl = process.env.DATABASE_URL;
            const assignedSchema = `plugin_${p.pluginId}`;
            const scopedUrl = `${baseUrl}?options=-c%20search_path%3D${assignedSchema}`;
            const pluginPool = new Pool({ connectionString: scopedUrl });
            resolvedDeps["database"] = drizzle(pluginPool, {
              schema: p.schema,
            });
          }

          // Create hook helpers bound to this plugin
          const eventBus = await this.registry.get(
            coreServices.eventBus,
            "core"
          );
          resolvedDeps["onHook"] = <T>(
            hook: { id: string },
            listener: (payload: T) => Promise<void>,
            options?: HookSubscribeOptions
          ) => {
            return eventBus.subscribe(p.pluginId, hook, listener, options);
          };
          resolvedDeps["emitHook"] = async <T>(
            hook: { id: string },
            payload: T
          ) => {
            await eventBus.emit(hook, payload);
          };

          await p.afterPluginsReady(resolvedDeps);
          rootLogger.debug(`   -> ${p.pluginId} afterPluginsReady complete`);
        } catch (error) {
          rootLogger.error(
            `❌ Failed afterPluginsReady for ${p.pluginId}:`,
            error
          );
        }
      }
    }
    rootLogger.debug("✅ All afterPluginsReady callbacks complete");

    // API route is already registered (before Phase 2)
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
        init: (deps: ResolvedDeps<D> & DatabaseDeps<S>) => Promise<void>;
        afterPluginsReady?: (
          deps: ResolvedDeps<D> & DatabaseDeps<S> & AfterPluginsReadyContext
        ) => Promise<void>;
      }) => {
        pendingInits.push({
          pluginId: backendPlugin.pluginId,
          pluginPath: pluginPath,
          deps: args.deps,
          init: args.init as InitCallback,
          afterPluginsReady: args.afterPluginsReady as InitCallback | undefined,
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
      registerRouter: (router: unknown) => {
        this.pluginRpcRouters.set(backendPlugin.pluginId, router);
      },
      pluginManager: {
        getAllPermissions: () => this.getAllPermissions(),
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
