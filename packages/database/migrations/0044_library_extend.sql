-- 0044: Library modülü eksik kolonlar + yardımcı tablolar
-- library_terms, library_guides, library_regulations kolonları
-- ve controller'ın raw SQL ile kullandığı aux tablolar

-- ─── library_terms ────────────────────────────────────────────────────────────

ALTER TABLE "library_terms" ADD COLUMN IF NOT EXISTS "daily_order" integer;
ALTER TABLE "library_terms" ADD COLUMN IF NOT EXISTS "level" text DEFAULT 'beginner';
ALTER TABLE "library_terms" ADD COLUMN IF NOT EXISTS "source_level" text;
ALTER TABLE "library_terms" ADD COLUMN IF NOT EXISTS "contributors" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- ─── library_guides ───────────────────────────────────────────────────────────

ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "author_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "series_slug" text;
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "series_order" integer;
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "related_regulation_slugs" text[] DEFAULT '{}' NOT NULL;
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "level" text DEFAULT 'beginner';
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "source_level" text;
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "library_guides" ADD COLUMN IF NOT EXISTS "contributors" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- ─── library_regulations ──────────────────────────────────────────────────────

ALTER TABLE "library_regulations" ADD COLUMN IF NOT EXISTS "related_term_slugs" text[] DEFAULT '{}' NOT NULL;
ALTER TABLE "library_regulations" ADD COLUMN IF NOT EXISTS "changelog_entries" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "library_regulations" ADD COLUMN IF NOT EXISTS "validity_status" text DEFAULT 'yururlukte' NOT NULL;
ALTER TABLE "library_regulations" ADD COLUMN IF NOT EXISTS "source_level" text;

-- ─── library_paths (yeni tablo) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "library_paths" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "field" "library_field",
  "difficulty" text DEFAULT 'beginner' NOT NULL,
  "estimated_minutes" integer,
  "cover_emoji" text DEFAULT '📚',
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" "library_status" DEFAULT 'draft' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "library_paths_slug_unique" UNIQUE("slug")
);
CREATE INDEX IF NOT EXISTS "lpath_status_idx" ON "library_paths" USING btree ("status");
CREATE INDEX IF NOT EXISTS "lpath_slug_idx" ON "library_paths" USING btree ("slug");

-- ─── library_progress (yeni tablo) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "library_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_type" text NOT NULL,
  "content_id" uuid NOT NULL,
  "marked_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "lp_user_content_unique" ON "library_progress" ("user_id", "content_type", "content_id");
CREATE INDEX IF NOT EXISTS "lp_user_idx" ON "library_progress" ("user_id");

-- ─── library_suggestions (yeni tablo) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "library_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_type" text NOT NULL,
  "content_id" uuid,
  "body" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "admin_note" text,
  "reviewed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ls_status_idx" ON "library_suggestions" ("status");
CREATE INDEX IF NOT EXISTS "ls_user_idx" ON "library_suggestions" ("user_id");

-- ─── library_user_prefs (raw SQL — alan tercihi + bookmark) ──────────────────

CREATE TABLE IF NOT EXISTS "library_user_prefs" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "field_pref" text,
  "bookmarks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── library_comments (raw SQL — topluluk katkıları) ─────────────────────────

CREATE TABLE IF NOT EXISTS "library_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_type" text NOT NULL,
  "content_id" uuid NOT NULL,
  "body" text NOT NULL,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "parent_id" uuid REFERENCES "library_comments"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lc_content_idx" ON "library_comments" ("content_type", "content_id");
CREATE INDEX IF NOT EXISTS "lc_user_idx" ON "library_comments" ("user_id");

-- ─── library_reading_list (raw SQL — okuma listesi) ──────────────────────────

CREATE TABLE IF NOT EXISTS "library_reading_list" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_type" text NOT NULL,
  "content_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "lrl_user_content_unique" ON "library_reading_list" ("user_id", "content_type", "content_id");
CREATE INDEX IF NOT EXISTS "lrl_user_idx" ON "library_reading_list" ("user_id");

-- ─── library_regulation_follows (raw SQL — mevzuat takip) ────────────────────

CREATE TABLE IF NOT EXISTS "library_regulation_follows" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "regulation_slug" text NOT NULL,
  CONSTRAINT "library_regulation_follows_pkey" PRIMARY KEY ("user_id", "regulation_slug")
);
CREATE INDEX IF NOT EXISTS "lrf_slug_idx" ON "library_regulation_follows" ("regulation_slug");
