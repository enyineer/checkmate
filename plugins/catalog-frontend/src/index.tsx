import { fetchApiRef, ApiRef } from "@checkmate/frontend-api";
import { SLOT_USER_MENU_ITEMS } from "@checkmate/common";
import { CatalogClient } from "./client";
import { catalogApiRef } from "./api";
import { createFrontendPlugin } from "@checkmate/frontend-api";

import { CatalogPage } from "./components/CatalogPage";
import { CatalogConfigPage } from "./components/CatalogConfigPage";
import { CatalogUserMenuItems } from "./components/UserMenuItems";
import { SystemDetailPage } from "./components/SystemDetailPage";

export const catalogPlugin = createFrontendPlugin({
  name: "catalog-frontend",
  apis: [
    {
      ref: catalogApiRef,
      factory: (deps: { get: <T>(ref: ApiRef<T>) => T }) => {
        const fetchApi = deps.get(fetchApiRef);
        return new CatalogClient(fetchApi);
      },
    },
  ],
  routes: [
    {
      path: "/catalog",
      element: <CatalogPage />,
    },
    {
      path: "/catalog/config",
      element: <CatalogConfigPage />,
      permission: "catalog.manage",
    },
    {
      path: "/system/:systemId",
      element: <SystemDetailPage />,
    },
  ],
  extensions: [
    {
      id: "catalog.user-menu.items",
      slotId: SLOT_USER_MENU_ITEMS,
      component: CatalogUserMenuItems,
    },
  ],
});

export * from "./api";
export * from "./client";
