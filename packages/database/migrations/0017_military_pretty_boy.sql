CREATE TYPE "public"."store_item_shipping_status" AS ENUM('pending', 'preparing', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."store_order_status" AS ENUM('pending', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."store_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."store_product_owner" AS ENUM('vakif', 'seller');--> statement-breakpoint
CREATE TYPE "public"."store_product_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."store_product_type" AS ENUM('digital', 'physical', 'app');--> statement-breakpoint
CREATE TYPE "public"."store_seller_source" AS ENUM('sahne', 'mutfak');--> statement-breakpoint
CREATE TYPE "public"."store_seller_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."store_seller_type" AS ENUM('bireysel', 'kurumsal');--> statement-breakpoint
CREATE TABLE "store_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"product_snapshot" jsonb NOT NULL,
	"seller_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"commission_amount" integer DEFAULT 0 NOT NULL,
	"seller_amount" integer DEFAULT 0 NOT NULL,
	"shipping_status" "store_item_shipping_status" DEFAULT 'pending' NOT NULL,
	"tracking_number" text,
	"tracking_company" text,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"shipping_address" jsonb,
	"subtotal" integer NOT NULL,
	"total" integer NOT NULL,
	"iyzico_conversation_id" text,
	"iyzico_payment_id" text,
	"payment_status" "store_payment_status" DEFAULT 'pending' NOT NULL,
	"status" "store_order_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"owner_type" "store_product_owner" DEFAULT 'vakif' NOT NULL,
	"seller_id" uuid,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"type" "store_product_type" NOT NULL,
	"price" integer NOT NULL,
	"member_price" integer,
	"images" text[] DEFAULT '{}' NOT NULL,
	"download_url" text,
	"stock" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"badge_label" text,
	"badge_color" text,
	"status" "store_product_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"applicant_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"business_type" "store_seller_type" DEFAULT 'bireysel' NOT NULL,
	"business_name" text,
	"tax_number" text,
	"iban" text,
	"product_description" text NOT NULL,
	"commission_rate" numeric(5, 4),
	"iyzico_sub_merchant_key" text,
	"status" "store_seller_status" DEFAULT 'pending' NOT NULL,
	"applied_from" "store_seller_source" DEFAULT 'sahne' NOT NULL,
	"admin_notes" text,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_seller_id_store_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."store_sellers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_seller_id_store_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."store_sellers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_sellers" ADD CONSTRAINT "store_sellers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_sellers" ADD CONSTRAINT "store_sellers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_order_items_order_idx" ON "store_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "store_order_items_seller_idx" ON "store_order_items" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "store_order_items_product_idx" ON "store_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "store_orders_buyer_idx" ON "store_orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "store_orders_payment_status_idx" ON "store_orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "store_orders_status_idx" ON "store_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_orders_created_idx" ON "store_orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "store_products_slug_idx" ON "store_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "store_products_status_idx" ON "store_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_products_type_idx" ON "store_products" USING btree ("type");--> statement-breakpoint
CREATE INDEX "store_products_seller_idx" ON "store_products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "store_sellers_status_idx" ON "store_sellers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_sellers_user_idx" ON "store_sellers" USING btree ("user_id");