-- Create Event table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  venue VARCHAR(255),
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  registration_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create User table for HR admins
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'security_officer',
  shift VARCHAR(20) DEFAULT 'day',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add shift column if upgrading from old schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT 'day';

-- Create Participant table
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  registration_code VARCHAR(20) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  organisation VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  region VARCHAR(100),
  tags TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  participant_status VARCHAR(50) DEFAULT 'EXPECTED',
  registration_date TIMESTAMP,
  registration_status VARCHAR(50) DEFAULT 'PENDING',
  check_in_status VARCHAR(50) DEFAULT 'NOT_CHECKED_IN',
  check_in_date TIMESTAMP,
  checked_in_by INTEGER,
  registration_source VARCHAR(20) DEFAULT 'ONLINE',
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_participant_status CHECK (participant_status IN ('EXPECTED', 'REGISTERED')),
  CONSTRAINT valid_registration_source CHECK (registration_source IN ('ONLINE', 'WALK_IN', 'PRE_REGISTERED'))
);

-- Create Expected Attendees table
CREATE TABLE IF NOT EXISTS expected_attendees (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  organisation VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  region VARCHAR(100),
  tags TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  registered BOOLEAN DEFAULT false,
  registered_at TIMESTAMP,
  participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL,
  check_in_status VARCHAR(50) DEFAULT 'NOT_CHECKED_IN',
  check_in_date TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CheckIn table with unique constraint on participant_id
CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_registration_code ON participants(registration_code);
CREATE INDEX IF NOT EXISTS idx_participants_full_name ON participants(full_name);
CREATE INDEX IF NOT EXISTS idx_participants_organisation ON participants(organisation);
CREATE INDEX IF NOT EXISTS idx_participants_check_in_status ON participants(check_in_status);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_participant_status ON participants(participant_status);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_check_ins_participant_id ON check_ins(participant_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- GATE GUARD / ARCHIVAL EXTENSIONS
-- Add columns that the gate guard workflows require
-- (safe to run multiple times with IF NOT EXISTS)
-- ============================================================

-- Gate check-in / check-out fields on participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS check_out_date TIMESTAMP;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS check_out_by INTEGER;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS host_name VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS host_department VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS visit_purpose TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS vehicle_registration VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Check-outs table (one row per check-out event; ON CONFLICT to allow re-checkout in edge cases)
CREATE TABLE IF NOT EXISTS check_outs (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  check_out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitor audit log (every check-in / check-out action is recorded here for security archival)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,        -- 'CHECK_IN', 'CHECK_OUT', 'REGISTER', etc.
  user_id INTEGER,                     -- NULL means gate self-service
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient archive / reporting queries
CREATE INDEX IF NOT EXISTS idx_participants_check_out_status ON participants(check_in_status, check_out_date);
CREATE INDEX IF NOT EXISTS idx_participants_vehicle ON participants(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_participants_host_name ON participants(host_name);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_outs_participant_id ON check_outs(participant_id);
CREATE INDEX IF NOT EXISTS idx_check_outs_check_out_time ON check_outs(check_out_time DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_participant_id ON visitor_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_action ON visitor_logs(action);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON visitor_logs(created_at DESC);

