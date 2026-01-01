import { createRoutes } from "@checkmate/common";

/**
 * Route definitions for the healthcheck plugin.
 */
export const healthcheckRoutes = createRoutes("healthcheck", {
  config: "/config",
});
