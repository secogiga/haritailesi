ALTER TABLE "feedback_reports" ADD COLUMN "ticket_no" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "admin_reply" text;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber_profiles" ADD COLUMN "is_confirmed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber_profiles" ADD COLUMN "confirm_token" uuid;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber_profiles" ADD COLUMN "confirm_token_expiry" timestamp with time zone;