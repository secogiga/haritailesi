-- Proje tipi ve yazar bilgileri ekleniyor
ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'sahne',
  ADD COLUMN IF NOT EXISTS "author_name" text,
  ADD COLUMN IF NOT EXISTS "author_initials" text,
  ADD COLUMN IF NOT EXISTS "author_avatar_color" text,
  ADD COLUMN IF NOT EXISTS "author_tag" text,
  ADD COLUMN IF NOT EXISTS "author_tag_color" text,
  ADD COLUMN IF NOT EXISTS "accent_gradient" text,
  ADD COLUMN IF NOT EXISTS "linkedin_url" text,
  ADD COLUMN IF NOT EXISTS "hashtags" text[],
  ADD COLUMN IF NOT EXISTS "external_links" jsonb,
  ADD COLUMN IF NOT EXISTS "image_keys" text[];

CREATE INDEX IF NOT EXISTS "projects_type_idx" ON "projects" ("type");
