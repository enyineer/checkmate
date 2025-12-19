import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { createServiceRef } from "./service-ref";

// Define a Logger interface to avoid strict dependency on specific logger lib in types
export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

// Define AuthClient interface
export interface AuthClient {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export const coreServices = {
  database:
    createServiceRef<NodePgDatabase<Record<string, never>>>("core.database"),
  httpRouter: createServiceRef<Hono>("core.httpRouter"),
  logger: createServiceRef<Logger>("core.logger"),
  auth: createServiceRef<AuthClient>("core.auth"),
};
