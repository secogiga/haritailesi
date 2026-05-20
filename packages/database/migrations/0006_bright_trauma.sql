CREATE TABLE "user_engagement_scores" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"aha_score" integer DEFAULT 0 NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"contribution_score" integer DEFAULT 0 NOT NULL,
	"retention_risk_score" integer DEFAULT 0 NOT NULL,
	"aha_reached" boolean DEFAULT false NOT NULL,
	"last_computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_events" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "user_events" ADD COLUMN "action" text;--> statement-breakpoint
ALTER TABLE "user_engagement_scores" ADD CONSTRAINT "user_engagement_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_events_category_action_idx" ON "user_events" USING btree ("category","action");