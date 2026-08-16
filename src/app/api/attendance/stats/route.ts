import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_registered,
        COUNT(*) FILTER (WHERE check_in_status = 'CHECKED_IN') as total_checked_in,
        COUNT(*) FILTER (WHERE check_in_status = 'NOT_CHECKED_IN') as total_not_checked_in
      FROM participants
      WHERE event_id = (SELECT id FROM events WHERE status = 'ACTIVE' LIMIT 1)
    `);

    const result = stats.rows[0];
    const totalRegistered = parseInt(result.total_registered);
    const totalCheckedIn = parseInt(result.total_checked_in);
    const totalNotCheckedIn = parseInt(result.total_not_checked_in);
    const attendancePercentage = totalRegistered > 0 
      ? Math.round((totalCheckedIn / totalRegistered) * 100) 
      : 0;

    return NextResponse.json({
      totalRegistered,
      totalCheckedIn,
      totalNotCheckedIn,
      attendancePercentage
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance stats' },
      { status: 500 }
    );
  }
}
