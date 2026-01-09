import { createRoutes } from "@checkstack/common";

/**
 * Route definitions for the notification plugin.
 */
export const notificationRoutes = createRoutes("notification", {
  home: "/",
  settings: "/settings",
});
