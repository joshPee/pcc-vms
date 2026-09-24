'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Printer,
  Calendar,
  Search,
  Users,
  LogOut,
  Clock,
  Building,
  TrendingUp,
  ShieldAlert,
  Car,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function ReportsPage() {
  const [range, setRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?range=${range}&department=${encodeURIComponent(departmentFilter)}`;
      if (range === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range, startDate, endDate, departmentFilter]);

  // Client-side search and status filter on detailed visitor logs
  const filteredLogs = useMemo(() => {
    const logs = reportData.visitorLogs || [];
    return logs.filter((item: any) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reportData.visitorLogs, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    const logs = filteredLogs;
    if (logs.length === 0) {
      alert('No visitor logs available to export.');
      return;
    }

    const headers = [
      'Registration Code',
      'Visitor Name',
      'Phone Number',
      'Organization',
      'Origin / Location',
      'Host Name',
      'Department',
      'Purpose of Visit',
      'Vehicle Plate',
      'Date',
      'Check-in Time',
      'Check-out Time',
      'Duration (Mins)',
      'Status',
    ];

    const rows = logs.map((log: any) => [
      `"${log.code}"`,
      `"${log.name}"`,
      `"${log.phone}"`,
      `"${log.organisation}"`,
      `"${log.location}"`,
      `"${log.host}"`,
      `"${log.department}"`,
      `"${log.purpose}"`,
      `"${log.vehicle}"`,
      `"${log.date}"`,
      `"${log.checkInTime}"`,
      `"${log.checkOutTime || 'Still on site'}"`,
      `"${log.durationMinutes}"`,
      `"${log.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pcc-visitor-report-${range}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDuration = (mins: number) => {
    if (!mins || mins <= 0) return '< 5 mins';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} mins`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black uppercase">
              Pentecost Convention Centre
            </h1>
            <p className="text-sm text-gray-600">
              Security Gate Operations & Visitor Attendance Report
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Generated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Screen Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Gate Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time visitor footfall, gate clearance volume, and detailed entry logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 h-9 border-[#123B70]/30 text-[#123B70] hover:bg-[#123B70]/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-9 bg-[#123B70] hover:bg-[#0d2d52] text-white"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="print:hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Range Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'today', label: 'Today' },
                { id: '7days', label: 'Past 7 Days' },
                { id: '30days', label: 'Past 30 Days' },
                { id: '3months', label: 'Past 3 Months' },
                { id: 'custom', label: 'Custom Range' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    range === tab.id
                      ? 'bg-[#123B70] text-white shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {range === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs w-36"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Check-ins */}
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Entries
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-[#123B70] mt-1.5">
                  {reportData.summary?.totalCheckIns || 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>Gate processed</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#123B70]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#123B70]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currently on Grounds */}
        <Card className="border border-border/70 shadow-xs bg-emerald-50/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Active Inside
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1.5">
                  {reportData.summary?.currentlyInside || 0}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  On convention grounds
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Exited */}
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cleared Out
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-700 mt-1.5">
                  {reportData.summary?.totalCheckOuts || 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exit gate checked
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Flow / Duration */}
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Avg Dwell / Peak
                </p>
                <p className="text-lg sm:text-xl font-bold text-[#123B70] mt-1.5">
                  {formatDuration(reportData.summary?.avgDurationMinutes)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Peak: {reportData.summary?.peakHour || 'N/A'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#123B70]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#123B70]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#123B70]" />
                Gate Traffic Flow
              </span>
              <div className="flex items-center gap-3 text-xs font-normal">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#123B70]" />
                  Check-ins
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Check-outs
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.trends && reportData.trends.length > 0 ? (
              <div className="space-y-3 pt-2">
                {reportData.trends.map((t: any, idx: number) => {
                  const maxCount = Math.max(
                    ...reportData.trends.map((x: any) => Math.max(x.checkIns, x.checkOuts)),
                    1
                  );
                  const inPct = Math.round((t.checkIns / maxCount) * 100);
                  const outPct = Math.round((t.checkOuts / maxCount) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">{t.date}</span>
                        <span className="text-muted-foreground text-[11px]">
                          {t.checkIns} in · {t.checkOuts} out
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 h-2.5 bg-muted/40 rounded-full p-0.5">
                        <div className="h-full flex items-center justify-end">
                          <div
                            className="h-full bg-[#123B70] rounded-full transition-all duration-500"
                            style={{ width: `${inPct}%` }}
                          />
                        </div>
                        <div className="h-full flex items-center justify-start">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${outPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No entry activity recorded for this period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Destination Departments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="w-4 h-4 text-[#123B70]" />
              Visitors by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.departments && reportData.departments.length > 0 ? (
              <div className="space-y-3 pt-1">
                {reportData.departments.map((dept: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[180px]">
                        {dept.name}
                      </span>
                      <span className="font-semibold text-[#123B70]">
                        {dept.count} ({dept.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#123B70] rounded-full"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No department data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Visitor Log Records */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#123B70]" />
              Detailed Entry Audit Logs ({filteredLogs.length})
            </CardTitle>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search name, code, host..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="CHECKED_IN">Inside</option>
                <option value="CHECKED_OUT">Checked Out</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-border/80 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border/80">
                <tr>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Code
                  </th>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Host & Dept
                  </th>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Time In / Out
                  </th>
                  <th className="py-3 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#123B70]">
                        {log.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground">{log.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {log.phone} {log.organisation !== 'N/A' && `· ${log.organisation}`}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground">{log.host}</div>
                        <div className="text-[11px] text-muted-foreground">{log.department}</div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground max-w-[140px] truncate">
                        {log.purpose}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {log.vehicle !== 'None' ? (
                          <span className="inline-flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded font-bold text-stone-700">
                            <Car className="w-3 h-3" />
                            {log.vehicle}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground">{log.checkInTime}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {log.checkOutTime ? `Out: ${log.checkOutTime}` : 'Active'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {log.status === 'CHECKED_IN' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100">
                            Inside
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-medium hover:bg-slate-100">
                            Cleared
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                      No matching visitor records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
