/**
 * Supported actions for permissions.
 */
export type PermissionAction = "read" | "manage";

/**
 * Represents a permission that can be assigned to roles.
 */
export interface Permission {
  /** Permission identifier (e.g., "catalog.read") */
  id: string;
  /** Human-readable description of what this permission allows */
  description?: string;
}

/**
 * Represents a permission tied to a specific resource and action.
 */
export interface ResourcePermission extends Permission {
  /** The resource this permission applies to */
  resource: string;
  /** The action allowed on the resource */
  action: PermissionAction;
}

/**
 * Helper to create a standardized resource permission.
 *
 * @param resource The resource name (e.g., "catalog", "healthcheck")
 * @param action The action (e.g., "read", "manage")
 * @param description Optional human-readable description
 */
export function createPermission(
  resource: string,
  action: PermissionAction,
  description?: string
): ResourcePermission {
  return {
    id: `${resource}.${action}`,
    resource,
    action,
    description,
  };
}

// =============================================================================
// RPC PROCEDURE METADATA
// =============================================================================

/**
 * Metadata interface for RPC procedures.
 * Used by contracts to define auth requirements and by backend middleware to enforce them.
 *
 * @example
 * const contract = {
 *   getItems: baseContractBuilder
 *     .meta({
 *       userType: "user",
 *       permissions: [permissions.myPluginRead.id]
 *     })
 *     .output(z.array(ItemSchema)),
 * };
 */
export interface ProcedureMetadata {
  /**
   * Which type of caller can access this endpoint.
   * - "anonymous": No authentication required (public endpoint)
   * - "user": Only real users (frontend authenticated)
   * - "service": Only services (backend-to-backend)
   * - "both": Either users or services, but must be authenticated (default)
   */
  userType?: "anonymous" | "user" | "service" | "both";

  /**
   * Permissions required to access this endpoint.
   * Only enforced for real users - services are trusted.
   * User must have at least one of the listed permissions, or "*" (wildcard).
   */
  permissions?: string[];
}
