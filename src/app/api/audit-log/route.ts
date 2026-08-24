import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await sql`
      SELECT 
        vl.id,
        vl.action,
        vl.action_time,
        vl.details,
        vl.ip_address,
        p.full_name as participant_name,
        p.registration_code,
        u.name as user_name,
        u.email as user_email
      FROM visitor_logs vl
      LEFT JOIN participants p ON vl.participant_id = p.id
      LEFT JOIN users u ON vl.user_id = u.id
      ORDER BY vl.action_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM visitor_logs
    `;

    return NextResponse.json({
      logs,
      total: countResult[0]?.total || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}