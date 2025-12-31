CREATE TABLE "systems_groups" (
	"system_id" text NOT NULL,
	"group_id" text NOT NULL,
	CONSTRAINT "systems_groups_system_id_group_id_pk" PRIMARY KEY("system_id","group_id")
);
--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "groups_system_id_systems_id_fk";
--> statement-breakpoint
ALTER TABLE "systems_groups" ADD CONSTRAINT "systems_groups_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE cascade ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "systems_groups" ADD CONSTRAINT "systems_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "groups" DROP COLUMN "system_id";