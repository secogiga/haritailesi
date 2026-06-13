DROP INDEX "surveys_status_idx";--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "correct_options" jsonb;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "points" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "explanation" text;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "max_score" integer;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "time_taken" integer;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "type" text DEFAULT 'anket' NOT NULL;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "allow_anonymous" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "show_results" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "time_limit" integer;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "passing_score" integer;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_q_order_idx" ON "survey_questions" USING btree ("survey_id","sort_order");--> statement-breakpoint
CREATE INDEX "survey_resp_user_idx" ON "survey_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "surveys_type_status_idx" ON "surveys" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "surveys_slug_idx" ON "surveys" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_slug_unique" UNIQUE("slug");