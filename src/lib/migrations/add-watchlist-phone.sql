-- Migration: add phone column to watchlist table
-- Run once against the Neon DB (psql or Neon console)

ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_watchlist_phone ON watchlist(phone);

-- Optional: backfill existing entries if phone data is known
-- UPDATE watchlist SET phone = '...' WHERE full_name = '...';

