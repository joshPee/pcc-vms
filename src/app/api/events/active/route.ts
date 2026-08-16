import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT name, date, registration_open 
      FROM events 
      WHERE status = 'ACTIVE' 
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({
        name: 'NO ACTIVE MEETING',
        date: '',
        registration_open: false
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching active event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active event' },
      { status: 500 }
    );
  }
}
