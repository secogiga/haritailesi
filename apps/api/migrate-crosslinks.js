const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/haritailesi');
async function run() {
  await sql`ALTER TABLE library_regulations ADD COLUMN IF NOT EXISTS related_term_slugs text[] NOT NULL DEFAULT '{}'`;
  await sql`ALTER TABLE library_guides ADD COLUMN IF NOT EXISTS related_regulation_slugs text[] NOT NULL DEFAULT '{}'`;
  await sql`CREATE TABLE IF NOT EXISTS library_regulation_follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    regulation_slug text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, regulation_slug)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS lrf_user_idx ON library_regulation_follows(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS lrf_slug_idx ON library_regulation_follows(regulation_slug)`;
  console.log('Migration done');
  await sql.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
