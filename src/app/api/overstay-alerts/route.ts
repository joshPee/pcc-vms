import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { DEFAULT_CATEGORY_RULES, evaluateOverstay, VisitorCategoryRule } from '@/lib/overstay';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // 1. Fetch category rules from database (fallback to defaults if table or rows missing)
    let customRules: Record<string, VisitorCategoryRule> = {};
    try {
      const rows = await sql`
        SELECT name, overstay_minutes, multi_day
        FROM visitor_categories
      `;
      for (const r of rows) {
        customRules[String(r.name).toLowerCase()] = {
          name: String(r.name),
          overstay_minutes: Number(r.overstay_minutes) || 240,
          multi_day: Boolean(r.multi_day),
        };
      }
    } catch {
      customRules = DEFAULT_CATEGORY_RULES;
    }

    // 2. Query checked-in visitors
    const activeVisitors = await sql`
      SELECT
        p.id,
        p.full_name,
        COALESCE(p.pass_number, p.registration_code) as pass_number,
        p.registration_code,
        p.organisation,
        p.host_name,
        p.host_department,
        p.vehicle_registration,
        p.phone,
        p.visitor_type,
        p.check_in_date,
        p.expected_departure
      FROM participants p
      WHERE p.check_in_status = 'CHECKED_IN'
        AND p.check_in_date IS NOT NULL
      ORDER BY p.check_in_date ASC
    `;

    // 3. Filter using category-aware evaluation
    const overstayList = activeVisitors
      .map((p: any) => {
        const evaluation = evaluateOverstay({
          checkInDate: p.check_in_date,
          expectedDeparture: p.expected_departure,
          visitorType: p.visitor_type,
          customRules,
        });

        return {
          ...p,
          minutes_on_site: evaluation.minutesOnSite,
          threshold_minutes: evaluation.thresholdMinutes,
          is_overstay: evaluation.isOverstay,
          multi_day_exempt: evaluation.multiDayExempt,
          overstay_reason: evaluation.reason || null,
        };
      })
      .filter((p: any) => p.is_overstay);

    return NextResponse.json(overstayList, {
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
