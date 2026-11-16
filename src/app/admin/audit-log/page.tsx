'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Search, RefreshCw, CheckCircle, XCircle, LogIn, LogOut, UserCheck, Edit, Download, Calendar } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let url = `/api/audit-log?limit=${itemsPerPage}&offset=${offset}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.participant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'CHECK_OUT':
        return <LogOut className="h-4 w-4 text-amber-600" />;
      case 'REGISTER':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-purple-600" />;
      case 'WATCHLIST_MATCH':
      case 'WATCHLIST_DENIED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <ScrollText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Check In</Badge>;
      case 'CHECK_OUT':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Check Out</Badge>;
      case 'REGISTER':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Register</Badge>;
      case 'UPDATE':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Update</Badge>;
      case 'WATCHLIST_MATCH':
      case 'WATCHLIST_DENIED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Watchlist</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{action}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Action', 'User', 'Participant', 'Timestamp', 'Details', 'IP Address'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          log.action || '',
          log.user_name || '',
          log.participant_name || '',
          formatDate(log.timestamp),
          `"${(log.details || '').replace(/"/g, '""')}"`,
          log.ip_address || ''
        ].map(val => val.includes(',') ? `"${val}"` : val).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = `audit-logs-${startDate || 'all'}-${endDate || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url2);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Header with Title and Action Toolbar matching Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Security Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable log of gate operations, supervisor decisions, and administrative actions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#123B70]" />
            <span>{todayFormatted}</span>
          </div>

          <Button
            onClick={() => {
              setLoading(true);
              fetchLogs();
            }}
            disabled={loading}
            variant="outline"
            size="sm"
            className="h-9 rounded-xl font-semibold border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={loading}
            size="sm"
            className="bg-[#123B70] hover:bg-[#0C284E] text-white font-bold h-9 rounded-xl shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#E5A823]" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search audit trail by action, officer name, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-xs w-36 rounded-xl"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-xs w-36 rounded-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#123B70]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                {filteredLogs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No audit logs found</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Action</th>
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Participant</th>
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">IP Address</th>
                        <th className="py-3 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-medium">
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              {getActionBadge(log.action)}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">{log.user_name || 'System'}</td>
                          <td className="py-3 px-3 text-slate-700">{log.participant_name || '—'}</td>
                          <td className="py-3 px-3 text-slate-500 font-mono">{formatDate(log.timestamp)}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{log.ip_address || '—'}</td>
                          <td className="py-3 px-3 max-w-xs truncate text-slate-600" title={log.details}>
                            {log.details || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 rounded-lg"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
