CREATE TYPE "public"."membership_sub_status" AS ENUM('pending_payment', 'active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_account" AS ENUM('vakif', 'sirket');--> statement-breakpoint
CREATE TYPE "public"."qa_status" AS ENUM('pending', 'approved', 'rejected', 'hidden');--> statement-breakpoint
CREATE TABLE "user_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"media_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"actual_duration_minutes" integer,
	"mentee_note" text,
	"mentee_rating" integer,
	"mentor_note" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_number_seqs" (
	"year" smallint NOT NULL,
	"category" text NOT NULL,
	"last_seq" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "member_number_seqs_year_category_pk" PRIMARY KEY("year","category")
);
--> statement-breakpoint
CREATE TABLE "membership_fee_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"tier" "membership_tier" NOT NULL,
	"amount_kurus" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"donation_id" uuid,
	"guest_email" text,
	"guest_full_name" text,
	"member_number" text NOT NULL,
	"member_number_year" smallint NOT NULL,
	"member_number_category" text NOT NULL,
	"member_number_seq" integer NOT NULL,
	"membership_tier" "membership_tier" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "membership_sub_status" DEFAULT 'pending_payment' NOT NULL,
	"reminder_30_sent_at" timestamp with time zone,
	"reminder_7_sent_at" timestamp with time zone,
	"reminder_1_sent_at" timestamp with time zone,
	"expired_notified_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"submitter_user_id" uuid,
	"submitter_email" text,
	"submitter_name" text,
	"submitter_tier" text,
	"body" text NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"show_full_name" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"display_name" text,
	"question_text" text NOT NULL,
	"category" "post_category" DEFAULT 'haritailesi_duyurulari' NOT NULL,
	"status" "qa_status" DEFAULT 'pending' NOT NULL,
	"is_mutfak_published" boolean DEFAULT false NOT NULL,
	"is_sahne_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"feed_post_id" uuid,
	"show_full_name" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'sahne' NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "membership_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "max_capacity" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_cancelled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" text DEFAULT 'sahne' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "author_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "author_initials" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "author_avatar_color" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "author_tag" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "author_tag_color" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "accent_gradient" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hashtags" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "external_links" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "image_keys" text[];--> statement-breakpoint
ALTER TABLE "mentee_applications" ADD COLUMN "engagement_type" text DEFAULT 'single_session' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "session_duration_min" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "session_duration_max" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "capacity_type" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "periodic_capacity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "engagement_type" text DEFAULT 'single_session' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "period_months" integer;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "mentee_final_rating" integer;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "mentee_final_comment" text;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD COLUMN "mentor_final_comment" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "payment_account" "payment_account" DEFAULT 'vakif' NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "iyzico_payment_id" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "iyzico_conversation_id" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "proof_key" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "proof_uploaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_resources" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_trainings" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talents" ADD CONSTRAINT "talents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_engagement_id_mentorship_requests_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answers" ADD CONSTRAINT "community_answers_question_id_community_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."community_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answers" ADD CONSTRAINT "community_answers_submitter_user_id_users_id_fk" FOREIGN KEY ("submitter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answers" ADD CONSTRAINT "community_answers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_feed_post_id_posts_id_fk" FOREIGN KEY ("feed_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_events_user_id_idx" ON "user_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_events_type_idx" ON "user_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "user_events_created_at_idx" ON "user_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_events_user_type_idx" ON "user_events" USING btree ("user_id","event_type");--> statement-breakpoint
CREATE INDEX "talents_status_idx" ON "talents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "talents_category_idx" ON "talents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "talents_user_id_idx" ON "talents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mentorship_sessions_engagement_idx" ON "mentorship_sessions" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX "mentorship_sessions_status_idx" ON "mentorship_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mentorship_sessions_scheduled_idx" ON "mentorship_sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mfc_year_tier_unique" ON "membership_fee_configs" USING btree ("year","tier");--> statement-breakpoint
CREATE INDEX "mfc_year_idx" ON "membership_fee_configs" USING btree ("year");--> statement-breakpoint
CREATE INDEX "mfc_active_idx" ON "membership_fee_configs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ms_member_number_unique" ON "membership_subscriptions" USING btree ("member_number");--> statement-breakpoint
CREATE INDEX "ms_user_idx" ON "membership_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ms_status_idx" ON "membership_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ms_expires_at_idx" ON "membership_subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "ms_donation_idx" ON "membership_subscriptions" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "ca_question_idx" ON "community_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "ca_published_idx" ON "community_answers" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "ca_source_idx" ON "community_answers" USING btree ("source");--> statement-breakpoint
CREATE INDEX "cq_status_idx" ON "community_questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cq_category_idx" ON "community_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "cq_created_at_idx" ON "community_questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cq_featured_idx" ON "community_questions" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "cq_mutfak_pub_idx" ON "community_questions" USING btree ("is_mutfak_published");--> statement-breakpoint
CREATE INDEX "cq_sahne_pub_idx" ON "community_questions" USING btree ("is_sahne_published");--> statement-breakpoint
CREATE INDEX "projects_type_idx" ON "projects" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mentee_applications_type_idx" ON "mentee_applications" USING btree ("engagement_type");--> statement-breakpoint
CREATE INDEX "mentor_profiles_capacity_type_idx" ON "mentor_profiles" USING btree ("capacity_type");--> statement-breakpoint
CREATE INDEX "mentorship_requests_type_idx" ON "mentorship_requests" USING btree ("engagement_type");