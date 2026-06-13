CREATE TABLE "newsletters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"month" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text,
	"selected_content" jsonb DEFAULT '{"events":[],"trainings":[],"intro":"","highlight":""}'::jsonb,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"whatsapp_template_name" text,
	"whatsapp_language" text DEFAULT 'tr',
	"brevo_campaign_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp with time zone,
	"email_count" integer,
	"whatsapp_count" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_alert_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"type" text NOT NULL,
	"token" text NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_alert_subscriptions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "newsletters_month_idx" ON "newsletters" USING btree ("month");--> statement-breakpoint
CREATE INDEX "newsletters_status_idx" ON "newsletters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_alert_email_type_idx" ON "listing_alert_subscriptions" USING btree ("email","type");--> statement-breakpoint
CREATE INDEX "listing_alert_token_idx" ON "listing_alert_subscriptions" USING btree ("token");