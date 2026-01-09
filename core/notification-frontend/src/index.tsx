import {
  createFrontendPlugin,
  createSlotExtension,
  NavbarRightSlot,
  UserMenuItemsSlot,
} from "@checkstack/frontend-api";
import {
  notificationRoutes,
  pluginMetadata,
} from "@checkstack/notification-common";
import { NotificationBell } from "./components/NotificationBell";
import { NotificationsPage } from "./pages/NotificationsPage";
import { NotificationSettingsPage } from "./pages/NotificationSettingsPage";
import { NotificationUserMenuItems } from "./components/UserMenuItems";

export const notificationPlugin = createFrontendPlugin({
  metadata: pluginMetadata,
  routes: [
    {
      route: notificationRoutes.routes.home,
      element: <NotificationsPage />,
    },
    {
      route: notificationRoutes.routes.settings,
      element: <NotificationSettingsPage />,
    },
  ],
  extensions: [
    {
      id: "notification.navbar.bell",
      slot: NavbarRightSlot,
      component: NotificationBell,
    },
    createSlotExtension(UserMenuItemsSlot, {
      id: "notification.user.setting",
      component: NotificationUserMenuItems,
    }),
  ],
});
