import { FetchApi } from "@checkmate-monitor/frontend-api";

export class CoreFetchApi implements FetchApi {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);

    return fetch(input, {
      ...init,
      headers,
      credentials: "include",
    });
  }

  forPlugin(pluginId: string): {
    fetch(path: string, init?: RequestInit): Promise<Response>;
  } {
    return {
      fetch: (path: string, init?: RequestInit) => {
        return this.fetch(`${this.baseUrl}/api/${pluginId}${path}`, init);
      },
    };
  }
}
