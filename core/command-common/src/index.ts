import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  createClientDefinition,
  definePluginMetadata,
  type ProcedureMetadata,
} from "@checkmate-monitor/common";

// =============================================================================
// PLUGIN METADATA
// =============================================================================

export const pluginMetadata = definePluginMetadata({
  pluginId: "command",
});

// =============================================================================
// SCHEMAS
// =============================================================================

/**
 * Schema for a search result displayed in the command palette.
 */
export const SearchResultSchema = z.object({
  id: z.string(),
  type: z.enum(["entity", "command"]),
  title: z.string(),
  subtitle: z.string().optional(),
  /** Icon name (resolved by frontend) */
  iconName: z.string().optional(),
  category: z.string(),
  /** Route to navigate to when the result is selected */
  route: z.string().optional(),
  /** For commands: keyboard shortcuts */
  shortcuts: z.array(z.string()).optional(),
  /** Permission IDs required to see this result */
  requiredPermissions: z.array(z.string()).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * Schema for a registered command.
 * Commands are searchable and can have global keyboard shortcuts.
 */
export const CommandSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  /** Cross-platform keyboard shortcuts, e.g. ["meta+shift+i", "ctrl+shift+i"] */
  shortcuts: z.array(z.string()).optional(),
  category: z.string(),
  /** Icon name (resolved by frontend) */
  iconName: z.string().optional(),
  /** Route to navigate to when the command is executed */
  route: z.string(),
  /** Permission IDs required to see/execute this command */
  requiredPermissions: z.array(z.string()).optional(),
});

export type Command = z.infer<typeof CommandSchema>;

// =============================================================================
// RPC CONTRACT
// =============================================================================

const _base = oc.$meta<ProcedureMetadata>({});

/**
 * Command palette RPC contract.
 * Provides search functionality across all registered providers.
 */
export const commandContract = {
  /**
   * Search across all registered search providers.
   * Returns results filtered by user permissions.
   */
  search: _base
    .meta({ userType: "public" })
    .input(z.object({ query: z.string() }))
    .output(z.array(SearchResultSchema)),

  /**
   * Get all registered commands (for browsing without a query).
   * Returns commands filtered by user permissions.
   */
  getCommands: _base
    .meta({ userType: "public" })
    .output(z.array(SearchResultSchema)),
};

export type CommandContract = typeof commandContract;

/**
 * Client definition for type-safe forPlugin usage.
 * Use: `const client = rpcApi.forPlugin(CommandApi);`
 */
export const CommandApi = createClientDefinition(
  commandContract,
  pluginMetadata
);

// =============================================================================
// PERMISSION UTILITIES (shared between frontend and backend)
// =============================================================================

/**
 * Filter items by user permissions.
 * Items without requiredPermissions are always included.
 * Users with the wildcard "*" permission can see all items.
 */
export function filterByPermissions<
  T extends { requiredPermissions?: string[] }
>(items: T[], userPermissions: string[]): T[] {
  // Wildcard permission means access to everything
  const hasWildcard = userPermissions.includes("*");

  return items.filter((item) => {
    // No permissions required - always visible
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }
    // Wildcard user can see everything
    if (hasWildcard) {
      return true;
    }
    // Check if user has all required permissions
    return item.requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );
  });
}
