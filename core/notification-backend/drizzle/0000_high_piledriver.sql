CREATE TABLE "plugin_notification"."notification_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"owner_plugin" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_notification"."notification_subscriptions" (
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_subscriptions_user_id_group_id_pk" PRIMARY KEY("user_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "plugin_notification"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"actions" jsonb,
	"importance" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"group_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plugin_notification"."notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_group_id_notification_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "plugin_notification"."notification_groups"("id") ON DELETE cascade ON UPDATE no action;