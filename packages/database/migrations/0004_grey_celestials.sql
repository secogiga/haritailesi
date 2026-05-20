CREATE TYPE "public"."content_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."content_request_type" AS ENUM('magaza', 'etkinlik', 'egitim', 'ilan');--> statement-breakpoint
CREATE TYPE "public"."donation_method" AS ENUM('bank_transfer', 'iyzico');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."donation_type" AS ENUM('one_time', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."feedback_source" AS ENUM('sahne', 'mutfak', 'web');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('talep', 'gorus');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('full_time', 'part_time', 'freelance', 'internship', 'satilik', 'kiralik', 'aranan', 'hizmet', 'isbirligi', 'diger', 'proje', 'teknik_destek', 'freelancer', 'teknoloji_ekipman', 'ikinci_el', 'mesleki_arac', 'firsat', 'duyuru');--> statement-breakpoint
CREATE TYPE "public"."mentor_application_status" AS ENUM('pending', 'reviewing', 'matched', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mentor_application_type" AS ENUM('mentor', 'mentee');--> statement-breakpoint
ALTER TYPE "public"."functional_role" ADD VALUE 'corporate_rep' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "mentee_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" text NOT NULL,
	"goal" text NOT NULL,
	"preferred_format" text DEFAULT 'online' NOT NULL,
	"source" text DEFAULT 'mutfak' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"type" "feedback_type" DEFAULT 'gorus' NOT NULL,
	"source" "feedback_source" NOT NULL,
	"status" "feedback_status" DEFAULT 'open' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mentor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"type" "mentor_application_type" NOT NULL,
	"source" "feedback_source" DEFAULT 'mutfak' NOT NULL,
	"expertise" text,
	"goals" text,
	"preferred_format" text DEFAULT 'online',
	"status" "mentor_application_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"matched_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"type" "donation_type" DEFAULT 'one_time' NOT NULL,
	"method" "donation_method" DEFAULT 'bank_transfer' NOT NULL,
	"status" "donation_status" DEFAULT 'pending' NOT NULL,
	"iyzico_token" text,
	"reference_code" text,
	"notes" text,
	"donation_category" text DEFAULT 'genel',
	"company_name" text,
	"package_tier" text,
	"renewal_due" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "content_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"source" "feedback_source" DEFAULT 'mutfak' NOT NULL,
	"type" "content_request_type" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"contact_info" text,
	"attachment_url" text,
	"status" "content_request_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"published_content_id" uuid,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text,
	"type" "job_type" DEFAULT 'full_time' NOT NULL,
	"description" text NOT NULL,
	"apply_url" text,
	"apply_email" text,
	"contact_phone" text,
	"price" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"source" text,
	"submitted_by" uuid,
	"content_request_id" uuid,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"notes" text,
	"source" text DEFAULT 'sahne' NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"poster_key" text,
	"deadline" timestamp with time zone,
	"prizes" text,
	"category" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"winners_text" text,
	"application_count" text DEFAULT '0',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"user_id" uuid,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"time_taken_seconds" integer,
	"answers" jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"exam_type" text DEFAULT 'diger' NOT NULL,
	"icon_emoji" text DEFAULT '📝',
	"question_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"option_e" text,
	"correct_option" text NOT NULL,
	"explanation" text,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"source" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_key" text NOT NULL,
	"resource_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"resource_url" text,
	"event_date" timestamp with time zone,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"type" text DEFAULT 'single' NOT NULL,
	"options" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"respondent_email" text,
	"answers" jsonb NOT NULL,
	"source" text DEFAULT 'sahne' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"ends_at" timestamp with time zone,
	"response_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_date" timestamp with time zone NOT NULL,
	"location" text,
	"registration_url" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"university" text NOT NULL,
	"city" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"website" text,
	"member_count" integer DEFAULT 0,
	"description" text,
	"activities" text,
	"logo_key" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"representative_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_clubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cms_trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"instructor" text,
	"instructor_title" text,
	"format" text,
	"level" text,
	"duration" text,
	"price" text,
	"member_price" text,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"registration_url" text,
	"start_date" timestamp with time zone,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_trainings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "corporate_name" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "corporate_role" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "admin_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "initiated_by" text DEFAULT 'mentee' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "mentee_application_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mentee_applications" ADD CONSTRAINT "mentee_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_matched_request_id_mentorship_requests_id_fk" FOREIGN KEY ("matched_request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_content_request_id_content_requests_id_fk" FOREIGN KEY ("content_request_id") REFERENCES "public"."content_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_applications" ADD CONSTRAINT "competition_applications_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_applications" ADD CONSTRAINT "competition_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_category_id_exam_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."exam_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_category_id_exam_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."exam_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_club_id_student_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."student_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_news" ADD CONSTRAINT "club_news_club_id_student_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."student_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_clubs" ADD CONSTRAINT "student_clubs_representative_id_users_id_fk" FOREIGN KEY ("representative_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_clubs" ADD CONSTRAINT "student_clubs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentee_applications_status_idx" ON "mentee_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mentee_applications_user_idx" ON "mentee_applications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subs_user_endpoint_unique" ON "push_subscriptions" USING btree ("user_id","endpoint");--> statement-breakpoint
CREATE INDEX "push_subs_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "donations_reference_unique" ON "donations" USING btree ("reference_code");--> statement-breakpoint
CREATE INDEX "donations_user_idx" ON "donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donations_status_idx" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donations_created_idx" ON "donations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_requests_status_idx" ON "content_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_requests_type_idx" ON "content_requests" USING btree ("type");--> statement-breakpoint
CREATE INDEX "content_requests_user_idx" ON "content_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_listings_status_idx" ON "job_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_listings_type_idx" ON "job_listings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "comp_apps_competition_idx" ON "competition_applications" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "comp_apps_user_idx" ON "competition_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comp_apps_status_idx" ON "competition_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "competitions_status_idx" ON "competitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "competitions_slug_idx" ON "competitions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "competitions_deadline_idx" ON "competitions" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "exam_attempts_category_idx" ON "exam_attempts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "exam_attempts_user_idx" ON "exam_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exam_attempts_completed_idx" ON "exam_attempts" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "exam_cats_type_idx" ON "exam_categories" USING btree ("exam_type");--> statement-breakpoint
CREATE INDEX "exam_cats_active_idx" ON "exam_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "exam_q_category_idx" ON "exam_questions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "exam_q_difficulty_idx" ON "exam_questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "exam_q_active_idx" ON "exam_questions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "exam_res_key_idx" ON "exam_resources" USING btree ("exam_key");--> statement-breakpoint
CREATE INDEX "exam_res_type_idx" ON "exam_resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "exam_res_published_idx" ON "exam_resources" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "survey_q_survey_idx" ON "survey_questions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_resp_survey_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_resp_created_idx" ON "survey_responses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "surveys_status_idx" ON "surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surveys_ends_at_idx" ON "surveys" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "club_events_club_id_idx" ON "club_events" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_events_event_date_idx" ON "club_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "club_news_club_id_idx" ON "club_news" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_news_published_at_idx" ON "club_news" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "student_clubs_status_idx" ON "student_clubs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "student_clubs_university_idx" ON "student_clubs" USING btree ("university");--> statement-breakpoint
CREATE INDEX "student_clubs_city_idx" ON "student_clubs" USING btree ("city");--> statement-breakpoint
CREATE INDEX "trainings_slug_idx" ON "cms_trainings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "trainings_published_idx" ON "cms_trainings" USING btree ("is_published");--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentee_application_id_mentee_applications_id_fk" FOREIGN KEY ("mentee_application_id") REFERENCES "public"."mentee_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_profiles_admin_status_idx" ON "mentor_profiles" USING btree ("admin_status");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");