import { createRoutes } from "@checkmate/common";

/**
 * Route definitions for the incident plugin.
 * Import and use these routes in both frontend plugins and for link generation.
 *
 * @example Frontend plugin usage
 * ```tsx
 * import { incidentRoutes } from "@checkmate/incident-common";
 *
 * createFrontendPlugin({
 *   routes: [
 *     { route: incidentRoutes.routes.config, element: <ConfigPage /> },
 *   ],
 * });
 * ```
 *
 * @example Link generation
 * ```tsx
 * import { incidentRoutes } from "@checkmate/incident-common";
 * import { resolveRoute } from "@checkmate/common";
 *
 * const detailPath = resolveRoute(incidentRoutes.routes.detail, { incidentId });
 * ```
 */
export const incidentRoutes = createRoutes("incident", {
  config: "/config",
  detail: "/:incidentId",
  systemHistory: "/system/:systemId/incidents",
});
