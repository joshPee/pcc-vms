import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions, UserRole } from '@/lib/auth';
import { clearCache } from '@/lib/db';

const GUARD_ROLES: UserRole[] = ['admin', 'security_officer', 'supervisor', 'sector_head'];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const { registrationCode, notes, gateStation, guardName, badgeReturned, vehicleInspected } = body;

    let hrUserId: number | null = null;
    let guardDisplayName = guardName || 'Gate Security Guard';

    if (session && session.user) {
      const userRole = session.user.role as UserRole;
      if (userRole && GUARD_ROLES.includes(userRole)) {
        hrUserId = parseInt(session.user.id);
        guardDisplayName = session.user.name || guardDisplayName;
      }
    }

    // If no authenticated session is present, allow gate checkpoint guard duty
    if (!hrUserId) {
      // Find a security user or first user to associate with database foreign key
      const fallbackUsers = await sql`
        SELECT id, name FROM users 
        WHERE role IN ('security_officer', 'admin', 'supervisor') 
        ORDER BY id ASC LIMIT 1
      `;
      if (fallbackUsers.length > 0) {
        hrUserId = fallbackUsers[0].id;
        if (!guardName) {
          guardDisplayName = fallbackUsers[0].name || 'Security Officer';
        }
      } else {
        // Find any user
        const anyUser = await sql`SELECT id, name FROM users ORDER BY id ASC LIMIT 1`;
        if (anyUser.length > 0) {
          hrUserId = anyUser[0].id;
        } else {
          return NextResponse.json(
            { error: 'No security user configured in system' },
            { status: 500 }
          );
        }
      }
    }

    if (!registrationCode) {
      return NextResponse.json(
        { error: 'Registration code is required' },
        { status: 400 }
      );
    }

    const cleanCode = registrationCode.trim();

    // Check if participant exists
    const participant = await sql`
      SELECT 
        id, 
        full_name, 
        registration_code, 
        check_in_status, 
        check_in_date,
        organisation,
        position,
        host_name,
        host_department,
        vehicle_registration,
        phone
      FROM participants
      WHERE LOWER(registration_code) = LOWER(${cleanCode})
         OR LOWER(vehicle_registration) = LOWER(${cleanCode})
      LIMIT 1
    `;

    if (participant.length === 0) {
      return NextResponse.json(
        { error: `Visitor not found with code "${cleanCode}"` },
        { status: 404 }
      );
    }

    const visitor = participant[0];

    // Check current status
    if (visitor.check_in_status !== 'CHECKED_IN') {
      if (visitor.check_in_status === 'CHECKED_OUT') {
        // Fetch when they checked out
        const existingCheckOut = await sql`
          SELECT check_out_time, notes FROM check_outs 
          WHERE participant_id = ${visitor.id} 
          ORDER BY check_out_time DESC LIMIT 1
        `;
        return NextResponse.json({
          alreadyCheckedOut: true,
          error: 'Visitor is already checked out',
          participant_name: visitor.full_name,
          registration_code: visitor.registration_code,
          check_out_time: existingCheckOut[0]?.check_out_time || null,
          checked_out_by: guardDisplayName
        }, { status: 409 });
      }

      return NextResponse.json(
        { error: `Visitor "${visitor.full_name}" is currently marked as ${visitor.check_in_status}. Only checked-in visitors can check out.` },
        { status: 400 }
      );
    }

    // Prepare audit notes
    const stationPrefix = gateStation ? `[Station: ${gateStation}]` : '[Gate Checkpoint]';
    const checks = [];
    if (badgeReturned) checks.push('Badge Returned');
    if (vehicleInspected) checks.push('Vehicle Inspected');
    const checksStr = checks.length > 0 ? ` (${checks.join(', ')})` : '';
    const fullNotes = `${stationPrefix} Guard: ${guardDisplayName}${checksStr}. ${notes || 'Standard check-out'}`.trim();

    // Insert or update check_outs table
    const checkOutResult = await sql`
      INSERT INTO check_outs (participant_id, user_id, check_out_time, notes)
      VALUES (${visitor.id}, ${hrUserId}, NOW(), ${fullNotes})
      ON CONFLICT (participant_id) 
      DO UPDATE SET 
        check_out_time = NOW(),
        user_id = ${hrUserId},
        notes = ${fullNotes}
      RETURNING id, check_out_time
    `;

    const checkOutTime = checkOutResult[0]?.check_out_time || new Date().toISOString();

    // Update participant status
    await sql`
      UPDATE participants
      SET 
        check_in_status = 'CHECKED_OUT',
        check_out_date = NOW(),
        check_out_by = ${hrUserId}
      WHERE id = ${visitor.id}
    `;

    // Log the check-out action
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await sql`
      INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
      VALUES (${visitor.id}, 'CHECK_OUT', ${hrUserId}, ${fullNotes}, ${clientIp})
    `;

    // Calculate time on premises in minutes
    let durationMinutes = 0;
    if (visitor.check_in_date) {
      const checkInTime = new Date(visitor.check_in_date).getTime();
      const outTime = new Date(checkOutTime).getTime();
      durationMinutes = Math.max(1, Math.round((outTime - checkInTime) / (1000 * 60)));
    }

    // Clear cache to reflect updated stats
    try {
      clearCache('attendance');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      participant_id: visitor.id,
      participant_name: visitor.full_name,
      registration_code: visitor.registration_code,
      organisation: visitor.organisation,
      host_name: visitor.host_name,
      host_department: visitor.host_department,
      vehicle_registration: visitor.vehicle_registration,
      check_in_date: visitor.check_in_date,
      check_out_time: checkOutTime,
      checked_out_by: guardDisplayName,
      gate_station: gateStation || 'Main Gate',
      duration_minutes: durationMinutes,
      notes: fullNotes
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Check-out failed. Please try again.' },
      { status: 500 }
    );
  }
}
