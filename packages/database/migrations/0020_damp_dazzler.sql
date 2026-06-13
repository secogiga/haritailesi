CREATE TYPE "public"."store_product_source" AS ENUM('sahne', 'mutfak');--> statement-breakpoint
CREATE TYPE "public"."store_return_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."store_subscription_interval" AS ENUM('monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."store_subscription_status" AS ENUM('active', 'paused', 'cancelled', 'past_due');--> statement-breakpoint
CREATE TABLE "store_b2b_price_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"discount_pct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_b2b_product_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price_kurus" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_product_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_product_id" uuid NOT NULL,
	"included_product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"buyer_id" uuid,
	"buyer_email" text NOT NULL,
	"reason" text NOT NULL,
	"status" "store_return_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"refund_amount" integer,
	"restock_items" boolean DEFAULT true NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'yurtici' NOT NULL,
	"tracking_number" text,
	"tracking_url" text,
	"barcode" text,
	"shipping_cost_kurus" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"provider_response" jsonb,
	"label_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_stock_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"email" text NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"buyer_id" uuid,
	"buyer_email" text NOT NULL,
	"buyer_name" text NOT NULL,
	"interval" "store_subscription_interval" DEFAULT 'monthly' NOT NULL,
	"price_kurus" integer NOT NULL,
	"status" "store_subscription_status" DEFAULT 'active' NOT NULL,
	"iyzico_subscription_reference_code" text,
	"iyzico_customer_reference_code" text,
	"next_billing_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN "shipping_cost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN "selected_installments" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "weight_grams" integer;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "source" "store_product_source";--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "subscription_interval" "store_subscription_interval";--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "subscription_price" integer;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "enabled_installments" jsonb DEFAULT '[1]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "store_b2b_product_prices" ADD CONSTRAINT "store_b2b_product_prices_group_id_store_b2b_price_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."store_b2b_price_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_b2b_product_prices" ADD CONSTRAINT "store_b2b_product_prices_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_product_bundles" ADD CONSTRAINT "store_product_bundles_bundle_product_id_store_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_product_bundles" ADD CONSTRAINT "store_product_bundles_included_product_id_store_products_id_fk" FOREIGN KEY ("included_product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_returns" ADD CONSTRAINT "store_returns_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_returns" ADD CONSTRAINT "store_returns_order_item_id_store_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."store_order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_returns" ADD CONSTRAINT "store_returns_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_shipments" ADD CONSTRAINT "store_shipments_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_stock_notifications" ADD CONSTRAINT "store_stock_notifications_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_wishlist" ADD CONSTRAINT "store_wishlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_wishlist" ADD CONSTRAINT "store_wishlist_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_b2b_prices_product_idx" ON "store_b2b_product_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "store_bundles_bundle_idx" ON "store_product_bundles" USING btree ("bundle_product_id");--> statement-breakpoint
CREATE INDEX "store_returns_order_idx" ON "store_returns" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "store_returns_status_idx" ON "store_returns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_shipments_order_idx" ON "store_shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "store_stock_notifications_product_idx" ON "store_stock_notifications" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "store_stock_notifications_email_idx" ON "store_stock_notifications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "store_subscriptions_buyer_idx" ON "store_subscriptions" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "store_subscriptions_status_idx" ON "store_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_subscriptions_next_billing_idx" ON "store_subscriptions" USING btree ("next_billing_at");--> statement-breakpoint
CREATE INDEX "store_wishlist_user_idx" ON "store_wishlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_wishlist_product_idx" ON "store_wishlist" USING btree ("product_id");