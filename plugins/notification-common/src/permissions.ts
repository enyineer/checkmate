import { createPermission } from "@checkmate/common";

export const permissions = {
  /** Read own notifications */
  notificationRead: createPermission(
    "notification",
    "read",
    "Read notifications"
  ),
  /** Configure retention policy and send broadcasts */
  notificationAdmin: createPermission(
    "notification",
    "manage",
    "Configure notification settings and send broadcasts"
  ),
};

export const permissionList = Object.values(permissions);
