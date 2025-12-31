import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { DropdownMenuItem } from "@checkmate/ui";

export const NotificationUserMenuItems = () => {
  return (
    <Link to="/settings/notifications">
      <DropdownMenuItem icon={<Bell className="h-4 w-4" />}>
        Notification Settings
      </DropdownMenuItem>
    </Link>
  );
};
