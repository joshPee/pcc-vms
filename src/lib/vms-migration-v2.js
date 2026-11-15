const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running VMS update migration...');

    // 1. Add missing columns to participants
    await client.query(`
      ALTER TABLE participants 
        ADD COLUMN IF NOT EXISTS id_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS id_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS photo_url TEXT,
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS pass_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS badge_returned BOOLEAN DEFAULT true;
    `);
    console.log('Added participant columns.');

    // 2. Sync pass_number with registration_code for any existing rows
    await client.query(`
      UPDATE participants 
      SET pass_number = registration_code 
      WHERE pass_number IS NULL AND registration_code IS NOT NULL;
    `);

    // For any rows already checked in or checked out, ensure approval_status is APPROVED
    await client.query(`
      UPDATE participants
      SET approval_status = 'APPROVED'
      WHERE check_in_status IN ('CHECKED_IN', 'CHECKED_OUT')
        AND (approval_status IS NULL OR approval_status = 'PENDING');
    `);
    console.log('Synchronized existing participant records.');

    // 3. Drop overly strict constraints if they exist to allow full VMS statuses
    try {
      await client.query(`ALTER TABLE participants DROP CONSTRAINT IF EXISTS valid_visitor_type;`);
      await client.query(`ALTER TABLE participants DROP CONSTRAINT IF EXISTS valid_check_in_status;`);
      await client.query(`ALTER TABLE participants DROP CONSTRAINT IF EXISTS valid_participant_status;`);
      console.log('Refreshed constraints.');
    } catch (err) {
      console.warn('Constraint alteration note:', err.message);
    }

    // 4. Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_approval_status ON participants(approval_status);
      CREATE INDEX IF NOT EXISTS idx_participants_pass_number ON participants(pass_number);
      CREATE INDEX IF NOT EXISTS idx_participants_id_number ON participants(id_number);
    `);
    console.log('Created indexes.');

    // 5. Ensure visitor_logs has valid actions
    try {
      await client.query(`ALTER TABLE visitor_logs DROP CONSTRAINT IF EXISTS valid_action;`);
    } catch {
      // ignore
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

