-- Migration: Make visitor_logs audit trail append-only and tamper-proof
-- Prohibits UPDATE and DELETE via database trigger and revokes privileges

-- 1. Create trigger function to disallow any modification or removal of audit logs
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit trail is immutable and append-only: UPDATE and DELETE operations are strictly prohibited on visitor_logs table.';
END;
$$ LANGUAGE plpgsql;

-- 2. Bind trigger to visitor_logs
DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering ON visitor_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering
BEFORE UPDATE OR DELETE ON visitor_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_tampering();

-- 3. Revoke UPDATE and DELETE permissions from standard roles
REVOKE UPDATE, DELETE ON visitor_logs FROM PUBLIC;

-- 4. Cryptographic hash chaining columns for tamper verification
ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS record_hash VARCHAR(64);
ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS prev_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_record_hash ON visitor_logs(record_hash);
