CREATE TABLE "user_notification_preferences" (
	"user_id" text NOT NULL,
	"strategy_id" text NOT NULL,
	"config" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"external_id" text,
	"linked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_notification_preferences_user_id_strategy_id_pk" PRIMARY KEY("user_id","strategy_id")
);
