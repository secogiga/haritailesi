-- Run once on the database before applying schema push.
-- Enables pg_trgm for trigram-based GIN indexes (faster ILIKE '%q%' searches).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
