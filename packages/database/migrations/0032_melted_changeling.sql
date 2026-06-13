ALTER TYPE "public"."feedback_status" ADD VALUE 'expert_review' BEFORE 'suggested';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'partner_referred' BEFORE 'suggested';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'offer_pending' BEFORE 'suggested';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'education_suggested' BEFORE 'suggested';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'gpt_responded' BEFORE 'suggested';--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "user_type" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "attachment_urls" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "satisfaction_score" integer;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "ai_summary" text;