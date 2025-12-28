import React from "react";
import { Link } from "react-router-dom";
import { ListOrdered } from "lucide-react";
import { useApi, permissionApiRef } from "@checkmate/frontend-api";
import { DropdownMenuItem } from "@checkmate/ui";
import { permissions } from "@checkmate/queue-settings-common";

export const QueueSettingsUserMenuItems = () => {
  const permissionApi = useApi(permissionApiRef);
  const { allowed: canRead, loading } = permissionApi.usePermission(
    permissions.queueRead.id
  );

  if (loading || !canRead) {
    return <React.Fragment />;
  }

  return (
    <Link to="/queue-settings">
      <DropdownMenuItem icon={<ListOrdered className="h-4 w-4" />}>
        Queue Settings
      </DropdownMenuItem>
    </Link>
  );
};
