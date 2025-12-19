CREATE TABLE IF NOT EXISTS "plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"is_uninstallable" boolean DEFAULT false NOT NULL,
	"config" json DEFAULT '{}'::json,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "plugins_name_unique" UNIQUE("name")
);
