import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return dateStr;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const format = searchParams.get('format') || 'csv'; // 'csv' only for now

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (range === 'custom' && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (range) {
        case 'week': case '7days':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '30days':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '3months':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          startDate.setHours(0, 0, 0, 0);
          break;
        default: // today
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    // Full visitor log for the period
    const visitors = await sql`
      SELECT
        p.registration_code            AS "Pass Code",
        p.full_name                    AS "Visitor Name",
        p.phone                        AS "Phone",
        p.organisation                 AS "Organisation",
        p.location                     AS "Coming From",
        p.host_name                    AS "Host / Person Visiting",
        p.host_department              AS "Department",
        p.visit_purpose                AS "Purpose of Visit",
        p.vehicle_registration         AS "Vehicle Reg",
        p.check_in_status              AS "Status",
        p.check_in_date                AS "Check-In Time",
        p.check_out_date               AS "Check-Out Time",
        CASE
          WHEN p.check_out_date IS NOT NULL AND p.check_in_date IS NOT NULL
          THEN ROUND(EXTRACT(EPOCH FROM (p.check_out_date - p.check_in_date)) / 60)
          ELSE NULL
        END                            AS "Duration (mins)",
        co.notes                       AS "Exit Notes",
        u_in.name                      AS "Checked In By",
        u_out.name                     AS "Checked Out By",
        p.registration_source          AS "Source",
        p.created_at                   AS "Registered At"
      FROM participants p
      LEFT JOIN check_ins ci ON p.id = ci.participant_id
      LEFT JOIN users u_in ON ci.user_id = u_in.id
      LEFT JOIN check_outs co ON p.id = co.participant_id
      LEFT JOIN users u_out ON co.user_id = u_out.id
      WHERE p.check_in_date >= ${startDate}
        AND p.check_in_date <= ${endDate}
      ORDER BY p.check_in_date ASC
    `;

    // Build CSV
    if (visitors.length === 0) {
      return new NextResponse('No visitors found for this period.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const headers = Object.keys(visitors[0]);
    const csvRows = [
      // Title row
      `PCC Visitor Log Export — ${formatDate(startDate.toISOString())} to ${formatDate(endDate.toISOString())}`,
      `Generated: ${formatDate(new Date().toISOString())}`,
      '',
      headers.map(escapeCSV).join(','),
      ...visitors.map((row: any) =>
        headers.map((h) => {
          const val = row[h];
          if (h.includes('Time') || h.includes('At')) return escapeCSV(formatDate(val));
          return escapeCSV(val);
        }).join(',')
      ),
    ];

    const csvContent = csvRows.join('\r\n');
    const filename = `pcc-visitor-log-${range}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    );
  }
}
