CREATE TYPE "public"."store_payout_status" AS ENUM('held', 'released', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."store_seller_payout_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TABLE "store_seller_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"total_amount" integer NOT NULL,
	"status" "store_seller_payout_status" DEFAULT 'pending' NOT NULL,
	"item_ids" text[] DEFAULT '{}' NOT NULL,
	"admin_notes" text,
	"paid_at" timestamp with time zone,
	"paid_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_order_items" ADD COLUMN "payout_status" "store_payout_status" DEFAULT 'held' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_order_items" ADD COLUMN "buyer_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_order_items" ADD COLUMN "auto_release_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_seller_payouts" ADD CONSTRAINT "store_seller_payouts_seller_id_store_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."store_sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_seller_payouts" ADD CONSTRAINT "store_seller_payouts_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_seller_payouts_seller_idx" ON "store_seller_payouts" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "store_seller_payouts_status_idx" ON "store_seller_payouts" USING btree ("status");