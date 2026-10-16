import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // Create watchlist table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS watchlist (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          reason TEXT NOT NULL,
          description TEXT,
          added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      results.push({ table: 'watchlist', status: 'created' });

      // Create indexes for watchlist
      await sql`CREATE INDEX IF NOT EXISTS idx_watchlist_full_name ON watchlist(full_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_watchlist_is_active ON watchlist(is_active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_watchlist_date_added ON watchlist(date_added)`;
      results.push({ table: 'watchlist', status: 'indexed' });
    } catch (error) {
      results.push({ table: 'watchlist', status: 'error', error: String(error) });
    }

    // Create staff table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS staff (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          department VARCHAR(255),
          position VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      results.push({ table: 'staff', status: 'created' });

      // Create indexes for staff
      await sql`CREATE INDEX IF NOT EXISTS idx_staff_full_name ON staff(full_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active)`;
      results.push({ table: 'staff', status: 'indexed' });
    } catch (error) {
      results.push({ table: 'staff', status: 'error', error: String(error) });
    }

    // Check if visitor_types table exists (it should from visitor-schema.sql)
    try {
      const check = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'visitor_types'
        )
      `;
      if (check[0]?.exists) {
        results.push({ table: 'visitor_types', status: 'already_exists' });
      } else {
        results.push({ table: 'visitor_types', status: 'not_found', message: 'Run visitor-schema.sql first' });
      }
    } catch (error) {
      results.push({ table: 'visitor_types', status: 'error', error: String(error) });
    }

    // Check if visitor_logs table exists (it should from visitor-schema.sql)
    try {
      const check = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'visitor_logs'
        )
      `;
      if (check[0]?.exists) {
        results.push({ table: 'visitor_logs', status: 'already_exists' });
      } else {
        results.push({ table: 'visitor_logs', status: 'not_found', message: 'Run visitor-schema.sql first' });
      }
    } catch (error) {
      results.push({ table: 'visitor_logs', status: 'error', error: String(error) });
    }

    // Add expected_arrival column to participants if it doesn't exist
    try {
      await sql`
        ALTER TABLE participants 
        ADD COLUMN IF NOT EXISTS expected_arrival TIMESTAMP
      `;
      results.push({ table: 'participants', status: 'column_added', column: 'expected_arrival' });
    } catch (error) {
      results.push({ table: 'participants', status: 'error', error: String(error) });
    }

    // Create incidents table
    try {
      await sql`
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
        )
      `;
      results.push({ table: 'incidents', status: 'created' });

      // Create indexes for incidents
      await sql`CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at)`;
      results.push({ table: 'incidents', status: 'indexed' });
    } catch (error) {
      results.push({ table: 'incidents', status: 'error', error: String(error) });
    }

    // Create shift_handovers table
    try {
      await sql`
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
        )
      `;
      results.push({ table: 'shift_handovers', status: 'created' });

      // Create indexes for shift_handovers
      await sql`CREATE INDEX IF NOT EXISTS idx_shift_handovers_shift_date ON shift_handovers(shift_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_shift_handovers_created_at ON shift_handovers(created_at)`;
      results.push({ table: 'shift_handovers', status: 'indexed' });
    } catch (error) {
      results.push({ table: 'shift_handovers', status: 'error', error: String(error) });
    }

    // Create vehicles table with additional columns
    try {
      await sql`
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
        )
      `;
      results.push({ table: 'vehicles', status: 'created' });

      // Create indexes for vehicles
      await sql`CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON vehicles(is_active)`;
      results.push({ table: 'vehicles', status: 'indexed' });
    } catch (error) {
      results.push({ table: 'vehicles', status: 'error', error: String(error) });
    }

    // Add missing columns to vehicles table if it exists
    try {
      await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
      await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registered_by INTEGER REFERENCES users(id) ON DELETE SET NULL`;
      results.push({ table: 'vehicles', status: 'columns_updated' });
    } catch (error) {
      results.push({ table: 'vehicles', status: 'error', error: String(error) });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}