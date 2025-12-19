import { FetchApi } from "@checkmate/frontend-api";
import { authClient } from "../lib/auth";
export class CoreFetchApi implements FetchApi {
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);

    // Retrieve token from Better Auth session
    const session = await authClient.getSession();
    const token: string | undefined = session?.data?.session?.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  }
}
