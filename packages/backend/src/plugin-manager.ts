import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { join } from "path";
import { Hono } from "hono";
import { adminPool, db } from "./db";
import { initFunction } from "./types";
import { plugins } from "./schema";
import { eq } from "drizzle-orm";

export class PluginManager {
  async loadPluginsFromDb(rootRouter: Hono) {
    console.log("🔍 Scanning for plugins in database...");

    // Fetch all enabled plugins
    const enabledPlugins = await db
      .select()
      .from(plugins)
      .where(eq(plugins.enabled, true));

    if (enabledPlugins.length === 0) {
      console.log("ℹ️  No enabled plugins found.");
      return;
    }

    for (const plugin of enabledPlugins) {
      await this.loadPlugin({
        pluginName: plugin.name,
        pluginPath: plugin.path,
        rootRouter: rootRouter,
      });
    }
  }

  async loadPlugin(props: {
    pluginName: string;
    pluginPath: string;
    rootRouter: Hono;
  }) {
    const { pluginName, pluginPath, rootRouter } = props;

    const assignedSchema = `plugin_${pluginName}`;

    console.log(`🔌 Loading ${pluginName} into namespace '${assignedSchema}'`);

    // 1. Ensure Schema Exists
    await adminPool.query(`CREATE SCHEMA IF NOT EXISTS "${assignedSchema}"`);

    // 2. Create a "Scoped" Connection String
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error("DATABASE_URL is not defined");
    }

    const connector = baseUrl.includes("?") ? "&" : "?";
    const scopedUrl = `${baseUrl}${connector}options=-c%20search_path%3D${assignedSchema}`;

    // 3. Create the Plugin's Dedicated Pool
    const pluginPool = new Pool({ connectionString: scopedUrl });
    const pluginDb = drizzle(pluginPool);

    // 4. Run Migrations
    // For now we assume the path is absolute or resolvable.
    // In a real scenario, we might need to resolve this relative to the workspace root or using require.resolve
    const migrationsFolder = join(pluginPath, "drizzle");

    try {
      await migrate(pluginDb, {
        migrationsFolder: migrationsFolder,
      });
    } catch (e) {
      console.warn(
        `No migrations found or failed to migrate for ${pluginName} at ${migrationsFolder}. Error:`,
        e
      );
    }

    // 5. Create a Sub-router for this plugin
    const pluginRouter = new Hono();

    // 6. Make the plugin router listen under the /api/<pluginName> path
    rootRouter.route(`/api/${pluginName}`, pluginRouter);

    // 7. Initialize Plugin
    try {
      // Dynamic import
      // We'll try to import using the plugin name (if it's a package) or the path
      // If it's a local package in workspace, name is best.
      let pluginModule;
      try {
        pluginModule = await import(pluginName);
      } catch (e1) {
        console.log(
          `Could not import by name '${pluginName}', trying path '${pluginPath}'`
        );
        try {
          pluginModule = await import(pluginPath);
        } catch (e2) {
          throw new Error(`Failed to import plugin via name or path: ${e2}`);
        }
      }

      if (typeof pluginModule.default === "function") {
        await (pluginModule.default as initFunction)({
          database: pluginDb,
          router: pluginRouter,
        });
        console.log(`✅ Plugin ${pluginName} initialized successfully.`);
      } else {
        console.error(
          `Plugin ${pluginName} does not export a default init function.`
        );
      }
    } catch (e) {
      console.error(`Failed to initialize plugin ${pluginName}:`, e);
    }
  }
}
