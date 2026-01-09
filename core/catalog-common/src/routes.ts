import { createRoutes } from "@checkstack/common";

/**
 * Route definitions for the catalog plugin.
 */
export const catalogRoutes = createRoutes("catalog", {
  home: "/",
  config: "/config",
  systemDetail: "/system/:systemId",
});
