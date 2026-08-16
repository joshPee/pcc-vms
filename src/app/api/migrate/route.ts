import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Starting migration...');
    
    // Add status column to events table
    try {
      await pool.query(`
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'
      `);
      console.log('Added status column to events');
    } catch (e) {
      console.log('Events status column error:', e);
    }

    // Add description column to events table
    try {
      await pool.query(`
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS description TEXT
      `);
      console.log('Added description column to events');
    } catch (e) {
      console.log('Events description column error:', e);
    }

    // Update participants table to support unified participant management
    // Make registration_code nullable
    try {
      await pool.query(`
        ALTER TABLE participants 
        ALTER COLUMN registration_code DROP NOT NULL
      `);
      console.log('Made registration_code nullable');
    } catch (e) {
      console.log('Registration_code nullable error:', e);
    }

    // Add new columns to participants table
    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
      console.log('Added email column');
    } catch (e) {
      console.log('Email column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
      console.log('Added phone column');
    } catch (e) {
      console.log('Phone column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS region VARCHAR(100)`);
      console.log('Added region column');
    } catch (e) {
      console.log('Region column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS tags TEXT`);
      console.log('Added tags column');
    } catch (e) {
      console.log('Tags column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS participant_status VARCHAR(50) DEFAULT 'EXPECTED'`);
      console.log('Added participant_status column');
    } catch (e) {
      console.log('Participant_status column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false`);
      console.log('Added reminder_sent column');
    } catch (e) {
      console.log('Reminder_sent column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP`);
      console.log('Added reminder_sent_at column');
    } catch (e) {
      console.log('Reminder_sent_at column error:', e);
    }

    // Add participant_status constraint
    try {
      await pool.query(`
        ALTER TABLE participants 
        DROP CONSTRAINT IF EXISTS valid_participant_status
      `);
      console.log('Dropped participant_status constraint');
    } catch (e) {
      console.log('Drop participant_status constraint error:', e);
    }

    try {
      await pool.query(`
        ALTER TABLE participants 
        ADD CONSTRAINT valid_participant_status 
        CHECK (participant_status IN ('EXPECTED', 'REGISTERED'))
      `);
      console.log('Added participant_status constraint');
    } catch (e) {
      console.log('Add participant_status constraint error:', e);
    }

    // Add indexes for new columns
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_participants_participant_status ON participants(participant_status)
      `);
      console.log('Added participant_status index');
    } catch (e) {
      console.log('Participant_status index error:', e);
    }

    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email)
      `);
      console.log('Added email index');
    } catch (e) {
      console.log('Email index error:', e);
    }

    // Migrate data from expected_attendees to participants (only if table exists)
    let migratedRows = 0;
    try {
      // Check if expected_attendees table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'expected_attendees'
        )
      `);
      console.log('Expected_attendees table exists:', tableCheck.rows[0].exists);

      if (tableCheck.rows[0].exists) {
        const migrationResult = await pool.query(`
          INSERT INTO participants (
            registration_code, full_name, email, phone, organisation, position, region, tags,
            event_id, participant_status, registration_date, registration_status,
            check_in_status, check_in_date, reminder_sent, reminder_sent_at
          )
          SELECT 
            COALESCE(ea.id::text, ea.full_name || '-' || ea.organisation) as registration_code,
            ea.full_name,
            ea.email,
            ea.phone,
            ea.organisation,
            ea.position,
            ea.region,
            ea.tags,
            ea.event_id,
            CASE WHEN ea.registered = true THEN 'REGISTERED' ELSE 'EXPECTED' END as participant_status,
            ea.registered_at as registration_date,
            CASE WHEN ea.registered = true THEN 'REGISTERED' ELSE 'PENDING' END as registration_status,
            ea.check_in_status,
            ea.check_in_date,
            ea.reminder_sent,
            ea.reminder_sent_at
          FROM expected_attendees ea
          ON CONFLICT (registration_code) DO NOTHING
        `);
        migratedRows = migrationResult.rowCount || 0;
        console.log(`Migrated ${migratedRows} rows from expected_attendees`);
      }
    } catch (e) {
      console.log('Migration from expected_attendees skipped:', e);
    }

    // Update existing registered participants to have participant_status = 'REGISTERED'
    try {
      await pool.query(`
        UPDATE participants 
        SET participant_status = 'REGISTERED' 
        WHERE participant_status IS NULL AND registration_code IS NOT NULL
      `);
      console.log('Updated registered participants status');
    } catch (e) {
      console.log('Update registered participants error:', e);
    }

    // Update existing participants without participant_status to 'EXPECTED'
    try {
      await pool.query(`
        UPDATE participants 
        SET participant_status = 'EXPECTED' 
        WHERE participant_status IS NULL
      `);
      console.log('Updated expected participants status');
    } catch (e) {
      console.log('Update expected participants error:', e);
    }

    // Create expected_attendees table (keep for backward compatibility but mark as deprecated)
    try {
      await pool.query(`
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
        )
      `);
      console.log('Created expected_attendees table');
    } catch (e) {
      console.log('Create expected_attendees table error:', e);
    }

    // Add new columns to expected_attendees if they don't exist
    try {
      await pool.query(`ALTER TABLE expected_attendees ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
      console.log('Added phone to expected_attendees');
    } catch (e) {
      console.log('Expected_attendees phone column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE expected_attendees ADD COLUMN IF NOT EXISTS region VARCHAR(100)`);
      console.log('Added region to expected_attendees');
    } catch (e) {
      console.log('Expected_attendees region column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE expected_attendees ADD COLUMN IF NOT EXISTS tags TEXT`);
      console.log('Added tags to expected_attendees');
    } catch (e) {
      console.log('Expected_attendees tags column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE expected_attendees ADD COLUMN IF NOT EXISTS check_in_status VARCHAR(50) DEFAULT 'NOT_CHECKED_IN'`);
      console.log('Added check_in_status to expected_attendees');
    } catch (e) {
      console.log('Expected_attendees check_in_status column error:', e);
    }

    try {
      await pool.query(`ALTER TABLE expected_attendees ADD COLUMN IF NOT EXISTS check_in_date TIMESTAMP`);
      console.log('Added check_in_date to expected_attendees');
    } catch (e) {
      console.log('Expected_attendees check_in_date column error:', e);
    }

    // Add indexes
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_expected_attendees_email ON expected_attendees(email)
      `);
      console.log('Added expected_attendees email index');
    } catch (e) {
      console.log('Expected_attendees email index error:', e);
    }

    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_expected_attendees_registered ON expected_attendees(registered)
      `);
      console.log('Added expected_attendees registered index');
    } catch (e) {
      console.log('Expected_attendees registered index error:', e);
    }

    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_expected_attendees_check_in_status ON expected_attendees(check_in_status)
      `);
      console.log('Added expected_attendees check_in_status index');
    } catch (e) {
      console.log('Expected_attendees check_in_status index error:', e);
    }

    // Update registration source constraint
    try {
      await pool.query(`
        ALTER TABLE participants 
        DROP CONSTRAINT IF EXISTS valid_registration_source
      `);
      console.log('Dropped registration_source constraint');
    } catch (e) {
      console.log('Drop registration_source constraint error:', e);
    }

    try {
      await pool.query(`
        ALTER TABLE participants 
        ADD CONSTRAINT valid_registration_source 
        CHECK (registration_source IN ('ONLINE', 'WALK_IN', 'PRE_REGISTERED'))
      `);
      console.log('Added registration_source constraint');
    } catch (e) {
      console.log('Add registration_source constraint error:', e);
    }

    console.log('Migration completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      migratedRows: migratedRows
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
