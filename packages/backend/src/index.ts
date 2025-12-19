import { Hono } from "hono";
import { PluginManager } from "./plugin-manager";
import { logger } from "hono/logger";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { join } from "path";
import { jwtService } from "./services/jwt";

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

  // 2. Signature Verification Middleware
  // Verify that every request coming to /api/* has a valid signature, unless exempt.
  // The 'auth-backend' plugin routes (/api/auth/*) must be exempt to allow login/signup.
  const EXEMPT_PATHS = ["/api/auth"];

  app.use("/api/*", async (c, next) => {
    const path = c.req.path;

    // Check exemptions (prefix match)
    if (EXEMPT_PATHS.some((p) => path.startsWith(p))) {
      return next();
    }

    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return c.json(
        { error: "Unauthorized: Missing Authorization header" },
        401
      );
    }

    // Verify token (Service Token or potentially User Token if using same secret/standard)
    // For now, we strictly verify it using our internal service secret.
    // If User tokens are signed differently, they will fail here unless we distinguish.
    const payload = await jwtService.verify(token);
    if (!payload) {
      return c.json({ error: "Unauthorized: Invalid signature" }, 401);
    }

    await next();
  });

  // 3. Load Plugins
  await pluginManager.loadPluginsFromDb(app);

  console.log("✅ Checkmate Core initialized.");
};

init();

export default {
  port: 3000,
  fetch: app.fetch,
};

export { jwtService } from "./services/jwt";
