import { User } from "better-auth/types";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

export const enrichUser = async (
  user: User,
  db: NodePgDatabase<typeof schema>
) => {
  // 1. Get Roles
  const userRoles = await db
    .select({
      roleName: schema.role.name,
      roleId: schema.role.id,
    })
    .from(schema.userRole)
    .innerJoin(schema.role, eq(schema.role.id, schema.userRole.roleId))
    .where(eq(schema.userRole.userId, user.id));

  const roles = userRoles.map((r) => r.roleId);
  const permissions = new Set<string>();

  // 2. Get Permissions for each role
  for (const roleId of roles) {
    if (roleId === "admin") {
      permissions.add("*");
      continue;
    }

    const rolePermissions = await db
      .select({
        permissionId: schema.permission.id,
      })
      .from(schema.rolePermission)
      .innerJoin(
        schema.permission,
        eq(schema.permission.id, schema.rolePermission.permissionId)
      )
      .where(eq(schema.rolePermission.roleId, roleId));

    for (const p of rolePermissions) {
      permissions.add(p.permissionId);
    }
  }

  return {
    ...user,
    roles,
    permissions: [...permissions],
  };
};
