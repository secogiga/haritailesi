ALTER TYPE "public"."feedback_type" ADD VALUE 'hikaye';--> statement-breakpoint
ALTER TYPE "public"."feedback_type" ADD VALUE 'reklam';--> statement-breakpoint
CREATE TABLE "user_level_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registration_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registration_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"question" text NOT NULL,
	"question_type" text DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"speaker_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"session_type" text DEFAULT 'talk' NOT NULL,
	"hall" text,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"affiliation" text,
	"bio" text,
	"avatar_url" text,
	"linkedin_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"target" text NOT NULL,
	"target_tier" text,
	"target_user_id" uuid,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"sent_email" boolean DEFAULT false NOT NULL,
	"sent_notification" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_requests" ALTER COLUMN "slot_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_level_actions" ADD CONSTRAINT "user_level_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_answers" ADD CONSTRAINT "event_registration_answers_attendance_id_event_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."event_attendances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_answers" ADD CONSTRAINT "event_registration_answers_question_id_event_registration_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."event_registration_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_questions" ADD CONSTRAINT "event_registration_questions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_speaker_id_event_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."event_speakers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_broadcasts" ADD CONSTRAINT "admin_broadcasts_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_broadcasts" ADD CONSTRAINT "admin_broadcasts_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_level_actions_user_action_unique" ON "user_level_actions" USING btree ("user_id","action_id");--> statement-breakpoint
CREATE INDEX "user_level_actions_user_id_idx" ON "user_level_actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_level_actions_action_id_idx" ON "user_level_actions" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "event_reg_questions_event_idx" ON "event_registration_questions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sessions_event_idx" ON "event_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_speakers_event_idx" ON "event_speakers" USING btree ("event_id");