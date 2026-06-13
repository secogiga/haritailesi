// migrate-library-v4.js
const postgresModule = require('../../node_modules/postgres/src/index.js');
const postgres = postgresModule.default ?? postgresModule;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = postgres(url, { max: 1 });

  console.log('Step 1: exam_categories');
  await sql`
    CREATE TABLE IF NOT EXISTS exam_categories (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name          text NOT NULL,
      slug          text NOT NULL UNIQUE,
      description   text,
      exam_type     text NOT NULL DEFAULT 'diger'
                      CHECK (exam_type IN ('kpss','uzmanlik','deger','cbs','diger')),
      icon_emoji    text DEFAULT '📝',
      question_count integer NOT NULL DEFAULT 0,
      is_active     boolean NOT NULL DEFAULT true,
      sort_order    integer NOT NULL DEFAULT 0,
      created_at    timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS exam_cats_type_idx   ON exam_categories(exam_type)`;
  await sql`CREATE INDEX IF NOT EXISTS exam_cats_active_idx ON exam_categories(is_active)`;

  console.log('Step 2: exam_questions');
  await sql`
    CREATE TABLE IF NOT EXISTS exam_questions (
      id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id         uuid NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
      question_text       text NOT NULL,
      option_a            text NOT NULL,
      option_b            text NOT NULL,
      option_c            text NOT NULL,
      option_d            text NOT NULL,
      option_e            text,
      correct_option      text NOT NULL CHECK (correct_option IN ('a','b','c','d','e')),
      explanation         text,
      difficulty          text NOT NULL DEFAULT 'medium'
                            CHECK (difficulty IN ('easy','medium','hard')),
      source              text,
      related_term_slugs  text[] NOT NULL DEFAULT '{}',
      is_active           boolean NOT NULL DEFAULT true,
      created_at          timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS exam_q_category_idx   ON exam_questions(category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS exam_q_difficulty_idx ON exam_questions(difficulty)`;
  await sql`CREATE INDEX IF NOT EXISTS exam_q_active_idx     ON exam_questions(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS eq_term_slugs_idx     ON exam_questions USING gin(related_term_slugs)`;

  console.log('Step 3: exam_attempts');
  await sql`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id      uuid NOT NULL REFERENCES exam_categories(id),
      user_id          uuid REFERENCES users(id) ON DELETE SET NULL,
      score            integer NOT NULL,
      total_questions  integer NOT NULL,
      time_taken_seconds integer,
      answers          jsonb NOT NULL DEFAULT '{}',
      completed_at     timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS exam_attempts_category_idx  ON exam_attempts(category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS exam_attempts_user_idx      ON exam_attempts(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS exam_attempts_completed_idx ON exam_attempts(completed_at)`;

  console.log('Step 4: posts.library_refs');
  await sql`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS library_refs jsonb NOT NULL DEFAULT '[]'
  `;

  console.log('Step 5: library_terms.daily_order (for stable daily rotation)');
  await sql`ALTER TABLE library_terms ADD COLUMN IF NOT EXISTS daily_order integer`;
  await sql`
    UPDATE library_terms SET daily_order = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
      FROM library_terms WHERE status = 'published'
    ) sub
    WHERE library_terms.id = sub.id AND library_terms.daily_order IS NULL
  `;

  await sql.end();
  console.log('All done.');
}

main().catch(e => { console.error(e); process.exit(1); });
