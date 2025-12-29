import { oc } from "@orpc/contract";
import { z } from "zod";
import { permissions } from "./index";

// Permission metadata type
export interface AuthMetadata {
  permissions?: string[];
}

// Base builder with metadata support
const _base = oc.$meta<AuthMetadata>({});

// Zod schemas for return types
const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
});

const RoleDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
});

const StrategyDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  configVersion: z.number(),
  configSchema: z.record(z.string(), z.unknown()), // JSON Schema representation
  config: z.record(z.string(), z.unknown()).optional(), // VersionedConfig.data (secrets redacted)
});

// Auth RPC Contract with permission metadata
export const authContract = {
  // Permission query - Authenticated only (no specific permission required)
  permissions: _base
    .meta({ permissions: [] }) // Anyone authenticated can check their own permissions
    .output(z.object({ permissions: z.array(z.string()) })),

  // User management - Read permission for queries, Manage for mutations
  getUsers: _base
    .meta({ permissions: [permissions.usersRead.id] })
    .output(z.array(UserDtoSchema)),

  deleteUser: _base
    .meta({ permissions: [permissions.usersManage.id] })
    .input(z.string())
    .output(z.void()),

  updateUserRoles: _base
    .meta({ permissions: [permissions.usersManage.id] })
    .input(
      z.object({
        userId: z.string(),
        roles: z.array(z.string()),
      })
    )
    .output(z.void()),

  // Role management - Manage permission
  getRoles: _base
    .meta({ permissions: [permissions.rolesManage.id] })
    .output(z.array(RoleDtoSchema)),

  getStrategies: _base
    .meta({ permissions: [permissions.strategiesManage.id] })
    .output(z.array(StrategyDtoSchema)),

  updateStrategy: _base
    .meta({ permissions: [permissions.strategiesManage.id] })
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean(),
        config: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .output(z.object({ success: z.boolean() })),

  reloadAuth: _base
    .meta({ permissions: [permissions.strategiesManage.id] })
    .output(z.object({ success: z.boolean() })),
};

// Export contract type for frontend
export type AuthContract = typeof authContract;

// Keep old interface for backwards compatibility
export interface AuthRpcContract {
  permissions: () => Promise<{ permissions: string[] }>;
  getUsers: () => Promise<
    Array<{
      id: string;
      email: string;
      name: string;
      roles: string[];
    }>
  >;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRoles: (input: {
    userId: string;
    roles: string[];
  }) => Promise<void>;
  getRoles: () => Promise<
    Array<{
      id: string;
      name: string;
      permissions: string[];
    }>
  >;
  getStrategies: () => Promise<
    Array<{
      id: string;
      displayName: string;
      description?: string;
      enabled: boolean;
      configVersion: number;
      configSchema: Record<string, unknown>;
      config?: Record<string, unknown>;
    }>
  >;
  updateStrategy: (input: {
    id: string;
    enabled: boolean;
    config?: Record<string, unknown>;
  }) => Promise<{ success: boolean }>;
  reloadAuth: () => Promise<{ success: boolean }>;
}
