import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'today';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');
    const departmentFilter = searchParams.get('department') || 'all';

    if (!sql) {
      return NextResponse.json({
        summary: {
          totalCheckIns: 0,
          totalCheckOuts: 0,
          currentlyInside: 0,
          avgDurationMinutes: 0,
          peakHour: 'N/A',
        },
        trends: [],
        departments: [],
        purposes: [],
        visitorLogs: [],
      });
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (range === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (range) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
        case '7days':
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
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    // 1. KPI Counts
    const checkInsResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
      ${departmentFilter !== 'all' ? sql`AND host_department = ${departmentFilter}` : sql``}
    `;
    const totalCheckIns = parseInt(checkInsResult[0]?.count || '0');

    const checkOutsResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE check_out_date >= ${startDate} AND check_out_date <= ${endDate}
      ${departmentFilter !== 'all' ? sql`AND host_department = ${departmentFilter}` : sql``}
    `;
    const totalCheckOuts = parseInt(checkOutsResult[0]?.count || '0');

    const insideResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE check_in_status = 'CHECKED_IN'
      ${departmentFilter !== 'all' ? sql`AND host_department = ${departmentFilter}` : sql``}
    `;
    const currentlyInside = parseInt(insideResult[0]?.count || '0');

    // 2. Average Duration in Minutes
    const avgDurationResult = await sql`
      SELECT AVG(EXTRACT(EPOCH FROM (check_out_date - check_in_date)) / 60) as avg_mins
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
        AND check_out_date IS NOT NULL
        ${departmentFilter !== 'all' ? sql`AND host_department = ${departmentFilter}` : sql``}
    `;
    const avgDurationMinutes = Math.round(parseFloat(avgDurationResult[0]?.avg_mins || '0'));

    // 3. Peak Arrival Hour
    const peakHourResult = await sql`
      SELECT EXTRACT(HOUR FROM check_in_date) as hour, COUNT(*) as count
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
      GROUP BY EXTRACT(HOUR FROM check_in_date)
      ORDER BY count DESC
      LIMIT 1
    `;
    let peakHour = 'N/A';
    if (peakHourResult.length > 0 && peakHourResult[0]?.hour !== null) {
      const h = parseInt(peakHourResult[0].hour);
      peakHour = `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`;
    }

    // 4. Daily Trends (last 14 days or within date range)
    const trendsResult = await sql`
      SELECT 
        DATE(check_in_date) as day,
        COUNT(*) as check_ins,
        COUNT(*) FILTER (WHERE check_in_status = 'CHECKED_OUT') as check_outs
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
      ${departmentFilter !== 'all' ? sql`AND host_department = ${departmentFilter}` : sql``}
      GROUP BY DATE(check_in_date)
      ORDER BY day ASC
    `;
    const trends = trendsResult.map((row: any) => ({
      date: row.day ? new Date(row.day).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : '',
      checkIns: parseInt(row.check_ins || '0'),
      checkOuts: parseInt(row.check_outs || '0'),
    }));

    // 5. Department Breakdown
    const deptResult = await sql`
      SELECT 
        COALESCE(host_department, 'General / Other') as department,
        COUNT(*) as count
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
      GROUP BY COALESCE(host_department, 'General / Other')
      ORDER BY count DESC
      LIMIT 8
    `;
    const departments = deptResult.map((row: any) => ({
      name: row.department,
      count: parseInt(row.count || '0'),
      percentage: totalCheckIns > 0 ? Math.round((parseInt(row.count || '0') / totalCheckIns) * 100) : 0,
    }));

    // 6. Visit Purposes Breakdown
    const purposeResult = await sql`
      SELECT 
        COALESCE(visit_purpose, 'General Visit') as purpose,
        COUNT(*) as count
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
      GROUP BY COALESCE(visit_purpose, 'General Visit')
      ORDER BY count DESC
      LIMIT 6
    `;
    const purposes = purposeResult.map((row: any) => ({
      name: row.purpose,
      count: parseInt(row.count || '0'),
    }));

    // 7. Recent / Filtered Detailed Visitor Logs (up to 100 entries)
    const logsResult = await sql`
      SELECT 
        id,
        registration_code,
        full_name,
        phone,
        organisation,
        location,
        host_name,
        host_department,
        visit_purpose,
        vehicle_registration,
        check_in_status,
        check_in_date,
        check_out_date,
        ROUND(EXTRACT(EPOCH FROM (COALESCE(check_out_date, CURRENT_TIMESTAMP) - check_in_date)) / 60) as duration_mins
      FROM participants
      WHERE check_in_date >= ${startDate} AND check_in_date <= ${endDate}
      ${departmentFilter !== 'all' ? sql`AND host_department = ${departmentFilter}` : sql``}
      ORDER BY check_in_date DESC
      LIMIT 100
    `;

    const visitorLogs = logsResult.map((row: any) => ({
      id: row.id,
      code: row.registration_code || `PCC-${row.id}`,
      name: row.full_name,
      phone: row.phone || 'N/A',
      organisation: row.organisation || 'N/A',
      location: row.location || 'N/A',
      host: row.host_name || 'N/A',
      department: row.host_department || 'General',
      purpose: row.visit_purpose || 'Visit',
      vehicle: row.vehicle_registration || 'None',
      status: row.check_in_status,
      checkInTime: row.check_in_date ? new Date(row.check_in_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      checkOutTime: row.check_out_date ? new Date(row.check_out_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      date: row.check_in_date ? new Date(row.check_in_date).toLocaleDateString('en-GB') : 'N/A',
      durationMinutes: parseInt(row.duration_mins || '0'),
    }));

    return NextResponse.json({
      summary: {
        totalCheckIns,
        totalCheckOuts,
        currentlyInside,
        avgDurationMinutes,
        peakHour,
      },
      trends,
      departments,
      purposes,
      visitorLogs,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report analytics' },
      { status: 500 }
    );
  }
}
