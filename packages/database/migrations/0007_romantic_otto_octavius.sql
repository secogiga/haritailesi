CREATE TYPE "public"."application_payment_status" AS ENUM('pending', 'reminded', 'waiting_verification', 'expired', 'verified', 'failed', 'waived');--> statement-breakpoint
CREATE TYPE "public"."interview_request_state" AS ENUM('pending', 'confirmed', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."slot_type" AS ENUM('membership', 'mentorship');--> statement-breakpoint
ALTER TYPE "public"."donation_type" ADD VALUE 'waived_membership';--> statement-breakpoint
ALTER TYPE "public"."donation_type" ADD VALUE 'sponsorship';--> statement-breakpoint
ALTER TYPE "public"."donation_type" ADD VALUE 'event_payment';--> statement-breakpoint
ALTER TYPE "public"."functional_role" ADD VALUE 'viewer' BEFORE 'admin';--> statement-breakpoint
ALTER TYPE "public"."functional_role" ADD VALUE 'finance' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"slot_type" "slot_type" DEFAULT 'membership' NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"application_id" uuid,
	"mentorship_request_id" uuid,
	"reference_type" text DEFAULT 'membership' NOT NULL,
	"state" "interview_request_state" DEFAULT 'pending' NOT NULL,
	"confirm_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"reschedule_note" text,
	"meet_url" text,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "payment_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "payment_status" "application_payment_status";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "payment_amount_kurus" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "payment_description" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "reminder_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "last_reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_slot_id_availability_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."availability_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_mentorship_request_id_mentorship_requests_id_fk" FOREIGN KEY ("mentorship_request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_slots_admin_idx" ON "availability_slots" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "availability_slots_type_start_idx" ON "availability_slots" USING btree ("slot_type","start_at");--> statement-breakpoint
CREATE INDEX "interview_requests_application_idx" ON "interview_requests" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "interview_requests_slot_idx" ON "interview_requests" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "interview_requests_token_idx" ON "interview_requests" USING btree ("confirm_token");--> statement-breakpoint
CREATE INDEX "interview_requests_state_idx" ON "interview_requests" USING btree ("state");--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;