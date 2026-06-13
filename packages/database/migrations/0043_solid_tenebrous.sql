ALTER TABLE "library_terms" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "library_terms" ADD CONSTRAINT "library_terms_slug_unique" UNIQUE("slug");