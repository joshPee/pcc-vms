import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const activeVisitors = await sql`
      SELECT 
        p.id,
        p.full_name,
        COALESCE(p.pass_number, p.registration_code) as pass_number,
        p.phone,
        p.organisation,
        p.host_name,
        p.host_department,
        p.visit_purpose,
        p.vehicle_registration,
        p.location,
        p.check_in_date,
        u.name as checked_in_by
      FROM participants p
      LEFT JOIN check_ins ci ON p.id = ci.participant_id
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE p.check_in_status = 'CHECKED_IN'
      ORDER BY p.check_in_date ASC
    `;

    if (format === 'csv') {
      const headers = ['Pass Number', 'Visitor Name', 'Phone', 'Organisation', 'Host / Contact', 'Department', 'Purpose', 'Vehicle Reg', 'Location', 'Check-In Time'];
      const rows = activeVisitors.map((v: any) => [
        `"${v.pass_number || ''}"`,
        `"${v.full_name || ''}"`,
        `"${v.phone || ''}"`,
        `"${v.organisation || ''}"`,
        `"${v.host_name || ''}"`,
        `"${v.host_department || ''}"`,
        `"${v.visit_purpose || ''}"`,
        `"${v.vehicle_registration || ''}"`,
        `"${v.location || 'Main Gate'}"`,
        `"${v.check_in_date ? new Date(v.check_in_date).toLocaleString('en-GB') : ''}"`,
      ].join(','));

      const csv = [
        `PCC EMERGENCY EVACUATION HEADCOUNT REPORT - TOTAL ACTIVE: ${activeVisitors.length}`,
        `Generated: ${new Date().toLocaleString('en-GB')}`,
        '',
        headers.join(','),
        ...rows,
      ].join('\r\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pcc-emergency-headcount-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      headcount: activeVisitors.length,
      visitors: activeVisitors,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Emergency headcount error:', error);
    return NextResponse.json({ error: 'Failed to generate emergency headcount' }, { status: 500 });
  }
}

