import { createPermission } from "@checkstack/common";

export const permissions = {
  /** Manage webhook integrations and view delivery logs */
  integrationManage: createPermission(
    "integration",
    "manage",
    "Manage webhook integrations and view delivery logs"
  ),
};

export const permissionList = Object.values(permissions);
