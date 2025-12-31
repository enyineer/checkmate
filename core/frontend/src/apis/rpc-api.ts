import { RpcApi } from "@checkmate/frontend-api";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

export class CoreRpcApi implements RpcApi {
  public client: unknown;
  private pluginClientCache: Map<string, unknown> = new Map();

  constructor() {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    const link = new RPCLink({
      url: `${baseUrl}/api`,
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, credentials: "include" }),
    });

    this.client = createORPCClient(link);
  }

  forPlugin<T>(pluginId: string): T {
    if (!this.pluginClientCache.has(pluginId)) {
      this.pluginClientCache.set(
        pluginId,
        (this.client as Record<string, unknown>)[pluginId]
      );
    }
    return this.pluginClientCache.get(pluginId) as T;
  }
}
