import React from "react";
import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";
import type { UserMenuItemsContext } from "@checkmate-monitor/frontend-api";
import { DropdownMenuItem } from "@checkmate-monitor/ui";
import { qualifyPermissionId, resolveRoute } from "@checkmate-monitor/common";
import {
  maintenanceRoutes,
  permissions,
  pluginMetadata,
} from "@checkmate-monitor/maintenance-common";

export const MaintenanceMenuItems = ({
  permissions: userPerms,
}: UserMenuItemsContext) => {
  const qualifiedId = qualifyPermissionId(
    pluginMetadata,
    permissions.maintenanceManage
  );
  const canManage = userPerms.includes("*") || userPerms.includes(qualifiedId);

  if (!canManage) {
    return <React.Fragment />;
  }

  return (
    <Link to={resolveRoute(maintenanceRoutes.routes.config)}>
      <DropdownMenuItem icon={<Wrench className="w-4 h-4" />}>
        Maintenances
      </DropdownMenuItem>
    </Link>
  );
};
