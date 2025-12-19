import { Hono } from "hono";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AuthService } from "./services/auth-service";

export type dependencies = {
  database: NodePgDatabase<Record<string, never>>;
  router: Hono;
  authService: AuthService;
};

export type initFunction = (deps: dependencies) => Promise<void> | void;
