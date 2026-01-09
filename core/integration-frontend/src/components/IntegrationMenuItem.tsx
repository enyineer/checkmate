import { useNavigate } from "react-router-dom";
import { Webhook } from "lucide-react";
import { DropdownMenuItem } from "@checkmate-monitor/ui";
import type { UserMenuItemsContext } from "@checkmate-monitor/frontend-api";
import { qualifyPermissionId, resolveRoute } from "@checkmate-monitor/common";
import {
  integrationRoutes,
  permissions,
  pluginMetadata,
} from "@checkmate-monitor/integration-common";
import React from "react";

export const IntegrationMenuItem = ({
  permissions: userPerms,
}: UserMenuItemsContext) => {
  const navigate = useNavigate();
  const qualifiedId = qualifyPermissionId(
    pluginMetadata,
    permissions.integrationManage
  );
  const allowed = userPerms.includes("*") || userPerms.includes(qualifiedId);

  if (!allowed) {
    return <React.Fragment />;
  }

  return (
    <DropdownMenuItem
      onClick={() => navigate(resolveRoute(integrationRoutes.routes.list))}
      icon={<Webhook className="h-4 w-4" />}
    >
      Integrations
    </DropdownMenuItem>
  );
};
