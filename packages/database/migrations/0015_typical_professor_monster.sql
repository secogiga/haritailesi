CREATE TABLE "course_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" text NOT NULL,
	"payment_ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_lessons" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "max_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "randomize_questions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "question_pool_size" integer;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "show_correct_answers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD COLUMN "time_limit_minutes" integer;--> statement-breakpoint
ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_training_id_cms_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."cms_trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_payments_training_idx" ON "course_payments" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "course_payments_user_idx" ON "course_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "course_payments_status_idx" ON "course_payments" USING btree ("status");