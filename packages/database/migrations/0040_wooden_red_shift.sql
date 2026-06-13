CREATE TABLE "talent_pool_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"survey_id" uuid NOT NULL,
	"company_slug" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "snd_subscribed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "competition_applications" ADD COLUMN "jury_score" integer;--> statement-breakpoint
ALTER TABLE "competition_applications" ADD COLUMN "jury_notes" text;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "scenario_text" text;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "difficulty" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "topic_tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "cert_code" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "company_slug" text;--> statement-breakpoint
ALTER TABLE "talent_pool_entries" ADD CONSTRAINT "talent_pool_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_pool_entries" ADD CONSTRAINT "talent_pool_entries_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talent_pool_user_idx" ON "talent_pool_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "talent_pool_company_idx" ON "talent_pool_entries" USING btree ("company_slug");--> statement-breakpoint
CREATE INDEX "talent_pool_survey_idx" ON "talent_pool_entries" USING btree ("survey_id");--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_cert_code_unique" UNIQUE("cert_code");