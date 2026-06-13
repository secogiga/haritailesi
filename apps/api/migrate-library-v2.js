/**
 * Library v2 migration:
 * - library_comments tablosu
 * - library_reading_list tablosu
 * - library_regulations.changelog_entries jsonb kolonu
 * - library_terms.featured_until timestamp kolonu
 * - library_guides.featured_until timestamp kolonu
 */
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function run() {
  // 1. library_comments
  await sql`
    CREATE TABLE IF NOT EXISTS library_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content_type text NOT NULL CHECK (content_type IN ('term','guide','regulation','document')),
      content_id uuid NOT NULL,
      body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 2000),
      is_pinned boolean NOT NULL DEFAULT false,
      parent_id uuid REFERENCES library_comments(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS lc_content_idx ON library_comments(content_type, content_id)`;
  await sql`CREATE INDEX IF NOT EXISTS lc_user_idx ON library_comments(user_id)`;
  console.log('✓ library_comments');

  // 2. library_reading_list
  await sql`
    CREATE TABLE IF NOT EXISTS library_reading_list (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content_type text NOT NULL CHECK (content_type IN ('term','guide','regulation','document')),
      content_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, content_type, content_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS lrl_user_idx ON library_reading_list(user_id)`;
  console.log('✓ library_reading_list');

  // 3. changelog_entries kolonu regulation'a
  await sql`
    ALTER TABLE library_regulations
    ADD COLUMN IF NOT EXISTS changelog_entries jsonb NOT NULL DEFAULT '[]'::jsonb
  `;
  console.log('✓ library_regulations.changelog_entries');

  // 4. featured_until kolonları
  await sql`ALTER TABLE library_terms ADD COLUMN IF NOT EXISTS featured_until timestamptz`;
  await sql`ALTER TABLE library_guides ADD COLUMN IF NOT EXISTS featured_until timestamptz`;
  console.log('✓ featured_until on terms + guides');

  await sql.end();
  console.log('\nMigration tamamlandı.');
}
run().catch(e => { console.error(e.message); process.exit(1); });
