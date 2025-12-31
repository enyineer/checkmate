import {
  pgTable,
  text,
  jsonb,
  integer,
  boolean,
  uuid,
  timestamp,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Health check status enum for type-safe status values.
 */
export const healthCheckStatusEnum = pgEnum("health_check_status", [
  "healthy",
  "unhealthy",
  "degraded",
]);

export type HealthCheckStatus =
  (typeof healthCheckStatusEnum.enumValues)[number];

export const healthCheckConfigurations = pgTable(
  "health_check_configurations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    strategyId: text("strategy_id").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    intervalSeconds: integer("interval_seconds").notNull(),
    isTemplate: boolean("is_template").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const systemHealthChecks = pgTable(
  "system_health_checks",
  {
    systemId: text("system_id").notNull(),
    configurationId: uuid("configuration_id")
      .notNull()
      .references(() => healthCheckConfigurations.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.systemId, t.configurationId] }),
  })
);

export const healthCheckRuns = pgTable("health_check_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  configurationId: uuid("configuration_id")
    .notNull()
    .references(() => healthCheckConfigurations.id, { onDelete: "cascade" }),
  systemId: text("system_id").notNull(),
  status: healthCheckStatusEnum("status").notNull(),
  result: jsonb("result").$type<Record<string, unknown>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
