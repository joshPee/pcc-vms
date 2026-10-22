import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Visitors are considered overstay after 4 hours on premises (or past expected_departure)
const OVERSTAY_THRESHOLD_MINUTES = 240;

export async function GET() {
  try {
    const overstay = await sql`
      SELECT
        p.id,
        p.full_name,
        p.registration_code,
        p.organisation,
        p.host_name,
        p.host_department,
        p.vehicle_registration,
        p.phone,
        p.check_in_date,
        p.expected_departure,
        EXTRACT(EPOCH FROM (NOW() - p.check_in_date)) / 60 AS minutes_on_site
      FROM participants p
      WHERE p.check_in_status = 'CHECKED_IN'
        AND p.check_in_date IS NOT NULL
        AND (
          -- Either past expected departure time
          (p.expected_departure IS NOT NULL AND NOW() > p.expected_departure)
          -- Or over the default threshold with no expected departure set
          OR (p.expected_departure IS NULL AND EXTRACT(EPOCH FROM (NOW() - p.check_in_date)) / 60 >= ${OVERSTAY_THRESHOLD_MINUTES})
        )
      ORDER BY p.check_in_date ASC
    `;

    return NextResponse.json(overstay, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Overstay alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overstay alerts' },
      { status: 500 }
    );
  }
}
