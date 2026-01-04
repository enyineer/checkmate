ALTER TABLE "user_notification_preferences" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD COLUMN "token_expires_at" timestamp;