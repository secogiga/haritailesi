CREATE TABLE "newsletter_automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"subscriber_email" text NOT NULL,
	"step_index" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"steps" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriber_profiles" (
	"email" text PRIMARY KEY NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"interest_areas" jsonb DEFAULT '[]' NOT NULL,
	"region" text,
	"source" text,
	"notes" text,
	"is_unsubscribed" boolean DEFAULT false NOT NULL,
	"preference_token" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_tags" (
	"slug" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_automation_logs" ADD CONSTRAINT "newsletter_automation_logs_automation_id_newsletter_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."newsletter_automations"("id") ON DELETE cascade ON UPDATE no action;