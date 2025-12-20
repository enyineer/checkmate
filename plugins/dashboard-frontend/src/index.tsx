import { FrontendPlugin } from "@checkmate/frontend-api";
import { Dashboard } from "./Dashboard";
import { SLOT_DASHBOARD } from "@checkmate/common";

export const dashboardPlugin: FrontendPlugin = {
  name: "dashboard-frontend",
  extensions: [
    {
      id: "dashboard-main",
      slotId: SLOT_DASHBOARD,
      component: Dashboard as React.ComponentType<unknown>,
    },
  ],
};

export default dashboardPlugin;
