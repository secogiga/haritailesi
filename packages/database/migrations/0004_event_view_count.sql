-- Track how many times each event detail page has been viewed
ALTER TABLE events ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
