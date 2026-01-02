CREATE TYPE "incident_severity" AS ENUM('minor', 'major', 'critical');--> statement-breakpoint
CREATE TYPE "incident_status" AS ENUM('investigating', 'identified', 'fixing', 'monitoring', 'resolved');--> statement-breakpoint
CREATE TABLE "incident_systems" (
	"incident_id" text NOT NULL,
	"system_id" text NOT NULL,
	CONSTRAINT "incident_systems_incident_id_system_id_pk" PRIMARY KEY("incident_id","system_id")
);
--> statement-breakpoint
CREATE TABLE "incident_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"message" text NOT NULL,
	"status_change" "incident_status",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "incident_status" DEFAULT 'investigating' NOT NULL,
	"severity" "incident_severity" DEFAULT 'major' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incident_systems" ADD CONSTRAINT "incident_systems_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE cascade ON UPDATE no action;