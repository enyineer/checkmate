import {
  createFrontendPlugin,
  createSlotExtension,
  UserMenuItemsSlot,
} from "@checkstack/frontend-api";
import { createRoutes } from "@checkstack/common";
import {
  pluginMetadata,
  permissions,
} from "@checkstack/api-docs-common";
import { ApiDocsPage } from "./ApiDocsPage";
import { ApiDocsMenuItem } from "./ApiDocsMenuItem";

export const apiDocsRoutes = createRoutes(pluginMetadata.pluginId, {
  docs: "/",
});

export const apiDocsPlugin = createFrontendPlugin({
  metadata: pluginMetadata,
  routes: [
    {
      route: apiDocsRoutes.routes.docs,
      element: <ApiDocsPage />,
      permission: permissions.apiDocsView,
    },
  ],
  extensions: [
    createSlotExtension(UserMenuItemsSlot, {
      id: "api-docs.user-menu.link",
      component: ApiDocsMenuItem,
    }),
  ],
});

export default apiDocsPlugin;
