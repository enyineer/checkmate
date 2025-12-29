CREATE TYPE "system_status" AS ENUM('healthy', 'degraded', 'unhealthy');--> statement-breakpoint
ALTER TABLE "systems" ALTER COLUMN "status" SET DEFAULT 'healthy'::"system_status";--> statement-breakpoint
ALTER TABLE "systems" ALTER COLUMN "status" SET DATA TYPE "system_status" USING "status"::"system_status";