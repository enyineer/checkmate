import { useMemo } from "react";
import { createAuthClient } from "better-auth/react";
import { useRuntimeConfig } from "@checkmate-monitor/frontend-api";

// Cache for lazy-initialized client
let cachedClient: ReturnType<typeof createAuthClient> | undefined;
let configPromise: Promise<string> | undefined;

/**
 * React hook to get the auth client with proper runtime config.
 * Uses RuntimeConfigProvider to get the base URL.
 */
export function useAuthClient() {
  const { baseUrl } = useRuntimeConfig();

  return useMemo(
    () =>
      createAuthClient({
        baseURL: baseUrl,
        basePath: "/api/auth",
      }),
    [baseUrl]
  );
}

/**
 * Lazy-initialized auth client for class-based APIs.
 * Fetches config from /api/config if not already cached.
 * Use useAuthClient hook in React components instead.
 */
export function getAuthClientLazy(): ReturnType<typeof createAuthClient> {
  if (!cachedClient) {
    // Create with default URL initially
    cachedClient = createAuthClient({
      baseURL: "http://localhost:3000",
      basePath: "/api/auth",
    });

    // Fetch real config and update
    if (!configPromise) {
      configPromise = fetch("/api/config")
        .then((res) => res.json())
        .then((data: { baseUrl: string }) => data.baseUrl)
        .catch(() => "http://localhost:3000");
    }

    configPromise.then((baseUrl) => {
      cachedClient = createAuthClient({
        baseURL: baseUrl,
        basePath: "/api/auth",
      });
    });
  }
  return cachedClient;
}
