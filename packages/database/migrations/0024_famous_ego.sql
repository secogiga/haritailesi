CREATE TABLE "store_loyalty_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_abandoned_carts" ADD COLUMN "reminder_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_abandoned_carts" ADD COLUMN "next_reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_abandoned_carts" ADD COLUMN "converted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_loyalty_points" ADD CONSTRAINT "store_loyalty_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_loyalty_points" ADD CONSTRAINT "store_loyalty_points_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_loyalty_user_idx" ON "store_loyalty_points" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_loyalty_order_idx" ON "store_loyalty_points" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "store_loyalty_type_idx" ON "store_loyalty_points" USING btree ("type");--> statement-breakpoint
CREATE INDEX "store_abandoned_carts_next_reminder_idx" ON "store_abandoned_carts" USING btree ("next_reminder_at");