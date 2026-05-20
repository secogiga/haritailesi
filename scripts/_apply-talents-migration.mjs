/**
 * Talents tablosunu DB'ye ekler.
 * node scripts/_apply-talents-migration.mjs
 */

import postgres from 'postgres';

const DATABASE_URL = 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi';

const sql = postgres(DATABASE_URL);

const migration = `
CREATE TABLE IF NOT EXISTS "talents" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"      uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "display_name" text NOT NULL,
  "category"     text NOT NULL,
  "title"        text NOT NULL,
  "description"  text,
  "media_url"    text,
  "status"       text NOT NULL DEFAULT 'pending',
  "admin_notes"  text,
  "is_published" boolean NOT NULL DEFAULT false,
  "created_at"   timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"   timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "talents_status_idx"   ON "talents" ("status");
CREATE INDEX IF NOT EXISTS "talents_category_idx" ON "talents" ("category");
CREATE INDEX IF NOT EXISTS "talents_user_id_idx"  ON "talents" ("user_id");
`;

async function main() {
  console.log('🔄 Talents migrasyonu uygulanıyor…');
  try {
    await sql.unsafe(migration);
    console.log('✅ Talents tablosu oluşturuldu (veya zaten mevcuttu).');
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
