import { FetchApi } from "@checkmate/frontend-api";

export class CoreFetchApi implements FetchApi {
  constructor(
    private readonly deps: {
      get: <T>(ref: { id: string }) => T | undefined;
    }
  ) {}

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);

    // Dynamic resolution of AuthApi to avoid hard dependency boot issues
    // and allow swapping auth plugins.
    const authApi = this.deps.get({ id: "auth.api" }) as
      | {
          getSession: () => Promise<{
            data?: { session?: { token?: string } };
          }>;
        }
      | undefined;

    if (authApi) {
      const session = await authApi.getSession();
      const token: string | undefined = session?.data?.session?.token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return fetch(input, {
      ...init,
      headers,
    });
  }
}
