'use strict';
const path = require('path');
const fs = require('fs');
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=').slice(1).join('=').trim();
const sql = require(path.join(__dirname, '../../node_modules/postgres/cjs/src/index.js'))(dbUrl, { max: 1 });

async function run() {
  await sql`
    ALTER TABLE survey_questions
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS condition_question_id UUID,
      ADD COLUMN IF NOT EXISTS condition_values JSONB DEFAULT '[]'::jsonb
  `;
  console.log('survey_questions güncellendi');

  await sql`
    CREATE TABLE IF NOT EXISTS survey_live_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      host_id UUID REFERENCES users(id) ON DELETE SET NULL,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'waiting',
      current_question_index INTEGER NOT NULL DEFAULT -1,
      participant_count INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS live_sess_code_idx ON survey_live_sessions(code)`;
  await sql`CREATE INDEX IF NOT EXISTS live_sess_status_idx ON survey_live_sessions(status)`;
  await sql`CREATE INDEX IF NOT EXISTS live_sess_survey_idx ON survey_live_sessions(survey_id)`;
  console.log('survey_live_sessions oluşturuldu');

  await sql`
    CREATE TABLE IF NOT EXISTS survey_live_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES survey_live_sessions(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
      participant_id TEXT NOT NULL,
      participant_name TEXT,
      answer JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS live_resp_session_idx ON survey_live_responses(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS live_resp_question_idx ON survey_live_responses(question_id)`;
  await sql`CREATE INDEX IF NOT EXISTS live_resp_participant_idx ON survey_live_responses(session_id, participant_id)`;
  console.log('survey_live_responses oluşturuldu');

  await sql.end();
  console.log('\n✓ Migration tamamlandı!');
}

run().catch(e => { console.error('HATA:', e.message); process.exit(1); });
