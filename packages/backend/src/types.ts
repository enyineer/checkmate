import { Hono } from "hono";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export type dependencies = {
  database: NodePgDatabase<Record<string, never>>;
  router: Hono;
};

export type initFunction = (deps: dependencies) => Promise<void> | void;
