import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { join } from "path";
import { Hono } from "hono";
import { adminPool, db } from "./db";
import { plugins } from "./schema";
import { eq } from "drizzle-orm";
import { ServiceRegistry } from "./services/service-registry";
import { coreServices } from "./services/core-services";
import { BackendPlugin } from "./plugin-system";
import { rootLogger } from "./logger";

export class PluginManager {
  private registry = new ServiceRegistry();

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
  }

  async loadPluginsFromDb(rootRouter: Hono) {
    // Register Router Factory now that we have rootRouter
    this.registry.registerFactory(coreServices.httpRouter, (pluginId) => {
      const pluginRouter = new Hono();
      rootRouter.route(`/api/${pluginId}`, pluginRouter);
      return pluginRouter;
    });

    // Register Logger Factory
    this.registry.registerFactory(coreServices.logger, (pluginId) => {
      return rootLogger.child({ plugin: pluginId });
    });

    rootLogger.info("🔍 Scanning for plugins in database...");

    const enabledPlugins = await db
      .select()
      .from(plugins)
      .where(eq(plugins.enabled, true));

    if (enabledPlugins.length === 0) {
      rootLogger.info("ℹ️  No enabled plugins found.");
      return;
    }

    // Phase 1: Load Modules & Register Services
    const pendingInits: Array<{
      pluginId: string;
      pluginPath: string;
      deps: any;
      init: (deps: any) => Promise<void>;
    }> = [];

    for (const plugin of enabledPlugins) {
      rootLogger.info(`🔌 Loading module ${plugin.name}...`);

      let pluginModule;
      try {
        try {
          pluginModule = await import(plugin.name);
        } catch {
          pluginModule = await import(plugin.path);
        }

        const backendPlugin: BackendPlugin = pluginModule.default;

        if (!backendPlugin || typeof backendPlugin.register !== "function") {
          // Fallback for legacy plugins? Or just error.
          // For now, assume migration.
          rootLogger.warn(
            `Plugin ${plugin.name} is not using new API. Skipping.`
          );
          continue;
        }

        // Execute Register
        backendPlugin.register({
          registerInit: (args: { deps: any; init: any }) => {
            pendingInits.push({
              pluginId: backendPlugin.pluginId,
              pluginPath: plugin.path,
              deps: args.deps,
              init: args.init,
            });
          },
          registerService: (ref: any, impl: any) => {
            this.registry.register(ref, impl);
            rootLogger.debug(`   -> Registered service '${ref.id}'`);
          },
        });
      } catch (e) {
        rootLogger.error(`Failed to load module for ${plugin.name}:`, e);
      }
    }

    // Phase 2: Initialize Plugins (Topological Sort / Dependency Check)
    // For now, simpler approach: Just iterate. If deps fail, it throws.
    // If we wanted to be safer, we'd check availability first.

    for (const p of pendingInits) {
      rootLogger.info(`🚀 Initializing ${p.pluginId}...`);

      // 1. Run Migrations (Scoped DB logic is inside Factory, but migrations need path)
      // We can do migrations here separately or assume the plugin handles it?
      // Old logic: PluginManager ran migrations.
      // New logic: PluginManager should still run migrations because it knows the PATH.
      // BUT it needs the DB.
      // We can resolve the DB for the plugin.

      try {
        const pluginDb = await this.registry.get(
          coreServices.database,
          p.pluginId
        );

        // Run Migrations
        const migrationsFolder = join(p.pluginPath, "drizzle");
        try {
          await migrate(pluginDb, { migrationsFolder });
        } catch (e) {
          // Ignore no migrations
        }

        // Resolve all dependencies
        const resolvedDeps: any = {};
        for (const [key, ref] of Object.entries(p.deps)) {
          // @ts-ignore
          resolvedDeps[key] = await this.registry.get(ref, p.pluginId);
        }

        // Init
        await p.init(resolvedDeps);
        rootLogger.info(`✅ ${p.pluginId} initialized.`);
      } catch (e) {
        rootLogger.error(`❌ Failed to initialize ${p.pluginId}:`, e);
      }
    }
  }
}
