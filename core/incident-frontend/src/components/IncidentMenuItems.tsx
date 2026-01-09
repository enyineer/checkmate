import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import type { UserMenuItemsContext } from "@checkmate-monitor/frontend-api";
import { DropdownMenuItem } from "@checkmate-monitor/ui";
import { qualifyPermissionId, resolveRoute } from "@checkmate-monitor/common";
import {
  incidentRoutes,
  permissions,
  pluginMetadata,
} from "@checkmate-monitor/incident-common";

export const IncidentMenuItems = ({
  permissions: userPerms,
}: UserMenuItemsContext) => {
  const qualifiedId = qualifyPermissionId(
    pluginMetadata,
    permissions.incidentManage
  );
  const canManage = userPerms.includes("*") || userPerms.includes(qualifiedId);

  if (!canManage) {
    return <React.Fragment />;
  }

  return (
    <Link to={resolveRoute(incidentRoutes.routes.config)}>
      <DropdownMenuItem icon={<AlertTriangle className="w-4 h-4" />}>
        Incidents
      </DropdownMenuItem>
    </Link>
  );
};
