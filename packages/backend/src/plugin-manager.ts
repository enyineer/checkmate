import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { join } from "path";
import { Hono } from "hono";
import { adminPool } from "./db";
import { initFunction } from "./types";

export class PluginManager {
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

    // Append search_path options to the connection string
    // If the URL already has query params, we might need a more robust parser,
    // but for now we append options assuming standard postgres:// uri format
    const connector = baseUrl.includes("?") ? "&" : "?";
    const scopedUrl = `${baseUrl}${connector}options=-c%20search_path%3D${assignedSchema}`;

    // 3. Create the Plugin's Dedicated Pool
    const pluginPool = new Pool({ connectionString: scopedUrl });
    const pluginDb = drizzle(pluginPool);

    // 4. Run Migrations
    // We expect migrations to be in the 'migrations' folder of the plugin
    const migrationsFolder = join(pluginPath, "migrations");

    // Check if migrations folder exists before trying to migrate could be good,
    // but drizzle might handle empty or missing folders gracefully or throw.
    // For now, we assume if it's a backend plugin with DB needs, it has this.
    // If not, we might want to wrap in try/catch or file check.
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
      // Dynamic import of the plugin module
      // This assumes the plugin package is available in the node_modules
      // or at the path resolvable by the runtime.
      // If pluginPath is a file system path, we might need to rely on Bun's resolution or relative paths.
      // Ideally, plugins are npm packages installed in the workspace, so we can import by name.
      const pluginModule = await import(pluginName);

      if (typeof pluginModule.default === "function") {
        await (pluginModule.default as initFunction)({
          database: pluginDb,
          router: pluginRouter,
        });
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
