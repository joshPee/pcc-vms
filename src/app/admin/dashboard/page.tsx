import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopBar from '@/components/AdminTopBar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, Clock, Percent, ArrowRight, BarChart3 } from 'lucide-react';

async function getDashboardStats() {
  if (!sql) {
    return {
      totalRegistered: 0,
      totalCheckedIn: 0,
      notCheckedIn: 0,
      attendancePercentage: 0,
    };
  }

  const stats = await sql`
    SELECT 
      COUNT(*) as total_registered,
      COUNT(*) FILTER (WHERE check_in_status = 'CHECKED_IN') as total_checked_in,
      COUNT(*) FILTER (WHERE check_in_status = 'NOT_CHECKED_IN') as not_checked_in
    FROM participants
    WHERE event_id = (SELECT id FROM events WHERE status = 'ACTIVE' LIMIT 1)
  `;

  const result = stats[0];
  const totalRegistered = parseInt(result.total_registered);
  const totalCheckedIn = parseInt(result.total_checked_in);
  const notCheckedIn = parseInt(result.not_checked_in);
  const attendancePercentage = totalRegistered > 0 
    ? Math.round((totalCheckedIn / totalRegistered) * 100) 
    : 0;

  return {
    totalRegistered,
    totalCheckedIn,
    notCheckedIn,
    attendancePercentage
  };
}

async function getActiveEvent() {
  if (!sql) {
    return null;
  }

  const events = await sql`
    SELECT id, name, date, venue, description, status, registration_open
    FROM events
    WHERE status = 'ACTIVE'
    LIMIT 1
  `;
  return events[0] || null;
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/admin/login');
  }

  const stats = await getDashboardStats();
  const activeEvent = await getActiveEvent();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Registered - Blue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-semibold text-blue-600">Total Registered</span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalRegistered}</span>
              <span className="text-xs sm:text-sm text-blue-600">registered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }} />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">target: 50</span>
            </div>
          </div>

          {/* Checked In - Green */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-semibold text-green-600">Checked In</span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalCheckedIn}</span>
              <span className="text-xs sm:text-sm text-green-600">checked in</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: `${stats.attendancePercentage}%` }} />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">{stats.attendancePercentage}%</span>
            </div>
          </div>

          {/* Not Yet Arrived - Amber */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-semibold text-amber-600">Not Yet Arrived</span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.notCheckedIn}</span>
              <span className="text-xs sm:text-sm text-gray-500">pending</span>
            </div>
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] sm:text-xs rounded-full">
              Awaiting Arrival
            </Badge>
          </div>

          {/* Attendance Rate - Purple */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-semibold text-purple-600">Attendance Rate</span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.attendancePercentage}%</span>
              <span className="text-xs sm:text-sm text-purple-600">rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${stats.attendancePercentage}%` }} />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">target: 80%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link
                href="/admin/check-in"
                className="group"
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-[#123B70]/20 hover:border-[#123B70] hover:bg-[#123B70]/5">
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#123B70]/10 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-[#123B70]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#123B70]">Check In</h3>
                          <p className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">Register participant arrival</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#123B70] group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link
                href="/admin/registrations"
                className="group"
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-[#123B70]/20 hover:border-[#123B70] hover:bg-[#123B70]/5">
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#123B70]/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-[#123B70]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#123B70]">Registrations</h3>
                          <p className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">View all registrations</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#123B70] group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link
                href="/admin/attendance"
                className="group"
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-[#123B70]/20 hover:border-[#123B70] hover:bg-[#123B70]/5">
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#123B70]/10 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-[#123B70]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#123B70]">Attendance</h3>
                          <p className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">View attendance overview</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#123B70] group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
