-- Migration: Allow AUTO_CHECKED_OUT status and AUTO_CHECK_OUT audit action
-- Run once against the Neon DB (psql or Neon console)

ALTER TABLE participants DROP CONSTRAINT IF EXISTS valid_check_in_status;
ALTER TABLE participants ADD CONSTRAINT valid_check_in_status 
CHECK (check_in_status IN ('NOT_CHECKED_IN', 'CHECKED_IN', 'CHECKED_OUT', 'AUTO_CHECKED_OUT', 'DENIED'));

ALTER TABLE visitor_logs DROP CONSTRAINT IF EXISTS valid_action;
ALTER TABLE visitor_logs ADD CONSTRAINT valid_action 
CHECK (action IN ('CHECK_IN', 'CHECK_OUT', 'REGISTER', 'UPDATE', 'WATCHLIST_ALERT', 'WATCHLIST_DENIED', 'WATCHLIST_OVERRIDE', 'AUTO_CHECK_OUT'));
