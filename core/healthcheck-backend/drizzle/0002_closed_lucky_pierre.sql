CREATE TYPE "bucket_size" AS ENUM('hourly', 'daily');--> statement-breakpoint
CREATE TABLE "health_check_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"configuration_id" uuid NOT NULL,
	"system_id" text NOT NULL,
	"bucket_start" timestamp NOT NULL,
	"bucket_size" "bucket_size" NOT NULL,
	"run_count" integer NOT NULL,
	"healthy_count" integer NOT NULL,
	"degraded_count" integer NOT NULL,
	"unhealthy_count" integer NOT NULL,
	"avg_latency_ms" integer,
	"min_latency_ms" integer,
	"max_latency_ms" integer,
	"p95_latency_ms" integer,
	"aggregated_metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "health_check_aggregates" ADD CONSTRAINT "health_check_aggregates_configuration_id_health_check_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "health_check_configurations"("id") ON DELETE cascade ON UPDATE no action;