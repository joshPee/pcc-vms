-- Migration: Fix registration_source constraint and add missing columns
-- Run once on the live Neon DB (idempotent)

-- 1. Expand registration_source CHECK constraint to include GUARD_STATION
ALTER TABLE participants DROP CONSTRAINT IF EXISTS valid_registration_source;
ALTER TABLE participants ADD CONSTRAINT valid_registration_source
  CHECK (registration_source IN ('ONLINE','WALK_IN','PRE_REGISTERED','GUARD_STATION','IMPORT'));

-- 2. Add unguessable 128-bit QR pass token column
ALTER TABLE participants ADD COLUMN IF NOT EXISTS pass_token VARCHAR(64);

-- 3. Add pass_number column (friendly display number)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS pass_number VARCHAR(32);

-- 4. Add phone column to watchlist for phone-based matching
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 5. Make organisation nullable (guards register walk-ins who may have no org)
ALTER TABLE participants ALTER COLUMN organisation DROP NOT NULL;
