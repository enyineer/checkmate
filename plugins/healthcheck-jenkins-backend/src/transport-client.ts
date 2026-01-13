import type { TransportClient } from "@checkstack/common";

// ============================================================================
// JENKINS TRANSPORT TYPES
// ============================================================================

/**
 * Jenkins API request configuration.
 */
export interface JenkinsRequest {
  /** API path relative to base URL (e.g., "/api/json", "/job/my-job/api/json") */
  path: string;
  /** Optional query parameters (e.g., { tree: "jobs[name,color]" }) */
  query?: Record<string, string>;
}

/**
 * Jenkins API response result.
 */
export interface JenkinsResponse {
  /** HTTP status code */
  statusCode: number;
  /** Parsed JSON response data */
  data: unknown;
  /** Error message if request failed */
  error?: string;
  /** Jenkins version from X-Jenkins header */
  jenkinsVersion?: string;
}

/**
 * Jenkins transport client type.
 * Requests are API paths with optional query params, results include parsed JSON.
 */
export type JenkinsTransportClient = TransportClient<
  JenkinsRequest,
  JenkinsResponse
>;
