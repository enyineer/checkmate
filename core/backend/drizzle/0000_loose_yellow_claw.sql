CREATE TABLE "jwt_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"algorithm" text NOT NULL,
	"created_at" text NOT NULL,
	"expires_at" text,
	"revoked_at" text
);
--> statement-breakpoint
CREATE TABLE "plugin_configs" (
	"plugin_id" text NOT NULL,
	"config_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_configs_plugin_id_config_id_pk" PRIMARY KEY("plugin_id","config_id")
);
--> statement-breakpoint
CREATE TABLE "plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"is_uninstallable" boolean DEFAULT false NOT NULL,
	"config" json DEFAULT '{}'::json,
	"enabled" boolean DEFAULT true NOT NULL,
	"type" text DEFAULT 'backend' NOT NULL,
	CONSTRAINT "plugins_name_unique" UNIQUE("name")
);
