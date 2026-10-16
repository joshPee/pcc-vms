-- PCC-VMS extensions: tables and columns used by visitor management features

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS vehicle_registration VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

ALTER TABLE check_outs
  ALTER COLUMN user_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  incident_type VARCHAR(100),
  severity VARCHAR(50) DEFAULT 'Low',
  location VARCHAR(255),
  reported_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Open',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_handovers (
  id SERIAL PRIMARY KEY,
  outgoing_officer VARCHAR(255) NOT NULL,
  incoming_officer VARCHAR(255) NOT NULL,
  shift_date DATE,
  notes TEXT,
  visitors_on_site TEXT,
  incidents TEXT,
  pending_tasks TEXT,
  equipment_status TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(50) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  color VARCHAR(50),
  owner_name VARCHAR(255),
  owner_phone VARCHAR(50),
  purpose TEXT,
  is_active BOOLEAN DEFAULT true,
  registered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_shift_date ON shift_handovers(shift_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);

INSERT INTO settings (key, value) VALUES ('gateContactPhone', '+233000000000')
ON CONFLICT (key) DO NOTHING;
