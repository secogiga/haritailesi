ALTER TYPE "public"."content_request_type" ADD VALUE 'sponsorluk';--> statement-breakpoint
CREATE TABLE "event_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text,
	"display_name" text,
	"phone" text,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_public_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"phone" text,
	"whatsapp_consent" boolean DEFAULT false NOT NULL,
	"ticket_code" text NOT NULL,
	"ticket_tier" text DEFAULT 'standard' NOT NULL,
	"answers" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in" boolean DEFAULT false NOT NULL,
	"checked_in_at" timestamp with time zone,
	CONSTRAINT "event_public_registrations_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "event_session_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"logo_key" text,
	"website_url" text,
	"tier" text DEFAULT 'bronz' NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "whatsapp_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "sms_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD COLUMN "ticket_code" text;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD COLUMN "ticket_tier" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD COLUMN "checked_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD COLUMN "status" text DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "payment_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "mutfak_post_id" uuid;--> statement-breakpoint
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_public_registrations" ADD CONSTRAINT "event_public_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_session_favorites" ADD CONSTRAINT "event_session_favorites_session_id_event_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."event_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_session_favorites" ADD CONSTRAINT "event_session_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_waitlist_event_idx" ON "event_waitlist" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_waitlist_event_user_idx" ON "event_waitlist" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "event_pub_reg_event_idx" ON "event_public_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_pub_reg_email_idx" ON "event_public_registrations" USING btree ("event_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "esf_session_user_idx" ON "event_session_favorites" USING btree ("session_id","user_id");--> statement-breakpoint
CREATE INDEX "esf_session_idx" ON "event_session_favorites" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "esf_user_idx" ON "event_session_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_sponsors_event_idx" ON "event_sponsors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsors_tier_idx" ON "event_sponsors" USING btree ("event_id","tier");--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_ticket_code_unique" UNIQUE("ticket_code");