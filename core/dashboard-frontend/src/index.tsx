import { FrontendPlugin, DashboardSlot } from "@checkmate/frontend-api";
import { definePluginMetadata } from "@checkmate/common";
import { Dashboard } from "./Dashboard";

const pluginMetadata = definePluginMetadata({
  pluginId: "dashboard",
});

export const dashboardPlugin: FrontendPlugin = {
  metadata: pluginMetadata,
  extensions: [
    {
      id: "dashboard-main",
      slot: DashboardSlot,
      component: Dashboard as React.ComponentType<unknown>,
    },
  ],
};

export default dashboardPlugin;
