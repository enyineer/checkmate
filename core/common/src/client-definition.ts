import type { ContractRouterClient, AnyContractRouter } from "@orpc/contract";

/**
 * A client definition that bundles an RPC contract type with its plugin metadata.
 * Used for type-safe plugin RPC consumption.
 *
 * @example
 * ```typescript
 * // Define in auth-common
 * export const AuthApi = createClientDefinition(authContract, { pluginId: "auth" });
 *
 * // Use in frontend/backend
 * const authClient = rpcApi.forPlugin(AuthApi);  // Fully typed!
 * ```
 */
export interface ClientDefinition<
  TContract extends AnyContractRouter = AnyContractRouter
> {
  readonly pluginId: string;
  /**
   * Phantom type for contract type inference.
   * This property doesn't exist at runtime - it's only used by TypeScript
   * to carry the contract type information for type inference.
   */
  readonly __contractType?: TContract;
}

/**
 * Type helper to extract the client type from a ClientDefinition.
 *
 * @example
 * ```typescript
 * type AuthClient = InferClient<typeof AuthApi>;
 * // Equivalent to: ContractRouterClient<typeof authContract>
 * ```
 */
export type InferClient<T extends ClientDefinition> =
  T extends ClientDefinition<infer C> ? ContractRouterClient<C> : never;

/**
 * Create a typed client definition for a plugin's RPC contract.
 *
 * This bundles the contract type with the plugin ID, enabling type-safe
 * forPlugin() calls without manual type annotations.
 *
 * @param _contract - The RPC contract object (used only for type inference)
 * @param options - Configuration including the plugin ID
 * @returns A ClientDefinition object that can be passed to forPlugin()
 *
 * @example
 * ```typescript
 * // In @checkmate/auth-common
 * import { authContract } from "./rpc-contract";
 *
 * export const AuthApi = createClientDefinition(authContract, {
 *   pluginId: "auth",
 * });
 *
 * // In consumer (frontend or backend)
 * const authClient = rpcApi.forPlugin(AuthApi);
 * await authClient.getUsers(); // Fully typed!
 * ```
 */
export function createClientDefinition<TContract extends AnyContractRouter>(
  _contract: TContract,
  options: { pluginId: string }
): ClientDefinition<TContract> {
  return {
    pluginId: options.pluginId,
  } as ClientDefinition<TContract>;
}
