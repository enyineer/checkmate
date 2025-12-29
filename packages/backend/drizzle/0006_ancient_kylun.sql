CREATE TABLE "plugin_configs" (
	"plugin_id" text NOT NULL,
	"config_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_configs_plugin_id_config_id_pk" PRIMARY KEY("plugin_id","config_id")
);

-- Drop old config tables (configs will be reconfigured manually)
DROP TABLE IF EXISTS "auth_strategy";
DROP TABLE IF EXISTS "queue_configuration";
