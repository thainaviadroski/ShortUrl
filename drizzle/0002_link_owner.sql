ALTER TABLE "links_shorted" ADD COLUMN "created_by" integer;--> statement-breakpoint
-- Links created before ownership existed go to the oldest user (normally the admin).
UPDATE "links_shorted" SET "created_by" = (SELECT min("id") FROM "users") WHERE "created_by" IS NULL;--> statement-breakpoint
ALTER TABLE "links_shorted" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "links_shorted" ADD CONSTRAINT "links_shorted_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "links_shorted_created_by_idx" ON "links_shorted" USING btree ("created_by");
