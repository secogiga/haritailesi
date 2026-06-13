CREATE TABLE "store_abandoned_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"cart_snapshot" jsonb NOT NULL,
	"order_id" uuid,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"original_amount" integer NOT NULL,
	"balance" integer NOT NULL,
	"purchased_by_user_id" uuid,
	"purchased_by_email" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text NOT NULL,
	"message" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"order_id" uuid,
	"buyer_id" uuid,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_gift_cards" ADD CONSTRAINT "store_gift_cards_purchased_by_user_id_users_id_fk" FOREIGN KEY ("purchased_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_abandoned_carts_email_idx" ON "store_abandoned_carts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "store_gift_cards_code_idx" ON "store_gift_cards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "store_gift_cards_recipient_idx" ON "store_gift_cards" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "store_reviews_product_idx" ON "store_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "store_reviews_buyer_idx" ON "store_reviews" USING btree ("buyer_id");