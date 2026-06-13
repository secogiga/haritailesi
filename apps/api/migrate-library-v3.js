// migrate-library-v3.js — postgres paketi kullanır
const postgresModule = require('../../node_modules/postgres/src/index.js');
const postgres = postgresModule.default ?? postgresModule;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = postgres(url, { max: 1 });

  console.log('Step 1: library_regulations.validity_status');
  await sql`
    ALTER TABLE library_regulations
      ADD COLUMN IF NOT EXISTS validity_status text NOT NULL DEFAULT 'yururlukte'
        CHECK (validity_status IN ('yururlukte','degistirildi','iptal_edildi'))
  `;

  console.log('Step 2: library_progress');
  await sql`
    CREATE TABLE IF NOT EXISTS library_progress (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content_type text NOT NULL CHECK (content_type IN ('term','guide','regulation','document')),
      content_id  uuid NOT NULL,
      marked_at   timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, content_type, content_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS lp_user_idx ON library_progress(user_id)`;

  console.log('Step 3: community_answers upvote_count + is_accepted');
  await sql`ALTER TABLE community_answers ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE community_answers ADD COLUMN IF NOT EXISTS is_accepted  boolean NOT NULL DEFAULT false`;

  console.log('Step 4: community_answer_votes');
  await sql`
    CREATE TABLE IF NOT EXISTS community_answer_votes (
      id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      answer_id uuid NOT NULL REFERENCES community_answers(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, answer_id)
    )
  `;

  console.log('Step 5: library_suggestions');
  await sql`
    CREATE TABLE IF NOT EXISTS library_suggestions (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content_type text NOT NULL CHECK (content_type IN ('term','guide','regulation','document','new_term','new_guide')),
      content_id   uuid,
      body         text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 3000),
      status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      admin_note   text,
      reviewed_by  uuid REFERENCES users(id) ON DELETE SET NULL,
      created_at   timestamptz NOT NULL DEFAULT now(),
      updated_at   timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS ls_status_idx ON library_suggestions(status)`;
  await sql`CREATE INDEX IF NOT EXISTS ls_user_idx   ON library_suggestions(user_id)`;

  console.log('Step 6: exam_questions.related_term_slugs');
  await sql`ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS related_term_slugs text[] NOT NULL DEFAULT '{}'`;
  await sql`CREATE INDEX IF NOT EXISTS eq_term_slugs_idx ON exam_questions USING gin(related_term_slugs)`;

  await sql.end();
  console.log('All done.');
}

main().catch(e => { console.error(e); process.exit(1); });
