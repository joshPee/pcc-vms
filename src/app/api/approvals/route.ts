import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clearCache } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sql) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch submissions matching status
    const submissions = await sql`
      SELECT 
        p.id,
        p.registration_code,
        COALESCE(p.pass_number, p.registration_code) as pass_number,
        p.full_name,
        p.phone,
        p.organisation,
        p.location,
        p.host_name,
        p.host_department,
        p.visit_purpose,
        p.visitor_type,
        p.id_type,
        p.id_number,
        p.photo_url,
        p.vehicle_registration,
        p.approval_status,
        p.check_in_status,
        p.created_at,
        p.approved_at,
        p.rejected_at,
        p.rejection_reason,
        u_app.name as approved_by_name,
        u_rej.name as rejected_by_name
      FROM participants p
      LEFT JOIN users u_app ON p.approved_by = u_app.id
      LEFT JOIN users u_rej ON p.rejected_by = u_rej.id
      WHERE (
        ${status === 'ALL'} = true
        OR p.approval_status = ${status}
      )
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;

    // Fetch stats for dashboard badges
    const [pendingRes, deniedRes, approvedTodayRes, insideRes] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM participants WHERE approval_status = 'PENDING'`,
      sql`SELECT COUNT(*) as count FROM participants WHERE approval_status = 'REJECTED' AND DATE(rejected_at) = ${today}`,
      sql`SELECT COUNT(*) as count FROM participants WHERE approval_status = 'APPROVED' AND DATE(approved_at) = ${today}`,
      sql`SELECT COUNT(*) as count FROM participants WHERE check_in_status = 'CHECKED_IN'`,
    ]);

    return NextResponse.json({
      submissions,
      stats: {
        pendingApprovals: parseInt(pendingRes[0]?.count || '0'),
        deniedEntriesToday: parseInt(deniedRes[0]?.count || '0'),
        approvedToday: parseInt(approvedTodayRes[0]?.count || '0'),
        currentlyInside: parseInt(insideRes[0]?.count || '0'),
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Approvals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { participantId, action, rejectionReason, checkInNow = false, badgeNumber } = body;

    if (!participantId || !action) {
      return NextResponse.json({ error: 'participantId and action are required' }, { status: 400 });
    }

    if (!sql) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Determine current user ID or fallback to security guard
    let guardUserId = session?.user?.id ? parseInt(session.user.id) : null;
    let guardName = session?.user?.name || 'Gate Guard';

    if (!guardUserId) {
      const fallbackUser = await sql`
        SELECT id, name FROM users 
        WHERE role IN ('security_officer', 'supervisor', 'admin') 
        LIMIT 1
      `;
      if (fallbackUser.length > 0) {
        guardUserId = fallbackUser[0].id;
        guardName = fallbackUser[0].name || guardName;
      }
    }

    // Verify visitor exists
    const existing = await sql`
      SELECT id, full_name, registration_code, pass_number, approval_status, check_in_status, host_name, host_department
      FROM participants
      WHERE id = ${participantId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Visitor record not found' }, { status: 404 });
    }

    const visitor = existing[0];
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    if (action === 'APPROVE') {
      const shouldCheckIn = !!checkInNow;

      if (shouldCheckIn) {
        await sql`
          UPDATE participants
          SET 
            approval_status = 'APPROVED',
            approved_by = ${guardUserId},
            approved_at = NOW(),
            check_in_status = 'CHECKED_IN',
            check_in_date = NOW(),
            checked_in_by = ${guardUserId},
            badge_number = COALESCE(${badgeNumber || null}, badge_number)
          WHERE id = ${participantId}
        `;

        if (guardUserId) {
          await sql`
            INSERT INTO check_ins (participant_id, user_id, check_in_time)
            VALUES (${participantId}, ${guardUserId}, NOW())
            ON CONFLICT (participant_id) DO NOTHING
          `;
        }

        // Log to visitor_logs
        await sql`
          INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
          VALUES (
            ${participantId},
            'APPROVAL_CHECK_IN',
            ${guardUserId},
            ${`Approved and checked in by ${guardName}. Host: ${visitor.host_name || 'N/A'}. Pass: ${visitor.pass_number || visitor.registration_code}.`},
            ${clientIp}
          )
        `;
      } else {
        await sql`
          UPDATE participants
          SET 
            approval_status = 'APPROVED',
            approved_by = ${guardUserId},
            approved_at = NOW(),
            badge_number = COALESCE(${badgeNumber || null}, badge_number)
          WHERE id = ${participantId}
        `;

        // Log to visitor_logs
        await sql`
          INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
          VALUES (
            ${participantId},
            'APPROVED',
            ${guardUserId},
            ${`Visit approved by ${guardName}. Visitor cleared for entrance check-in. Host: ${visitor.host_name || 'N/A'}.`},
            ${clientIp}
          )
        `;
      }

      clearCache();

      return NextResponse.json({
        success: true,
        message: shouldCheckIn ? 'Visitor approved and checked in successfully' : 'Visitor approved successfully',
        approvalStatus: 'APPROVED',
        checkInStatus: shouldCheckIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
      });
    } else if (action === 'REJECT') {
      const reasonText = (rejectionReason || 'Entry rejected by host/guard').trim();

      await sql`
        UPDATE participants
        SET 
          approval_status = 'REJECTED',
          rejected_by = ${guardUserId},
          rejected_at = NOW(),
          rejection_reason = ${reasonText},
          check_in_status = 'NOT_CHECKED_IN'
        WHERE id = ${participantId}
      `;

      // Log rejection to audit trail
      await sql`
        INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
        VALUES (
          ${participantId},
          'REJECTED',
          ${guardUserId},
          ${`Entry DENIED by ${guardName}. Reason: ${reasonText}. Visitor: ${visitor.full_name}.`},
          ${clientIp}
        )
      `;

      clearCache();

      return NextResponse.json({
        success: true,
        message: 'Visitor entry denied',
        approvalStatus: 'REJECTED',
        checkInStatus: 'NOT_CHECKED_IN',
        rejectionReason: reasonText,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Approvals POST error:', error);
    return NextResponse.json({ error: 'Failed to process approval action' }, { status: 500 });
  }
}

