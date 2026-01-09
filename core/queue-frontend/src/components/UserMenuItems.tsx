import React from "react";
import { Link } from "react-router-dom";
import { ListOrdered } from "lucide-react";
import type { UserMenuItemsContext } from "@checkmate-monitor/frontend-api";
import { DropdownMenuItem } from "@checkmate-monitor/ui";
import { qualifyPermissionId, resolveRoute } from "@checkmate-monitor/common";
import {
  queueRoutes,
  permissions,
  pluginMetadata,
} from "@checkmate-monitor/queue-common";

export const QueueUserMenuItems = ({
  permissions: userPerms,
}: UserMenuItemsContext) => {
  const qualifiedId = qualifyPermissionId(
    pluginMetadata,
    permissions.queueRead
  );
  const canRead = userPerms.includes("*") || userPerms.includes(qualifiedId);

  if (!canRead) {
    return <React.Fragment />;
  }

  return (
    <Link to={resolveRoute(queueRoutes.routes.config)}>
      <DropdownMenuItem icon={<ListOrdered className="h-4 w-4" />}>
        Queue Settings
      </DropdownMenuItem>
    </Link>
  );
};
