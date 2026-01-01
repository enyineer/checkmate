import { createRoutes } from "@checkmate/common";

/**
 * Route definitions for the notification plugin.
 */
export const notificationRoutes = createRoutes("notification", {
  home: "/",
  settings: "/settings",
});
