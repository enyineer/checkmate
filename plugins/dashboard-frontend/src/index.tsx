import { FrontendPlugin } from "@checkmate/frontend-api";
import { Dashboard } from "./Dashboard";

export const dashboardPlugin: FrontendPlugin = {
  name: "dashboard-frontend",
  extensions: [
    {
      id: "dashboard-main",
      slotId: "dashboard",
      component: Dashboard as React.ComponentType<unknown>,
    },
  ],
};

export default dashboardPlugin;
