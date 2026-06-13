CREATE TABLE "store_fraud_blocked_ips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"reason" text,
	"blocked_by" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_fraud_blocked_ips" ADD CONSTRAINT "store_fraud_blocked_ips_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_fraud_blocked_ips_ip_idx" ON "store_fraud_blocked_ips" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "store_fraud_blocked_ips_expires_idx" ON "store_fraud_blocked_ips" USING btree ("expires_at");