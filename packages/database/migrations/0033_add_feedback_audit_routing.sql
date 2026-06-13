CREATE TABLE "feedback_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "routing_actions" text;--> statement-breakpoint
ALTER TABLE "feedback_status_history" ADD CONSTRAINT "feedback_status_history_feedback_id_feedback_reports_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_status_history_feedback_idx" ON "feedback_status_history" USING btree ("feedback_id");