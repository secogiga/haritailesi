CREATE TABLE "course_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"certificate_code" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"quiz_score" integer,
	CONSTRAINT "course_certificates_certificate_code_unique" UNIQUE("certificate_code")
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"progress_pct" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"training_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content_type" text DEFAULT 'video' NOT NULL,
	"video_url" text,
	"video_embed" text,
	"body" text,
	"pdf_key" text,
	"duration_minutes" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"time_spent_seconds" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "instructor_bio" text;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "instructor_avatar_key" text;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "instructor_user_id" uuid;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "access_level" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "cover_image_key" text;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "prerequisites" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "certificate_threshold" integer DEFAULT 70;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "enrollment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "mutfak_post_id" uuid;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_training_id_cms_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."cms_trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_training_id_cms_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."cms_trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_training_id_cms_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."cms_trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_training_id_cms_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."cms_trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_training_id_cms_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."cms_trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_certificates_training_user_idx" ON "course_certificates" USING btree ("training_id","user_id");--> statement-breakpoint
CREATE INDEX "course_certificates_code_idx" ON "course_certificates" USING btree ("certificate_code");--> statement-breakpoint
CREATE UNIQUE INDEX "course_enrollments_training_user_idx" ON "course_enrollments" USING btree ("training_id","user_id");--> statement-breakpoint
CREATE INDEX "course_enrollments_user_idx" ON "course_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "course_enrollments_training_idx" ON "course_enrollments" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "course_lessons_section_idx" ON "course_lessons" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "course_lessons_training_idx" ON "course_lessons" USING btree ("training_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_lessons_training_slug_idx" ON "course_lessons" USING btree ("training_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "course_reviews_training_user_idx" ON "course_reviews" USING btree ("training_id","user_id");--> statement-breakpoint
CREATE INDEX "course_reviews_training_idx" ON "course_reviews" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "course_sections_training_idx" ON "course_sections" USING btree ("training_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_lesson_user_idx" ON "lesson_progress" USING btree ("lesson_id","user_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_user_idx" ON "lesson_progress" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD CONSTRAINT "cms_trainings_instructor_user_id_users_id_fk" FOREIGN KEY ("instructor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trainings_level_idx" ON "cms_trainings" USING btree ("level");--> statement-breakpoint
CREATE INDEX "trainings_format_idx" ON "cms_trainings" USING btree ("format");