CREATE TABLE "survey_live_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"participant_id" text NOT NULL,
	"participant_name" text,
	"answer" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_live_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"host_id" uuid,
	"code" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"current_question_index" integer DEFAULT -1 NOT NULL,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_live_sessions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "competition_applications" ADD COLUMN "file_key" text;--> statement-breakpoint
ALTER TABLE "competition_applications" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "condition_question_id" uuid;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "condition_values" jsonb;--> statement-breakpoint
ALTER TABLE "survey_live_responses" ADD CONSTRAINT "survey_live_responses_session_id_survey_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."survey_live_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_live_responses" ADD CONSTRAINT "survey_live_responses_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_live_sessions" ADD CONSTRAINT "survey_live_sessions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_live_sessions" ADD CONSTRAINT "survey_live_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "live_resp_session_idx" ON "survey_live_responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "live_resp_question_idx" ON "survey_live_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "live_resp_participant_idx" ON "survey_live_responses" USING btree ("session_id","participant_id");--> statement-breakpoint
CREATE INDEX "live_sess_code_idx" ON "survey_live_sessions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "live_sess_status_idx" ON "survey_live_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "live_sess_survey_idx" ON "survey_live_sessions" USING btree ("survey_id");