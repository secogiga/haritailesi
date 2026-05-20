-- Add view_count to Sahne content tables (missing from schema)
ALTER TABLE projects        ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE competitions    ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE surveys         ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE exam_resources  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE cms_trainings   ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Q&A: status enum
DO $$ BEGIN
  CREATE TYPE qa_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Q&A: community questions
CREATE TABLE IF NOT EXISTS community_questions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES users(id) ON DELETE SET NULL,
  email                text NOT NULL,
  display_name         text,
  question_text        text NOT NULL,
  category             text NOT NULL DEFAULT 'haritailesi_duyurulari',
  status               qa_status NOT NULL DEFAULT 'pending',
  is_mutfak_published  boolean NOT NULL DEFAULT false,
  is_sahne_published   boolean NOT NULL DEFAULT false,
  is_featured          boolean NOT NULL DEFAULT false,
  feed_post_id         uuid REFERENCES posts(id) ON DELETE SET NULL,
  view_count           integer NOT NULL DEFAULT 0,
  source               text NOT NULL DEFAULT 'sahne',
  approved_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cq_status_idx      ON community_questions(status);
CREATE INDEX IF NOT EXISTS cq_category_idx    ON community_questions(category);
CREATE INDEX IF NOT EXISTS cq_created_at_idx  ON community_questions(created_at);
CREATE INDEX IF NOT EXISTS cq_featured_idx    ON community_questions(is_featured);
CREATE INDEX IF NOT EXISTS cq_mutfak_pub_idx  ON community_questions(is_mutfak_published);
CREATE INDEX IF NOT EXISTS cq_sahne_pub_idx   ON community_questions(is_sahne_published);

-- Q&A: community answers
CREATE TABLE IF NOT EXISTS community_answers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id         uuid NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  submitter_user_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  submitter_email     text,
  submitter_name      text,
  body                text NOT NULL,
  source              text NOT NULL DEFAULT 'admin',
  is_published        boolean NOT NULL DEFAULT false,
  approved_by         uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ca_question_idx   ON community_answers(question_id);
CREATE INDEX IF NOT EXISTS ca_published_idx  ON community_answers(is_published);
CREATE INDEX IF NOT EXISTS ca_source_idx     ON community_answers(source);
