import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Hono, MiddlewareHandler, Context, Handler } from "hono";
import { createServiceRef } from "./service-ref";
import { ZodSchema } from "zod";

// Define a Logger interface to avoid strict dependency on specific logger lib in types
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export interface Fetch {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;

  /**
   * Helper for inter-plugin communication.
   * Automatically handles URL construction and credential injection.
   */
  forPlugin(pluginId: string): {
    fetch(path: string, init?: RequestInit): Promise<Response>;
    get(path: string, init?: RequestInit): Promise<Response>;
    post(path: string, body?: unknown, init?: RequestInit): Promise<Response>;
    put(path: string, body?: unknown, init?: RequestInit): Promise<Response>;
    patch(path: string, body?: unknown, init?: RequestInit): Promise<Response>;
    delete(path: string, init?: RequestInit): Promise<Response>;
  };
}

export type AuthUser = {
  [key: string]: unknown;
  permissions?: string[];
  roles?: string[];
};

// Define AuthenticationStrategy interface (for verifying User Sessions)
export interface AuthenticationStrategy {
  validate(request: Request): Promise<AuthUser | undefined>; // Returns User or undefined
}

export const authenticationStrategyServiceRef =
  createServiceRef<AuthenticationStrategy>("internal.authenticationStrategy");

export interface PluginInstaller {
  install(packageName: string): Promise<{ name: string; path: string }>;
}

/**
 * Service for authentication and credential management.
 */
export interface AuthService {
  /**
   * Authenticates the incoming request (user or service).
   */
  authenticate(c: Context): Promise<AuthUser | undefined>;

  /**
   * Returns credentials for an outgoing request.
   * If 'c' is provided, it may attempt to forward user credentials.
   * Otherwise, it returns service credentials.
   */
  getCredentials(c?: Context): Promise<{ headers: Record<string, string> }>;

  // Internal factories (usually used by PluginRouter)
  authorize(permission: string | string[]): MiddlewareHandler;
  validate(schema: ZodSchema): MiddlewareHandler;
}

/**
 * Options for declarative route definitions.
 */
export interface RouteOptions {
  permission?: string | string[];
  schema?: ZodSchema;
}

/**
 * A wrapped Hono router that supports declarative permissions and validation.
 */
export interface PluginRouter {
  get(path: string, handler: Handler): void;
  get(path: string, options: RouteOptions, handler: Handler): void;
  post(path: string, handler: Handler): void;
  post(path: string, options: RouteOptions, handler: Handler): void;
  put(path: string, handler: Handler): void;
  put(path: string, options: RouteOptions, handler: Handler): void;
  patch(path: string, handler: Handler): void;
  patch(path: string, options: RouteOptions, handler: Handler): void;
  delete(path: string, handler: Handler): void;
  delete(path: string, options: RouteOptions, handler: Handler): void;
  all(path: string, handler: Handler): void;
  all(path: string, options: RouteOptions, handler: Handler): void;
  use(...args: unknown[]): void;

  /**
   * Provides direct access to the underlying Hono instance.
   */
  readonly hono: Hono;
}

export const coreServices = {
  database:
    createServiceRef<NodePgDatabase<Record<string, never>>>("core.database"),
  httpRouter: createServiceRef<PluginRouter>("core.httpRouter"),
  logger: createServiceRef<Logger>("core.logger"),
  fetch: createServiceRef<Fetch>("core.fetch"),
  auth: createServiceRef<AuthService>("core.auth"),
  healthCheckRegistry: createServiceRef<
    import("./health-check").HealthCheckRegistry
  >("core.healthCheckRegistry"),
  pluginInstaller: createServiceRef<PluginInstaller>("core.pluginInstaller"),
  queuePluginRegistry: createServiceRef<
    import("@checkmate/queue-api").QueuePluginRegistry
  >("core.queuePluginRegistry"),
  queueFactory:
    createServiceRef<import("@checkmate/queue-api").QueueFactory>(
      "core.queueFactory"
    ),
};
