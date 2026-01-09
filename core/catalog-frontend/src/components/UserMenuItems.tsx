import React from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import type { UserMenuItemsContext } from "@checkstack/frontend-api";
import { DropdownMenuItem } from "@checkstack/ui";
import { qualifyPermissionId, resolveRoute } from "@checkstack/common";
import {
  catalogRoutes,
  permissions,
  pluginMetadata,
} from "@checkstack/catalog-common";

export const CatalogUserMenuItems = ({
  permissions: userPerms,
}: UserMenuItemsContext) => {
  const qualifiedId = qualifyPermissionId(
    pluginMetadata,
    permissions.catalogManage
  );
  const canManage = userPerms.includes("*") || userPerms.includes(qualifiedId);

  if (!canManage) {
    return <React.Fragment />;
  }

  return (
    <Link to={resolveRoute(catalogRoutes.routes.config)}>
      <DropdownMenuItem icon={<Settings className="h-4 w-4" />}>
        Catalog Settings
      </DropdownMenuItem>
    </Link>
  );
};
