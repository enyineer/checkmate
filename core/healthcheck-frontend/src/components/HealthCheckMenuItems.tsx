import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import type { UserMenuItemsContext } from "@checkmate-monitor/frontend-api";
import { DropdownMenuItem } from "@checkmate-monitor/ui";
import { qualifyPermissionId, resolveRoute } from "@checkmate-monitor/common";
import {
  healthcheckRoutes,
  permissions,
  pluginMetadata,
} from "@checkmate-monitor/healthcheck-common";

export const HealthCheckMenuItems = ({
  permissions: userPerms,
}: UserMenuItemsContext) => {
  const qualifiedId = qualifyPermissionId(
    pluginMetadata,
    permissions.healthCheckRead
  );
  const canRead = userPerms.includes("*") || userPerms.includes(qualifiedId);

  if (!canRead) {
    return <React.Fragment />;
  }

  return (
    <Link to={resolveRoute(healthcheckRoutes.routes.config)}>
      <DropdownMenuItem icon={<Activity className="w-4 h-4" />}>
        Health Checks
      </DropdownMenuItem>
    </Link>
  );
};
