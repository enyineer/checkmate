import { createFrontendPlugin } from "@checkmate/frontend-api";
import { SLOT_NAVBAR } from "@checkmate/common";
import { NotificationBell } from "./components/NotificationBell";
import { NotificationsPage } from "./pages/NotificationsPage";
import { NotificationSettingsPage } from "./pages/NotificationSettingsPage";

export const notificationPlugin = createFrontendPlugin({
  name: "notification-frontend",
  routes: [
    {
      path: "/notifications",
      element: <NotificationsPage />,
    },
    {
      path: "/settings/notifications",
      element: <NotificationSettingsPage />,
    },
  ],
  extensions: [
    {
      id: "notification.navbar.bell",
      slotId: SLOT_NAVBAR,
      component: NotificationBell,
    },
  ],
});
