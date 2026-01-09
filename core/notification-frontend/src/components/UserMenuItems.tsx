import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import type { UserMenuItemsContext } from "@checkstack/frontend-api";
import { DropdownMenuItem } from "@checkstack/ui";
import { resolveRoute } from "@checkstack/common";
import { notificationRoutes } from "@checkstack/notification-common";

export const NotificationUserMenuItems = (_props: UserMenuItemsContext) => {
  return (
    <Link to={resolveRoute(notificationRoutes.routes.settings)}>
      <DropdownMenuItem icon={<Bell className="h-4 w-4" />}>
        Notification Settings
      </DropdownMenuItem>
    </Link>
  );
};
