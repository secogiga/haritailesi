ALTER TYPE "public"."feedback_status" ADD VALUE 'reviewing' BEFORE 'in_progress';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'awaiting_info' BEFORE 'in_progress';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'mentoring' BEFORE 'resolved';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'suggested' BEFORE 'resolved';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "urgency" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "sub_category" text;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "expectation" text;