import { os as baseOs } from "@orpc/server";
import { HealthCheckRegistry } from "./health-check";
import { QueuePluginRegistry, QueueFactory } from "@checkmate/queue-api";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Logger, Fetch, AuthService, AuthUser } from "./types";

export interface RpcContext {
  db: NodePgDatabase<Record<string, unknown>>;
  logger: Logger;
  fetch: Fetch;
  auth: AuthService;
  user?: AuthUser;
  healthCheckRegistry: HealthCheckRegistry;
  queuePluginRegistry: QueuePluginRegistry;
  queueFactory: QueueFactory;
}

/**
 * The core oRPC server instance for the entire backend.
 * We use $context to define the required initial context for all procedures.
 */
export const os = baseOs.$context<RpcContext>();

/**
 * Middleware that ensures the user is authenticated.
 */
export const authMiddleware = os.middleware(async ({ next, context }) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }
  return next({
    context: {
      user: context.user,
    },
  });
});

/**
 * Base procedure for authenticated requests (users or services).
 */
export const authedProcedure = os.use(authMiddleware);

/**
 * Middleware that ensures the caller is a service (backend-to-backend).
 * Use this for endpoints that should only be callable by other services.
 */
export const serviceOnlyMiddleware = os.middleware(
  async ({ next, context }) => {
    if (!context.user) {
      throw new Error("Unauthorized");
    }
    if (context.user.type !== "service") {
      throw new Error(
        "Forbidden: This endpoint is for service-to-service calls only"
      );
    }
    return next({ context: { user: context.user } });
  }
);

/**
 * Procedure for service-to-service calls only.
 * Services are trusted and don't need permission checks.
 */
export const serviceProcedure = os.use(serviceOnlyMiddleware);

/**
 * Middleware that ensures the caller is a real user (not a service).
 * Use this for endpoints that should only be callable by frontend users.
 */
export const userOnlyMiddleware = os.middleware(async ({ next, context }) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }
  if (context.user.type !== "user") {
    throw new Error("Forbidden: This endpoint is for user access only");
  }
  // Narrow context type to RealUser
  return next({ context: { user: context.user } });
});

/**
 * Procedure for user-facing endpoints only.
 * Narrows context.user to RealUser type for type-safe access to user.id, etc.
 */
export const userProcedure = os.use(userOnlyMiddleware);

/**
 * Middleware that checks for a specific permission.
 * Only applies to real users - services are implicitly trusted.
 */
export const permissionMiddleware = (permission: string | string[]) =>
  os.middleware(async ({ next, context }) => {
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    // Services are implicitly trusted - skip permission checks
    if (context.user.type === "service") {
      return next({});
    }

    const userPermissions = context.user.permissions || [];
    const perms = Array.isArray(permission) ? permission : [permission];

    const hasPermission = perms.some((p) => {
      return userPermissions.includes("*") || userPermissions.includes(p);
    });

    if (!hasPermission) {
      throw new Error(`Forbidden: Missing ${perms.join(" or ")}`);
    }

    return next({});
  });

/**
 * Base authenticated procedure - alias for clarity
 */
export const authenticated = authedProcedure;

/**
 * Helper to create an authenticated procedure with specific permissions.
 * Plugins should use this instead of creating their own permission middleware.
 *
 * @example
 * const getSystems = withPermissions([permissions.catalogRead.id])
 *   .handler(async () => { ... });
 */
export const withPermissions = (permissions: string | string[]) =>
  authenticated.use(permissionMiddleware(permissions));

/**
 * Metadata interface for permission-based procedures.
 * All contracts should extend this metadata type.
 */
export interface PermissionMetadata {
  permissions?: string[];
}

/**
 * Middleware that automatically enforces permissions based on procedure metadata.
 * This reads the `permissions` field from the procedure's metadata and validates
 * the user has at least one of the required permissions.
 *
 * Services are implicitly trusted and skip permission checks.
 *
 * Use this in backend routers: `implement(contract).use(autoPermissionMiddleware)`
 */
export const autoPermissionMiddleware = os.middleware(
  async ({ next, context, procedure }) => {
    // Enforce authentication first
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    const user = context.user;

    // Services are implicitly trusted - skip permission checks
    if (user.type === "service") {
      return next({});
    }

    // Check if procedure has permission requirements in metadata
    const meta = procedure["~orpc"]?.meta as PermissionMetadata | undefined;
    const requiredPermissions = meta?.permissions;

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No permissions required, pass through
      return next({});
    }

    // Check user has at least one of the required permissions
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.some((p: string) => {
      return userPermissions.includes("*") || userPermissions.includes(p);
    });

    if (!hasPermission) {
      throw new Error(`Forbidden: Missing ${requiredPermissions.join(" or ")}`);
    }

    return next({});
  }
);

/**
 * Base contract builder with automatic authentication and permission enforcement.
 *
 * All plugin contracts should use this builder instead of raw `oc` from @orpc/contract.
 * This ensures that:
 * 1. All procedures are authenticated by default
 * 2. Permission metadata is automatically enforced
 * 3. Plugins cannot forget to add security middleware
 *
 * @example
 * import { baseContractBuilder } from "@checkmate/backend-api";
 * import { permissions } from "./permissions";
 *
 * const myContract = {
 *   getItems: baseContractBuilder
 *     .meta({ permissions: [permissions.myPluginRead.id] })
 *     .output(z.array(ItemSchema)),
 * };
 */
export const baseContractBuilder = os.use(autoPermissionMiddleware).meta({});

/**
 * Service interface for the RPC registry.
 */
export interface RpcService {
  /**
   * Registers an oRPC router for a specific plugin.
   */
  registerRouter(pluginId: string, router: unknown): void;

  /**
   * Registers a raw HTTP handler for a specific subpath.
   * This is useful for third-party libraries that provide their own handlers (e.g. Better Auth).
   */
  registerHttpHandler(
    path: string,
    handler: (req: Request) => Promise<Response>
  ): void;
}

export { z as zod } from "zod";
export * from "./contract";
