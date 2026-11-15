import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import {
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  ArrowRight,
  TrendingUp,
  LogIn,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  AlertOctagon,
  UserCheck,
  XCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  if (!sql) {
    return {
      totalVisitorsToday: 0,
      visitorsInside: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      expectedVisitors: 0,
      pendingApprovals: 0,
      deniedEntries: 0,
      recentActivity: [],
      peakHours: [],
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalTodayRes,
      insideRes,
      checkInsRes,
      checkOutsRes,
      expectedRes,
      pendingRes,
      deniedRes,
    ] = await Promise.all([
      // Total Visitors Registered Today
      sql`SELECT COUNT(*) as count FROM participants WHERE DATE(created_at) = ${today}`,
      // Currently Inside (Checked in but not checked out)
      sql`SELECT COUNT(*) as count FROM participants WHERE check_in_status = 'CHECKED_IN'`,
      // Check-ins today
      sql`SELECT COUNT(*) as count FROM participants WHERE DATE(check_in_date) = ${today}`,
      // Checked out today
      sql`SELECT COUNT(*) as count FROM participants WHERE check_in_status = 'CHECKED_OUT' AND DATE(check_out_date) = ${today}`,
      // Expected visitors
      sql`SELECT COUNT(*) as count FROM participants WHERE participant_status = 'EXPECTED' OR (registration_status = 'REGISTERED' AND check_in_status = 'NOT_CHECKED_IN' AND (approval_status IS NULL OR approval_status = 'APPROVED'))`,
      // Pending Approvals
      sql`SELECT COUNT(*) as count FROM participants WHERE approval_status = 'PENDING'`,
      // Denied Entries
      sql`SELECT COUNT(*) as count FROM participants WHERE approval_status = 'REJECTED' AND DATE(COALESCE(rejected_at, created_at)) = ${today}`,
    ]);

    const totalVisitorsToday = parseInt(totalTodayRes[0]?.count || '0');
    const visitorsInside = parseInt(insideRes[0]?.count || '0');
    const todayCheckIns = parseInt(checkInsRes[0]?.count || '0');
    const todayCheckOuts = parseInt(checkOutsRes[0]?.count || '0');
    const expectedVisitors = parseInt(expectedRes[0]?.count || '0');
    const pendingApprovals = parseInt(pendingRes[0]?.count || '0');
    const deniedEntries = parseInt(deniedRes[0]?.count || '0');

    const recentActivityResult = await sql`
      SELECT
        p.id,
        p.full_name,
        p.organisation,
        p.check_in_status,
        p.approval_status,
        p.check_in_date,
        p.check_out_date,
        p.created_at,
        p.host_name,
        COALESCE(p.pass_number, p.registration_code) as registration_code
      FROM participants p
      ORDER BY COALESCE(p.check_out_date, p.check_in_date, p.created_at) DESC
      LIMIT 8
    `;
    const recentActivity = recentActivityResult.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      organisation: row.organisation,
      status: row.check_in_status,
      approvalStatus: row.approval_status,
      hostName: row.host_name,
      code: row.registration_code,
      date: row.check_out_date || row.check_in_date || row.created_at,
    }));

    const peakHoursResult = await sql`
      SELECT
        EXTRACT(HOUR FROM check_in_date) as hour,
        COUNT(*) as check_in_count
      FROM participants
      WHERE check_in_date >= NOW() - INTERVAL '7 days'
      AND check_in_status IN ('CHECKED_IN', 'CHECKED_OUT')
      GROUP BY EXTRACT(HOUR FROM check_in_date)
      ORDER BY check_in_count DESC
      LIMIT 4
    `;

    const maxPeak = Math.max(
      1,
      ...peakHoursResult.map((r: any) => parseInt(r.check_in_count || '0'))
    );

    const peakHours = peakHoursResult.map((row: any) => ({
      hour: parseInt(row.hour),
      count: parseInt(row.check_in_count),
      timeLabel: `${row.hour}:00 - ${row.hour}:59`,
      percentage: Math.round((parseInt(row.check_in_count) / maxPeak) * 100),
    }));

    return {
      totalVisitorsToday,
      visitorsInside,
      todayCheckIns,
      todayCheckOuts,
      expectedVisitors,
      pendingApprovals,
      deniedEntries,
      recentActivity,
      peakHours,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalVisitorsToday: 0,
      visitorsInside: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      expectedVisitors: 0,
      pendingApprovals: 0,
      deniedEntries: 0,
      recentActivity: [],
      peakHours: [],
    };
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  const stats = await getDashboardStats();

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Operations Command Header */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/30 p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E5A823]">
              Operations Command Center
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Security & Visitor Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pentecost Convention Centre • Live gate activity & premises control
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs relative z-10">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#123B70]" />
            <span>{todayFormatted}</span>
          </div>

          <Link
            href="/admin/emergency"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold shadow-md shadow-rose-600/20 transition hover:-translate-y-0.5"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>Emergency Evacuation Roster</span>
          </Link>

          <Link
            href="/admin/visitors"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B70] hover:bg-[#0C284E] text-white font-bold shadow-md shadow-[#123B70]/20 transition hover:-translate-y-0.5"
          >
            <Users className="w-4 h-4 text-[#E5A823]" />
            <span>Visitors Directory →</span>
          </Link>
        </div>
      </div>

      {/* 6 Required Statistics Indicators (Section 6) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>Standard Security Indicators (VMS Specification)</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Sync</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Visitors Today */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Today
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {stats.totalVisitorsToday}
            </p>
            <span className="text-[10px] text-slate-500 block mt-1">
              Registered today
            </span>
          </div>

          {/* 2. Currently Inside */}
          <Link
            href="/admin/emergency"
            className="bg-white rounded-2xl p-4 border-2 border-emerald-400 shadow-sm hover:border-emerald-500 transition group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-emerald-700 tracking-wider">
                Currently Inside
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
              {stats.visitorsInside}
            </p>
            <span className="text-[10px] text-emerald-600 block mt-1 font-semibold group-hover:underline">
              On premises · View →
            </span>
          </Link>

          {/* 3. Expected Visitors */}
          <Link
            href="/admin/expected-attendees"
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-400 transition group block"
          >
            <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
              Expected
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#123B70] mt-1">
              {stats.expectedVisitors}
            </p>
            <span className="text-[10px] text-blue-600 block mt-1 font-medium group-hover:underline">
              Scheduled arrivals
            </span>
          </Link>

          {/* 4. Check-Ins Today */}
          <Link
            href="/admin/visitors"
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-[#123B70]/40 transition group block"
          >
            <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
              Check-Ins
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#123B70] mt-1">
              {stats.todayCheckIns}
            </p>
            <span className="text-[10px] text-blue-600 block mt-1 font-semibold group-hover:underline">
              Arrivals processed
            </span>
          </Link>

          {/* 5. Checked Out */}
          <Link
            href="/check-out"
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 transition group block"
          >
            <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
              Checked Out
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
              {stats.todayCheckOuts}
            </p>
            <span className="text-[10px] text-slate-500 block mt-1">
              Departures cleared
            </span>
          </Link>

          {/* 6. Denied Entries */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-[10.5px] uppercase font-bold text-rose-500 tracking-wider">
              Denied Entries
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
              {stats.deniedEntries}
            </p>
            <span className="text-[10px] text-rose-500 block mt-1">
              Rejected visits
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Activity & Peak Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#123B70] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Live Gate Activity
                </h3>
                <p className="text-[11px] text-slate-400">Recent registrations, check-in, and departure events</p>
              </div>
            </div>

            <Link
              href="/admin/visitor-history"
              className="text-xs font-semibold text-[#123B70] hover:underline flex items-center gap-0.5"
            >
              Full Log <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No visitor activity recorded yet today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentActivity.map((activity: any, index: number) => {
                const isCheckedIn = activity.status === 'CHECKED_IN';
                const isPending = activity.approvalStatus === 'PENDING';
                const isRejected = activity.approvalStatus === 'REJECTED';
                const timeStr = activity.date
                  ? new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                const initials = (activity.fullName || 'Guest')
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={index}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/60 rounded-2xl px-2 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCheckedIn
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-700'
                            : isRejected
                            ? 'bg-rose-500/10 text-rose-700'
                            : 'bg-slate-500/10 text-slate-700'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {activity.fullName}
                          </p>
                          {activity.code && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                              {activity.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {activity.organisation ? `${activity.organisation} • ` : ''}
                          {activity.hostName ? `Host: ${activity.hostName}` : 'General Visit'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                          isCheckedIn
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isCheckedIn
                          ? 'Inside'
                          : isPending
                          ? 'Registered'
                          : isRejected
                          ? 'Rejected'
                          : 'Checked Out'}
                      </span>
                      <p className="text-[10.5px] font-mono text-slate-400 mt-1">{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Hours & Quick Operational Links (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Peak Hours Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Peak Gate Traffic
                  </h3>
                  <p className="text-[11px] text-slate-400">Busiest arrival hours (Last 7 days)</p>
                </div>
              </div>
            </div>

            {stats.peakHours.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No historical traffic data yet.</p>
            ) : (
              <div className="space-y-3.5">
                {stats.peakHours.map((peak: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {peak.timeLabel}
                      </span>
                      <span className="font-mono font-bold text-[#123B70]">
                        {peak.count} check-ins
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#123B70] to-[#E5A823]"
                        style={{ width: `${peak.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Direct Actions Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security Shortcuts
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5A823]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/admin/visitors"
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#123B70]/5 hover:bg-[#123B70]/10 border border-[#123B70]/15 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#123B70]/15 text-[#123B70] flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#123B70] transition">
                    Visitors Directory
                  </p>
                  <p className="text-[10.5px] text-slate-500 truncate">Search & manage visitors</p>
                </div>
              </Link>

              <Link
                href="/admin/emergency"
                className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/50 hover:bg-rose-100/60 border border-rose-200/80 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-800 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-900 group-hover:text-rose-950 transition">
                    Emergency Evacuation
                  </p>
                  <p className="text-[10.5px] text-rose-700 truncate">Print headcount</p>
                </div>
              </Link>

              <Link
                href="/check-out"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-[#123B70]/10 border border-slate-200/60 transition group hover:-translate-y-0.5"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#123B70] transition">
                    Gate Checkout
                  </p>
                  <p className="text-[10.5px] text-slate-400 truncate">Scan / enter code</p>
                </div>
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-[#123B70]/10 border border-slate-200/60 transition group hover:-translate-y-0.5"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#C5222E] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#123B70] transition">
                    Reports & Export
                  </p>
                  <p className="text-[10.5px] text-slate-400 truncate">PDF / CSV analytics</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
