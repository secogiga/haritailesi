CREATE TYPE "public"."library_document_type" AS ENUM('pdf', 'technical_spec', 'academic', 'report', 'standard', 'guide_doc');--> statement-breakpoint
CREATE TYPE "public"."library_field" AS ENUM('klasik_haritacilik', 'cbs', 'fotogrametri', 'kadastro', 'uzaktan_algilama', 'gayrimenkul_degerleme', 'yazilim', 'kariyer', 'egitim', 'kamu', 'ozel_sektor', 'insaat', 'genel');--> statement-breakpoint
CREATE TYPE "public"."library_guide_type" AS ENUM('guide', 'article', 'roadmap', 'technical_doc', 'career_guide');--> statement-breakpoint
CREATE TYPE "public"."library_regulation_type" AS ENUM('kanun', 'yonetmelik', 'genelge', 'teknik_teblig', 'kurum_yazisi');--> statement-breakpoint
CREATE TYPE "public"."library_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "library_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "library_document_type" DEFAULT 'pdf' NOT NULL,
	"field" "library_field"[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"file_url" text,
	"external_url" text,
	"author_name" text,
	"publish_year" integer,
	"file_size_bytes" integer,
	"status" "library_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text,
	"type" "library_guide_type" DEFAULT 'guide' NOT NULL,
	"field" "library_field"[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"author_name" text,
	"status" "library_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"reading_time_minutes" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_guides_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "library_regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"short_title" text,
	"type" "library_regulation_type" DEFAULT 'yonetmelik' NOT NULL,
	"field" "library_field"[] DEFAULT '{}' NOT NULL,
	"issuing_body" text,
	"reference_number" text,
	"publish_date" text,
	"summary" text,
	"full_text" text,
	"ai_summary" text,
	"external_url" text,
	"status" "library_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"related_regulation_ids" uuid[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_regulations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "library_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"full_form" text,
	"definition" text NOT NULL,
	"field" "library_field"[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"related_term_ids" uuid[] DEFAULT '{}' NOT NULL,
	"see_also" text[] DEFAULT '{}' NOT NULL,
	"status" "library_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "result_stats" jsonb;--> statement-breakpoint
CREATE INDEX "ld_status_idx" ON "library_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ld_type_idx" ON "library_documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ld_featured_idx" ON "library_documents" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "lg_status_idx" ON "library_guides" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lg_slug_idx" ON "library_guides" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "lg_type_idx" ON "library_guides" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lg_featured_idx" ON "library_guides" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "lr_status_idx" ON "library_regulations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lr_slug_idx" ON "library_regulations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "lr_type_idx" ON "library_regulations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lr_featured_idx" ON "library_regulations" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "lt_status_idx" ON "library_terms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lt_term_idx" ON "library_terms" USING btree ("term");--> statement-breakpoint
CREATE INDEX "lt_featured_idx" ON "library_terms" USING btree ("is_featured");