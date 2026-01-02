import {
  createFrontendPlugin,
  createSlotExtension,
  rpcApiRef,
  type ApiRef,
  UserMenuItemsSlot,
} from "@checkmate/frontend-api";
import { healthCheckApiRef, type HealthCheckApiClient } from "./api";
import { HealthCheckConfigPage } from "./pages/HealthCheckConfigPage";
import { HealthCheckHistoryPage } from "./pages/HealthCheckHistoryPage";
import { HealthCheckHistoryDetailPage } from "./pages/HealthCheckHistoryDetailPage";
import { HealthCheckMenuItems } from "./components/HealthCheckMenuItems";
import { HealthCheckSystemOverview } from "./components/HealthCheckSystemOverview";
import { SystemHealthCheckAssignment } from "./components/SystemHealthCheckAssignment";
import { SystemHealthBadge } from "./components/SystemHealthBadge";

import {
  SystemDetailsSlot,
  CatalogSystemActionsSlot,
  SystemStateBadgesSlot,
} from "@checkmate/catalog-common";
import {
  healthcheckRoutes,
  HealthCheckApi,
} from "@checkmate/healthcheck-common";

export default createFrontendPlugin({
  name: "healthcheck-frontend",
  routes: [
    {
      route: healthcheckRoutes.routes.config,
      element: <HealthCheckConfigPage />,
      title: "Health Checks",
      permission: "healthcheck.read",
    },
    {
      route: healthcheckRoutes.routes.history,
      element: <HealthCheckHistoryPage />,
      title: "Health Check History",
      permission: "healthcheck.manage",
    },
    {
      route: healthcheckRoutes.routes.historyDetail,
      element: <HealthCheckHistoryDetailPage />,
      title: "Health Check Detail",
      permission: "healthcheck.manage",
    },
  ],
  apis: [
    {
      ref: healthCheckApiRef,
      factory: (deps: {
        get: <T>(ref: ApiRef<T>) => T;
      }): HealthCheckApiClient => {
        const rpcApi = deps.get(rpcApiRef);
        // HealthCheckApiClient is just the RPC contract - return it directly
        return rpcApi.forPlugin(HealthCheckApi);
      },
    },
  ],
  extensions: [
    {
      id: "healthcheck.user-menu.items",
      slot: UserMenuItemsSlot,
      component: HealthCheckMenuItems,
    },
    createSlotExtension(SystemStateBadgesSlot, {
      id: "healthcheck.system-health-badge",
      component: SystemHealthBadge,
    }),
    createSlotExtension(SystemDetailsSlot, {
      id: "healthcheck.system-details.overview",
      component: HealthCheckSystemOverview,
    }),
    createSlotExtension(CatalogSystemActionsSlot, {
      id: "healthcheck.catalog.system-actions",
      component: SystemHealthCheckAssignment,
    }),
  ],
});
