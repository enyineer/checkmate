import { implement } from "@orpc/server";
import {
  autoAuthMiddleware,
  type RpcContext,
} from "@checkmate-monitor/backend-api";
import {
  commandContract,
  filterByPermissions,
  type SearchResult,
} from "@checkmate-monitor/command-common";
import { getSearchProviders } from "./registry";

/**
 * Creates the command router using contract-based implementation.
 *
 * Auth and permissions are automatically enforced via autoAuthMiddleware
 * based on the contract's meta.userType and meta.permissions.
 */
const os = implement(commandContract)
  .$context<RpcContext>()
  .use(autoAuthMiddleware);

/**
 * Extract permissions from the context user.
 * Only RealUser and ApplicationUser have permissions; ServiceUser doesn't.
 */
function getUserPermissions(context: RpcContext): string[] {
  const user = context.user;
  if (!user) return [];
  if (user.type === "user" || user.type === "application") {
    return user.permissions ?? [];
  }
  // ServiceUser has no permissions array - treated as having all permissions
  // but for search filtering, return empty (no filtering applied)
  return [];
}

export const createCommandRouter = () => {
  /**
   * Search across all registered search providers.
   * Results are aggregated from all providers, filtered by permissions,
   * and returned in priority order.
   */
  const search = os.search.handler(async ({ input, context }) => {
    const providers = getSearchProviders();
    const query = input.query.toLowerCase().trim();

    // Get user permissions for filtering
    const userPermissions = getUserPermissions(context);

    // Execute all provider searches in parallel
    const providerResults = await Promise.all(
      providers.map(async (provider) => {
        try {
          const results = await provider.search(query, { userPermissions });
          return results;
        } catch (error) {
          // Log but don't fail - one failing provider shouldn't break search
          console.error(`Search provider ${provider.id} failed:`, error);
          return [];
        }
      })
    );

    // Flatten and filter by permissions
    const allResults = providerResults.flat();
    return filterByPermissions(allResults, userPermissions);
  });

  /**
   * Get all registered commands for browsing.
   * Returns commands filtered by user permissions.
   */
  const getCommands = os.getCommands.handler(async ({ context }) => {
    const providers = getSearchProviders();
    const userPermissions = getUserPermissions(context);

    // Get all results with empty query (commands return all when query is empty)
    const providerResults = await Promise.all(
      providers.map(async (provider) => {
        try {
          // Empty query = return all items
          const results = await provider.search("", { userPermissions });
          // Filter to only commands for this endpoint
          return results.filter(
            (r): r is SearchResult & { type: "command" } => r.type === "command"
          );
        } catch (error) {
          console.error(`Search provider ${provider.id} failed:`, error);
          return [];
        }
      })
    );

    const allCommands = providerResults.flat();
    return filterByPermissions(allCommands, userPermissions);
  });

  return os.router({
    search,
    getCommands,
  });
};

export type CommandRouter = ReturnType<typeof createCommandRouter>;
