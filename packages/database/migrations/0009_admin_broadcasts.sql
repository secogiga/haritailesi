CREATE TABLE "admin_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"target" text NOT NULL,
	"target_tier" text,
	"target_user_id" uuid,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"sent_email" boolean DEFAULT false NOT NULL,
	"sent_notification" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_broadcasts" ADD CONSTRAINT "admin_broadcasts_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "admin_broadcasts" ADD CONSTRAINT "admin_broadcasts_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
