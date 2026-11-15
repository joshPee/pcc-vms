-- Migration: add pass_token column to participants table
-- Run once against the Neon DB (psql or Neon console)

ALTER TABLE participants ADD COLUMN IF NOT EXISTS pass_token VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_pass_token ON participants(pass_token);

-- Backfill existing rows that lack pass_token
UPDATE participants
SET pass_token = md5(random()::text || clock_timestamp()::text)
WHERE pass_token IS NULL;

