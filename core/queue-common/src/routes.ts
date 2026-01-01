import { createRoutes } from "@checkmate/common";

/**
 * Route definitions for the queue plugin.
 */
export const queueRoutes = createRoutes("queue", {
  config: "/config",
});
