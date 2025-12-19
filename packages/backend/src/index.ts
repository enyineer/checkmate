import { Hono } from "hono";
import { PluginManager } from "./plugin-manager";
import { logger } from "hono/logger";

const app = new Hono();
const pluginManager = new PluginManager();

app.use("*", logger());

app.get("/", (c) => {
  return c.text("Checkmate Core Backend is running!");
});

// TODO: Load plugins dynamically from the plugins directory or configuration
// For now we just instantiate the manager to show it's ready.
const init = async () => {
  console.log("🚀 Starting Checkmate Core...");

  // Example: loading a plugin if we had one
  // await pluginManager.loadPlugin({
  //     pluginName: "plugin-example",
  //     pluginPath: "../../../plugins/plugin-example",
  //     rootRouter: app
  // });

  console.log("✅ Checkmate Core initialized.");
};

init();

export default {
  port: 3000,
  fetch: app.fetch,
};
