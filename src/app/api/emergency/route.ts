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

    // --- Section 1: Active Visitors (CHECKED_IN, non-guest-house) ---
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
        p.visitor_type,
        p.vehicle_registration,
        p.location,
        p.check_in_date,
        u.name as checked_in_by
      FROM participants p
      LEFT JOIN check_ins ci ON p.id = ci.participant_id
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE p.check_in_status = 'CHECKED_IN'
        AND LOWER(COALESCE(p.visitor_type, '')) NOT IN ('guest house', 'guesthouse', 'guest_house', 'resident')
      ORDER BY p.check_in_date ASC
    `;

    // --- Section 2: Guest House Residents (CHECKED_IN, visitor_type = Guest House) ---
    const guestHouseResidents = await sql`
      SELECT
        p.id,
        p.full_name,
        COALESCE(p.pass_number, p.registration_code) as pass_number,
        p.phone,
        p.organisation,
        p.host_name,
        p.host_department,
        p.visit_purpose,
        p.visitor_type,
        p.vehicle_registration,
        p.location,
        p.check_in_date,
        u.name as checked_in_by
      FROM participants p
      LEFT JOIN check_ins ci ON p.id = ci.participant_id
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE p.check_in_status = 'CHECKED_IN'
        AND LOWER(COALESCE(p.visitor_type, '')) IN ('guest house', 'guesthouse', 'guest_house', 'resident')
      ORDER BY p.check_in_date ASC
    `;

    // --- Section 3: On-Duty Staff (security_officer + supervisor with active shift) ---
    // Determine current shift: 06:00–18:00 Ghana time (UTC = Ghana, no DST) → 'day'; else 'night'
    const ghanaHour = new Date().getUTCHours(); // Ghana = UTC
    const currentShift = ghanaHour >= 6 && ghanaHour < 18 ? 'day' : 'night';

    const onDutyStaff = await sql`
      SELECT
        id,
        name,
        role,
        shift,
        email
      FROM users
      WHERE role IN ('security_officer', 'supervisor')
        AND shift = ${currentShift}
      ORDER BY role DESC, name ASC
    `;

    const totalHeadcount =
      activeVisitors.length + guestHouseResidents.length + onDutyStaff.length;

    if (format === 'csv') {
      const lines: string[] = [
        `PCC EMERGENCY EVACUATION HEADCOUNT REPORT`,
        `Generated: ${new Date().toLocaleString('en-GB')} · Current Shift: ${currentShift.toUpperCase()}`,
        `TOTAL PERSONS TO ACCOUNT FOR: ${totalHeadcount}`,
        '',
        // --- SECTION A: VISITORS ---
        `SECTION A — VISITORS ON PREMISES (${activeVisitors.length})`,
        `Pass #,Visitor Name,Phone,Organisation,Host / Contact,Department,Purpose,Vehicle Reg,Location,Check-In Time`,
        ...activeVisitors.map((v: any) =>
          [
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
          ].join(',')
        ),
        '',
        // --- SECTION B: GUEST HOUSE ---
        `SECTION B — GUEST HOUSE RESIDENTS (${guestHouseResidents.length})`,
        `Pass #,Resident Name,Phone,Organisation,Host / Contact,Department,Purpose,Vehicle Reg,Location,Check-In Date`,
        ...guestHouseResidents.map((v: any) =>
          [
            `"${v.pass_number || ''}"`,
            `"${v.full_name || ''}"`,
            `"${v.phone || ''}"`,
            `"${v.organisation || ''}"`,
            `"${v.host_name || ''}"`,
            `"${v.host_department || ''}"`,
            `"${v.visit_purpose || ''}"`,
            `"${v.vehicle_registration || ''}"`,
            `"${v.location || 'Guest House'}"`,
            `"${v.check_in_date ? new Date(v.check_in_date).toLocaleString('en-GB') : ''}"`,
          ].join(',')
        ),
        '',
        // --- SECTION C: ON-DUTY STAFF ---
        `SECTION C — ON-DUTY SECURITY STAFF (${onDutyStaff.length}) · ${currentShift.toUpperCase()} SHIFT`,
        `Staff ID,Name,Role,Shift,Email`,
        ...onDutyStaff.map((s: any) =>
          [
            `"${s.id}"`,
            `"${s.name || ''}"`,
            `"${s.role || ''}"`,
            `"${s.shift || ''}"`,
            `"${s.email || ''}"`,
          ].join(',')
        ),
      ];

      const csv = lines.join('\r\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pcc-emergency-headcount-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        currentShift,
        headcount: totalHeadcount,
        visitors: activeVisitors,
        guestHouseResidents,
        onDutyStaff,
        counts: {
          visitors: activeVisitors.length,
          guestHouse: guestHouseResidents.length,
          onDutyStaff: onDutyStaff.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Emergency headcount error:', error);
    return NextResponse.json({ error: 'Failed to generate emergency headcount' }, { status: 500 });
  }
}
