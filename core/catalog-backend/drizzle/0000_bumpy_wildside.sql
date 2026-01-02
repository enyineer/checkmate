CREATE TABLE "plugin_catalog"."groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_catalog"."systems" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_catalog"."systems_groups" (
	"system_id" text NOT NULL,
	"group_id" text NOT NULL,
	CONSTRAINT "systems_groups_system_id_group_id_pk" PRIMARY KEY("system_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "plugin_catalog"."views" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"configuration" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plugin_catalog"."systems_groups" ADD CONSTRAINT "systems_groups_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "plugin_catalog"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_catalog"."systems_groups" ADD CONSTRAINT "systems_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "plugin_catalog"."groups"("id") ON DELETE cascade ON UPDATE no action;