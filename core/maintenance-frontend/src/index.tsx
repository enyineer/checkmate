import {
  createFrontendPlugin,
  createSlotExtension,
  rpcApiRef,
  type ApiRef,
} from "@checkmate/frontend-api";
import { SLOT_USER_MENU_ITEMS } from "@checkmate/common";
import { maintenanceApiRef, type MaintenanceApi } from "./api";
import { maintenanceRoutes } from "@checkmate/maintenance-common";
import { SystemDetailsTopSlot } from "@checkmate/catalog-common";
import { MaintenanceConfigPage } from "./pages/MaintenanceConfigPage";
import { SystemMaintenancePanel } from "./components/SystemMaintenancePanel";
import { MaintenanceMenuItems } from "./components/MaintenanceMenuItems";

export default createFrontendPlugin({
  name: "maintenance-frontend",
  routes: [
    {
      route: maintenanceRoutes.routes.config,
      element: <MaintenanceConfigPage />,
      title: "Maintenances",
      permission: "maintenance-backend.maintenance.manage",
    },
  ],
  apis: [
    {
      ref: maintenanceApiRef,
      factory: (deps: { get: <T>(ref: ApiRef<T>) => T }): MaintenanceApi => {
        const rpcApi = deps.get(rpcApiRef);
        return rpcApi.forPlugin<MaintenanceApi>("maintenance-backend");
      },
    },
  ],
  extensions: [
    {
      id: "maintenance.user-menu.items",
      slotId: SLOT_USER_MENU_ITEMS,
      component: MaintenanceMenuItems,
    },
    createSlotExtension(SystemDetailsTopSlot, {
      id: "maintenance.system-details-top.panel",
      component: SystemMaintenancePanel,
    }),
  ],
});
