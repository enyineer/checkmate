import { Hono } from "hono";
import { PluginManager } from "./plugin-manager";
import { logger } from "hono/logger";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { join } from "path";

const app = new Hono();
const pluginManager = new PluginManager();

app.use("*", logger());

app.get("/", (c) => {
  return c.text("Checkmate Core Backend is running!");
});

const init = async () => {
  console.log("🚀 Starting Checkmate Core...");

  // 1. Run Core Migrations
  console.log("🔄 Running core migrations...");
  try {
    await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
    console.log("✅ Core migrations applied.");
  } catch (e) {
    console.error("❌ Failed to apply core migrations:", e);
    process.exit(1);
  }

  // 2. Load Plugins
  await pluginManager.loadPluginsFromDb(app);

  console.log("✅ Checkmate Core initialized.");
};

init();

export default {
  port: 3000,
  fetch: app.fetch,
};
