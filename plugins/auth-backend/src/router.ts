import {
  os,
  authedProcedure,
  permissionMiddleware,
  zod,
  type AuthStrategy,
  isSecretSchema,
} from "@checkmate/backend-api";
import {
  permissions as authPermissions,
  type AuthRpcContract,
} from "@checkmate/auth-common";
import * as schema from "./schema";
import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { zodToJsonSchema } from "zod-to-json-schema";
import { encrypt } from "./utils/encryption";
import type { VersionedConfig } from "@checkmate/backend-api";

const usersRead = permissionMiddleware(authPermissions.usersRead.id);
const usersManage = permissionMiddleware(authPermissions.usersManage.id);
const rolesManage = permissionMiddleware(authPermissions.rolesManage.id);
const strategiesManage = permissionMiddleware(
  authPermissions.strategiesManage.id
);

/**
 * Redacts secret fields from a config object before sending to frontend.
 */
function redactSecrets(
  schema: zod.ZodTypeAny,
  config: Record<string, unknown>
): Record<string, unknown> {
  // Type guard to check if this is an object schema
  if (!("shape" in schema)) return config;

  const objectSchema = schema as zod.ZodObject<zod.ZodRawShape>;
  const result: Record<string, unknown> = { ...config };

  for (const [key, fieldSchema] of Object.entries(objectSchema.shape)) {
    if (isSecretSchema(fieldSchema as zod.ZodTypeAny)) {
      // Remove secret fields entirely
      delete result[key];
    }
  }

  return result;
}

/**
 * Encrypts secret fields and merges with existing config.
 * Only updates secrets if new value is provided (non-empty).
 */
function encryptAndMergeSecrets(
  schema: zod.ZodTypeAny,
  newConfig: Record<string, unknown>,
  existingConfig?: Record<string, unknown>
): Record<string, unknown> {
  // Type guard to check if this is an object schema
  if (!("shape" in schema)) return newConfig;

  const objectSchema = schema as zod.ZodObject<zod.ZodRawShape>;
  const result: Record<string, unknown> = { ...newConfig };

  for (const [key, fieldSchema] of Object.entries(objectSchema.shape)) {
    if (isSecretSchema(fieldSchema as zod.ZodTypeAny)) {
      const newValue = newConfig[key];

      if (typeof newValue === "string" && newValue.trim() !== "") {
        // Encrypt new secret value
        result[key] = encrypt(newValue);
      } else if (existingConfig?.[key]) {
        // Preserve existing encrypted value
        result[key] = existingConfig[key];
      }
      // If neither, field will be undefined (not included)
    }
  }

  return result;
}

export interface AuthStrategyInfo {
  id: string;
}

/**
 * Adds x-secret metadata to JSON Schema for fields marked as secret in Zod schema
 */
function addSecretMetadata(
  zodSchema: zod.ZodTypeAny,
  jsonSchema: Record<string, unknown>
): void {
  // Type guard to check if this is an object schema
  if (!("shape" in zodSchema)) return;

  const objectSchema = zodSchema as zod.ZodObject<zod.ZodRawShape>;
  const properties = jsonSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (!properties) return;

  for (const [key, fieldSchema] of Object.entries(objectSchema.shape)) {
    if (isSecretSchema(fieldSchema as zod.ZodTypeAny) && properties[key]) {
      properties[key]["x-secret"] = true;
    }
  }
}

export const createAuthRouter = (
  internalDb: NodePgDatabase<typeof schema>,
  strategyRegistry: { getStrategies: () => AuthStrategy<unknown>[] },
  reloadAuthFn: () => Promise<void>
) => {
  return os.router({
    permissions: authedProcedure.handler(async ({ context }) => {
      return { permissions: context.user?.permissions || [] };
    }),

    getUsers: authedProcedure.use(usersRead).handler(async () => {
      const users = await internalDb.select().from(schema.user);
      if (users.length === 0) return [];

      const userRoles = await internalDb
        .select()
        .from(schema.userRole)
        .where(
          inArray(
            schema.userRole.userId,
            users.map((u) => u.id)
          )
        );

      return users.map((u) => ({
        ...u,
        roles: userRoles
          .filter((ur) => ur.userId === u.id)
          .map((ur) => ur.roleId),
      }));
    }),

    deleteUser: authedProcedure
      .use(usersManage)
      .input(zod.string())
      .handler(async ({ input: id }) => {
        if (id === "initial-admin-id") {
          throw new Error("Cannot delete initial admin");
        }
        await internalDb.delete(schema.user).where(eq(schema.user.id, id));
        return { success: true };
      }),

    getRoles: authedProcedure.use(rolesManage).handler(async () => {
      return internalDb.select().from(schema.role);
    }),

    updateUserRoles: authedProcedure
      .use(rolesManage)
      .input(
        zod.object({
          userId: zod.string(),
          roles: zod.array(zod.string()),
        })
      )
      .handler(async ({ input, context }) => {
        const { userId, roles } = input;

        if (userId === context.user?.id) {
          throw new Error("Cannot update your own roles");
        }

        await internalDb.transaction(async (tx) => {
          await tx
            .delete(schema.userRole)
            .where(eq(schema.userRole.userId, userId));
          if (roles.length > 0) {
            await tx.insert(schema.userRole).values(
              roles.map((roleId) => ({
                userId,
                roleId,
              }))
            );
          }
        });

        return { success: true };
      }),

    getStrategies: authedProcedure.use(strategiesManage).handler(async () => {
      const dbStrategies = await internalDb.select().from(schema.authStrategy);
      const registeredStrategies = strategyRegistry.getStrategies();

      return registeredStrategies.map((strategy) => {
        const dbStrategy = dbStrategies.find((ds) => ds.id === strategy.id);

        // Redact secrets from config before sending to frontend
        let config: Record<string, unknown> | undefined;
        if (dbStrategy?.config) {
          const versionedConfig = dbStrategy.config as VersionedConfig<
            Record<string, unknown>
          >;
          config = redactSecrets(strategy.configSchema, versionedConfig.data);
        }

        // Convert Zod schema to JSON Schema
        const jsonSchema = zodToJsonSchema(strategy.configSchema as never);

        // Add x-secret metadata for secret fields
        addSecretMetadata(
          strategy.configSchema,
          jsonSchema as Record<string, unknown>
        );

        return {
          id: strategy.id,
          displayName: strategy.displayName,
          description: strategy.description,
          enabled: dbStrategy?.enabled ?? true,
          configVersion: strategy.configVersion,
          configSchema: jsonSchema,
          config,
        };
      });
    }),

    updateStrategy: authedProcedure
      .use(strategiesManage)
      .input(
        zod.object({
          id: zod.string(),
          enabled: zod.boolean(),
          config: zod.record(zod.string(), zod.unknown()).optional(),
        })
      )
      .handler(async ({ input }) => {
        const { id, enabled, config } = input;
        const strategy = strategyRegistry
          .getStrategies()
          .find((s) => s.id === id);

        if (!strategy) {
          throw new Error(`Strategy ${id} not found`);
        }

        // Get existing config
        const existing = await internalDb
          .select()
          .from(schema.authStrategy)
          .where(eq(schema.authStrategy.id, id))
          .limit(1);

        let versionedConfig:
          | VersionedConfig<Record<string, unknown>>
          | undefined;

        if (config) {
          const existingConfig = existing[0]?.config as
            | VersionedConfig<Record<string, unknown>>
            | undefined;

          // Encrypt secrets and merge with existing
          const processedConfig = encryptAndMergeSecrets(
            strategy.configSchema,
            config,
            existingConfig?.data
          );

          versionedConfig = {
            version: strategy.configVersion,
            pluginId: "auth-backend",
            data: processedConfig,
          };
        }

        await internalDb
          .insert(schema.authStrategy)
          .values({
            id,
            enabled,
            config: versionedConfig as unknown as Record<string, unknown>,
          })
          .onConflictDoUpdate({
            target: schema.authStrategy.id,
            set: {
              enabled,
              config: versionedConfig as unknown as Record<string, unknown>,
              updatedAt: new Date(),
            },
          });

        return { success: true };
      }),

    reloadAuth: authedProcedure.use(strategiesManage).handler(async () => {
      await reloadAuthFn();
      return { success: true };
    }),
  });
};

export type AuthRouter = ReturnType<typeof createAuthRouter>;

// Compile-time validation: ensure router implements the RPC contract
type _ValidateContract = AuthRpcContract extends AuthRouter
  ? never
  : "Router does not implement AuthRpcContract";
