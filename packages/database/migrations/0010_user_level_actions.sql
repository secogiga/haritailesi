CREATE TABLE "user_level_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_level_actions" ADD CONSTRAINT "user_level_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_level_actions_user_action_unique" ON "user_level_actions" USING btree ("user_id","action_id");
--> statement-breakpoint
CREATE INDEX "user_level_actions_user_id_idx" ON "user_level_actions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_level_actions_action_id_idx" ON "user_level_actions" USING btree ("action_id");
