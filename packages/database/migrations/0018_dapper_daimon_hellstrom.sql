CREATE TYPE "public"."store_coupon_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TABLE "store_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" "store_coupon_type" DEFAULT 'percentage' NOT NULL,
	"discount_value" integer NOT NULL,
	"min_order_amount" integer DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "store_coupons_code_idx" ON "store_coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "store_coupons_active_idx" ON "store_coupons" USING btree ("is_active");