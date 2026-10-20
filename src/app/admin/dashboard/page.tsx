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
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  if (!sql) {
    console.warn('Database connection not available');
    return {
      visitorsInside: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      expectedVisitors: 0,
      recentActivity: [],
      peakHours: [],
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const visitorsInsideResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE check_in_status = 'CHECKED_IN'
    `;
    const visitorsInside = parseInt(visitorsInsideResult[0]?.count || '0');

    const todayCheckInsResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE DATE(check_in_date) = ${today}
    `;
    const todayCheckIns = parseInt(todayCheckInsResult[0]?.count || '0');

    const todayCheckOutsResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE check_in_status = 'CHECKED_OUT'
      AND DATE(check_out_date) = ${today}
    `;
    const todayCheckOuts = parseInt(todayCheckOutsResult[0]?.count || '0');

    const expectedVisitorsResult = await sql`
      SELECT COUNT(*) as count
      FROM participants
      WHERE participant_status = 'REGISTERED'
      AND check_in_status = 'NOT_CHECKED_IN'
    `;
    const expectedVisitors = parseInt(expectedVisitorsResult[0]?.count || '0');

    const recentActivityResult = await sql`
      SELECT
        p.id,
        p.full_name,
        p.organisation,
        p.check_in_status,
        p.check_in_date,
        p.check_out_date,
        p.host_name,
        p.registration_code
      FROM participants p
      WHERE p.check_in_status IN ('CHECKED_IN', 'CHECKED_OUT')
      ORDER BY COALESCE(p.check_out_date, p.check_in_date) DESC
      LIMIT 8
    `;
    const recentActivity = recentActivityResult.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      organisation: row.organisation,
      status: row.check_in_status,
      hostName: row.host_name,
      code: row.registration_code,
      date: row.check_out_date || row.check_in_date,
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
      visitorsInside,
      todayCheckIns,
      todayCheckOuts,
      expectedVisitors,
      recentActivity,
      peakHours,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      visitorsInside: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      expectedVisitors: 0,
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
      {/* Modern Dashboard Header */}
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
            Pentecost Convention Centre • Live gate activity & premises analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs relative z-10">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#123B70]" />
            <span>{todayFormatted}</span>
          </div>

          <Link
            href="/check-out"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B70] hover:bg-[#0C284E] active:bg-[#081e3d] text-white font-bold shadow-md shadow-[#123B70]/20 transition hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#E5A823]" />
            <span>Gate Terminal View →</span>
          </Link>
        </div>
      </div>

      {/* Enhanced Summary Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>Key Real-Time Indicators</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Live Sync</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            label="Total Visitors"
            value={stats.visitorsInside}
            iconName="package"
            variant="blue"
            href="/check-out"
            trend={stats.visitorsInside > 0 ? `${stats.visitorsInside} On Site` : 'All Cleared'}
            footerAvatars={['I', 'S', 'A']}
            footerText={`${stats.visitorsInside} on premises`}
            chartData={[30, 45, 25, 60, 50, 75, 40, 65, 35, 55, 40, 70, 25, 45, 60, 40]}
          />
          <StatCard
            label="Currently Checked In"
            value={stats.todayCheckIns}
            live={true}
            iconName="arrow"
            variant="indigo"
            href="/admin/check-in"
            trend="On Schedule"
            footerText={`${stats.todayCheckIns} gate arrivals`}
            chartData={[20, 35, 55, 40, 70, 60, 50, 40, 65, 75, 60, 50, 20, 30, 60, 55]}
          />
          <StatCard
            label="Departures Cleared"
            value={stats.todayCheckOuts}
            iconName="users"
            variant="teal"
            href="/admin/check-out"
            trend={stats.todayCheckOuts > 0 ? `${stats.todayCheckOuts} Cleared` : '0% Processed'}
            footerAvatars={['G', 'E', 'Q']}
            footerText={`${stats.todayCheckOuts} exited today`}
            chartData={[25, 40, 60, 75, 65, 50, 45, 30, 55, 60, 45, 35, 20, 40, 60, 50]}
          />
          <StatCard
            label="Today's Activity"
            value={stats.expectedVisitors}
            live={true}
            iconName="history"
            variant="purple"
            href="/admin/expected-attendees"
            trend="Live Today"
            footerText={`${stats.todayCheckIns} arrived · ${stats.todayCheckOuts} cleared`}
            chartData={[20, 45, 25, 25, 50, 65, 40, 55, 45, 60, 40, 65, 35, 70, 50, 40]}
          />
        </div>
      </div>

      {/* Two Column Grid: Recent Activity & Peak Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#123B70] dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Live Gate Activity
                </h3>
                <p className="text-[11px] text-slate-400">Recent check-in and check-out events</p>
              </div>
            </div>

            <Link
              href="/admin/visitor-history"
              className="text-xs font-semibold text-[#123B70] dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Full Log <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No visitor activity recorded yet today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {stats.recentActivity.map((activity: any, index: number) => {
                const isCheckedIn = activity.status === 'CHECKED_IN';
                const timeStr = activity.date
                  ? new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                // Initial avatar
                const initials = (activity.fullName || 'Guest')
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={index}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/60 dark:hover:bg-slate-850/50 rounded-2xl px-2 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCheckedIn
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {activity.fullName}
                          </p>
                          {activity.code && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {activity.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {activity.organisation ? `${activity.organisation} • ` : ''}
                          {activity.hostName ? `Host: ${activity.hostName}` : 'General Entry'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                          isCheckedIn
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {isCheckedIn ? 'Checked In' : 'Checked Out'}
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
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
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {peak.timeLabel}
                      </span>
                      <span className="font-mono font-bold text-[#123B70]">
                        {peak.count} check-ins
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
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
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Frequent Actions
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5A823]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/admin/check-in"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-[#123B70]/10 border border-slate-200/60 transition group hover:-translate-y-0.5"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#123B70] flex items-center justify-center shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#123B70] transition">
                    Check In Visitor
                  </p>
                  <p className="text-[10.5px] text-slate-400 truncate">Process arrival</p>
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
                  <p className="text-[10.5px] text-slate-400 truncate">Enter code / scan</p>
                </div>
              </Link>

              <Link
                href="/admin/visitors"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-[#123B70]/10 border border-slate-200/60 transition group hover:-translate-y-0.5"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#123B70] transition">
                    Visitors List
                  </p>
                  <p className="text-[10.5px] text-slate-400 truncate">Search directory</p>
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
                  <p className="text-[10.5px] text-slate-400 truncate">Analytics data</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
