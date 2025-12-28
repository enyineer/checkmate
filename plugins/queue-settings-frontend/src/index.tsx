import { fetchApiRef, ApiRef } from "@checkmate/frontend-api";
import { SLOT_USER_MENU_ITEMS } from "@checkmate/common";
import { QueueSettingsApiClient } from "./api";
import { queueSettingsApiRef } from "./api";
import { createFrontendPlugin } from "@checkmate/frontend-api";
import { QueueSettingsPage } from "./pages/QueueSettingsPage";
import { QueueSettingsUserMenuItems } from "./components/UserMenuItems";
import { permissions } from "@checkmate/queue-settings-common";

export const queueSettingsPlugin = createFrontendPlugin({
  name: "queue-settings-frontend",
  apis: [
    {
      ref: queueSettingsApiRef,
      factory: (deps: { get: <T>(ref: ApiRef<T>) => T }) => {
        const fetchApi = deps.get(fetchApiRef);
        return new QueueSettingsApiClient(fetchApi);
      },
    },
  ],
  routes: [
    {
      path: "/queue-settings",
      element: <QueueSettingsPage />,
      permission: permissions.queueRead.id,
    },
  ],
  extensions: [
    {
      id: "queue-settings.user-menu.items",
      slotId: SLOT_USER_MENU_ITEMS,
      component: QueueSettingsUserMenuItems,
    },
  ],
});

export * from "./api";
