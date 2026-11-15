import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getClientIp } from '@/lib/rate-limit';
import {
  filterEligibleForReconciliation,
  getAccraMidnightCutoff,
  VisitorRecord,
} from '@/lib/reconciliation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole('admin', 'supervisor', 'sector_head');
  if (!auth.authorized) return auth.response;

  try {
    if (!sql) {
      return NextResponse.json({ activeCount: 0, eligibleCount: 0, eligible: [] });
    }

    const rows = await sql`
      SELECT 
        id, 
        full_name, 
        check_in_status, 
        check_in_date, 
        is_recurring, 
        visitor_type,
        expected_departure as expected_departure_date
      FROM participants
      WHERE check_in_status = 'CHECKED_IN'
    `;

    const visitors: VisitorRecord[] = rows.map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      checkInStatus: r.check_in_status,
      checkInDate: r.check_in_date,
      isRecurring: Boolean(r.is_recurring),
      visitorType: r.visitor_type,
      expectedDepartureDate: r.expected_departure_date,
    }));

    const cutoff = getAccraMidnightCutoff();
    const eligible = filterEligibleForReconciliation(visitors, cutoff);

    // Get last auto-checkout time
    let lastReconciliationTime: string | null = null;
    try {
      const lastLog = await sql`
        SELECT action_time 
        FROM visitor_logs 
        WHERE action = 'AUTO_CHECK_OUT' 
        ORDER BY action_time DESC 
        LIMIT 1
      `;
      if (lastLog.length > 0) {
        lastReconciliationTime = lastLog[0].action_time;
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      totalActiveCheckIns: visitors.length,
      eligibleForAutoCheckout: eligible.length,
      cutoffTimestamp: cutoff.toISOString(),
      lastReconciliationTime,
      eligibleVisitors: eligible.map((v) => ({ id: v.id, name: v.fullName, checkInDate: v.checkInDate })),
    });
  } catch (error) {
    console.error('Error fetching reconciliation status:', error);
    return NextResponse.json({ error: 'Failed to fetch reconciliation status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole('admin', 'supervisor');
  if (!auth.authorized) return auth.response;

  try {
    if (!sql) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body.dryRun);
    const clientIp = getClientIp(request);
    const officerId = parseInt(auth.context.user.id) || null;
    const officerName = auth.context.user.name || 'Supervisor';

    const rows = await sql`
      SELECT 
        id, 
        full_name, 
        check_in_status, 
        check_in_date, 
        is_recurring, 
        visitor_type,
        expected_departure as expected_departure_date
      FROM participants
      WHERE check_in_status = 'CHECKED_IN'
    `;

    const visitors: VisitorRecord[] = rows.map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      checkInStatus: r.check_in_status,
      checkInDate: r.check_in_date,
      isRecurring: Boolean(r.is_recurring),
      visitorType: r.visitor_type,
      expectedDepartureDate: r.expected_departure_date,
    }));

    const cutoff = getAccraMidnightCutoff();
    const eligible = filterEligibleForReconciliation(visitors, cutoff);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        eligibleCount: eligible.length,
        eligibleIds: eligible.map((e) => e.id),
        message: `Dry run complete. ${eligible.length} lingering visitor(s) identified for auto-checkout.`,
      });
    }

    const reconciledIds: number[] = [];

    for (const item of eligible) {
      try {
        await sql`
          UPDATE participants
          SET check_in_status = 'AUTO_CHECKED_OUT',
              check_out_date = CURRENT_TIMESTAMP
          WHERE id = ${item.id}
        `;

        try {
          await sql`
            INSERT INTO check_outs (participant_id, user_id, check_out_time, notes)
            VALUES (${item.id}, ${officerId}, NOW(), 'Nightly reconciliation (forgotten checkout)')
            ON CONFLICT (participant_id) DO UPDATE SET check_out_time = NOW()
          `;
        } catch { /* ignore */ }

        try {
          await sql`
            INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
            VALUES (
              ${item.id},
              'AUTO_CHECK_OUT',
              ${officerId},
              ${`Nightly reconciliation by ${officerName}. Lingering check-in for "${item.fullName || 'Visitor'}" auto-cleared from site headcount.`},
              ${clientIp}
            )
          `;
        } catch { /* ignore */ }

        reconciledIds.push(item.id);
      } catch (err) {
        console.error(`Failed to reconcile participant ${item.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      reconciledCount: reconciledIds.length,
      reconciledIds,
      cutoffApplied: cutoff.toISOString(),
      message: `Reconciliation executed successfully. ${reconciledIds.length} visitor(s) transitioned to AUTO_CHECKED_OUT.`,
    });
  } catch (error) {
    console.error('Error running reconciliation:', error);
    return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
  }
}
