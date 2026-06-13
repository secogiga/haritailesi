CREATE TYPE "public"."store_invoice_status" AS ENUM('draft', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."store_invoice_type" AS ENUM('e_arsiv', 'e_fatura');--> statement-breakpoint
CREATE TABLE "store_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_type" "store_invoice_type" DEFAULT 'e_arsiv' NOT NULL,
	"status" "store_invoice_status" DEFAULT 'draft' NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_tax_number" text,
	"buyer_address" text,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"vat_amount" integer NOT NULL,
	"total" integer NOT NULL,
	"provider_invoice_id" text,
	"provider_response" jsonb,
	"webhook_sent_at" timestamp with time zone,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_variant_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_key" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_invoices" ADD CONSTRAINT "store_invoices_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_variant_stocks" ADD CONSTRAINT "store_variant_stocks_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_invoices_number_idx" ON "store_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "store_invoices_order_idx" ON "store_invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "store_invoices_status_idx" ON "store_invoices" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "store_variant_stocks_product_variant_idx" ON "store_variant_stocks" USING btree ("product_id","variant_key");--> statement-breakpoint
CREATE INDEX "store_variant_stocks_product_idx" ON "store_variant_stocks" USING btree ("product_id");