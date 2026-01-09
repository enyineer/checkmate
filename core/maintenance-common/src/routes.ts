import { createRoutes } from "@checkstack/common";

/**
 * Route definitions for the maintenance plugin.
 * Import and use these routes in both frontend plugins and for link generation.
 *
 * @example Frontend plugin usage
 * ```tsx
 * import { maintenanceRoutes } from "@checkstack/maintenance-common";
 *
 * createFrontendPlugin({
 *   routes: [
 *     { route: maintenanceRoutes.routes.config, element: <ConfigPage /> },
 *   ],
 * });
 * ```
 *
 * @example Link generation
 * ```tsx
 * import { maintenanceRoutes } from "@checkstack/maintenance-common";
 * import { usePluginRoute } from "@checkstack/frontend-api";
 *
 * const getRoute = usePluginRoute();
 * <Link to={getRoute(maintenanceRoutes.routes.config)}>Maintenances</Link>
 * ```
 */
export const maintenanceRoutes = createRoutes("maintenance", {
  config: "/config",
  systemHistory: "/system/:systemId/history",
  detail: "/:maintenanceId",
});
