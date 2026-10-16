'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, Filter, Download, Calendar, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Eye, Settings, Printer, Clock, BarChart3, MoreHorizontal, CheckSquare, Square, MoreVertical } from 'lucide-react';

export default function VisitorHistoryPage() {
  const [visitorHistory, setVisitorHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  
  // Column sorting
  const [sortColumn, setSortColumn] = useState<string>('check_in_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column visibility
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    regCode: true,
    name: true,
    organisation: true,
    position: true,
    phone: true,
    type: true,
    recurring: true,
    checkIn: true,
    checkOut: true,
    status: true,
    duration: true
  });
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  
  // Detailed view modal
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  
  // Real-time updates
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Print mode
  const [printMode, setPrintMode] = useState(false);
  
  // Statistics visibility
  const [showStatistics, setShowStatistics] = useState(false);
  
  // Mobile menu
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Set default date range to last 30 days on component mount
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchVisitorHistory();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    fetchVisitorHistory();
  }, [startDate, endDate, visitorTypeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, visitorTypeFilter]);

  const fetchVisitorHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (visitorTypeFilter !== 'ALL') params.append('visitorType', visitorTypeFilter);

      const response = await fetch(`/api/visitor-history?${params.toString()}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setVisitorHistory(data);
        setFilteredHistory(data);
      } else if (data.error) {
        setError(data.error);
        // Try fallback without filters
        const fallbackParams = new URLSearchParams();
        const fallbackResponse = await fetch(`/api/visitor-history?${fallbackParams.toString()}`);
        const fallbackData = await fallbackResponse.json();
        
        if (Array.isArray(fallbackData)) {
          setVisitorHistory(fallbackData);
          setFilteredHistory(fallbackData);
          setError(null);
        } else {
          setVisitorHistory([]);
          setFilteredHistory([]);
        }
      } else {
        setVisitorHistory([]);
        setFilteredHistory([]);
      }
    } catch (error) {
      setError('Failed to fetch visitor history');
      setVisitorHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filters when search or advanced filters change
  useEffect(() => {
    if (visitorHistory.length === 0) return;
    
    let filtered = [...visitorHistory];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.full_name?.toLowerCase().includes(query) ||
        v.registration_code?.toLowerCase().includes(query) ||
        v.organisation?.toLowerCase().includes(query) ||
        v.phone?.includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(v => v.check_in_status === statusFilter);
    }
    
    // Duration filter
    if (minDuration) {
      filtered = filtered.filter(v => v.visit_duration_hours >= parseFloat(minDuration));
    }
    if (maxDuration) {
      filtered = filtered.filter(v => v.visit_duration_hours <= parseFloat(maxDuration));
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (sortColumn === 'check_in_date' || sortColumn === 'check_out_date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredHistory(filtered);
  }, [searchQuery, statusFilter, minDuration, maxDuration, sortColumn, sortDirection, visitorHistory]);

  const handleExport = () => {
    const csvContent = [
      ['Registration Code', 'Name', 'Organisation', 'Position', 'Phone', 'Type', 'Check-In', 'Check-Out', 'Status', 'Duration (hrs)', 'Checked In By', 'Checked Out By', 'Notes'],
      ...filteredHistory.map(v => [
        v.registration_code || '',
        v.full_name,
        v.organisation,
        v.position,
        v.phone || '',
        v.visitor_type || 'GENERAL',
        new Date(v.check_in_date).toLocaleString(),
        v.check_out_date ? new Date(v.check_out_date).toLocaleString() : 'N/A',
        v.check_in_status,
        v.visit_duration_hours && typeof v.visit_duration_hours === 'number' ? v.visit_duration_hours.toFixed(2) : 'N/A',
        v.checked_in_by || 'N/A',
        v.checked_out_by || 'N/A',
        v.check_out_notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (hours: number) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const handleClearFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setVisitorTypeFilter('ALL');
  };

  const handleShowAll = () => {
    setStartDate('');
    setEndDate('');
    setVisitorTypeFilter('ALL');
  };

  // Quick date presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      case 'last30days':
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
    }
  };

  // Column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Column visibility toggle
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Detailed view
  const handleViewDetails = (visitor: any) => {
    setSelectedVisitor(visitor);
    setShowDetailModal(true);
  };

  // Export selected only
  const handleExportSelected = () => {
    const selectedVisitors = visitorHistory.filter(v => selectedIds.has(v.id));
    if (selectedVisitors.length === 0) return;
    
    const csvContent = [
      ['Registration Code', 'Name', 'Organisation', 'Position', 'Phone', 'Type', 'Check-In', 'Check-Out', 'Status', 'Duration (hrs)', 'Checked In By', 'Checked Out By', 'Notes'],
      ...selectedVisitors.map(v => [
        v.registration_code || '',
        v.full_name,
        v.organisation,
        v.position,
        v.phone || '',
        v.visitor_type || 'GENERAL',
        new Date(v.check_in_date).toLocaleString(),
        v.check_out_date ? new Date(v.check_out_date).toLocaleString() : 'N/A',
        v.check_in_status,
        v.visit_duration_hours && typeof v.visit_duration_hours === 'number' ? v.visit_duration_hours.toFixed(2) : 'N/A',
        v.checked_in_by || 'N/A',
        v.checked_out_by || 'N/A',
        v.check_out_notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-visitors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print functionality
  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, endIndex);

  // Statistics calculation
  const statistics = {
    total: filteredHistory.length,
    checkedIn: filteredHistory.filter(v => v.check_in_status === 'CHECKED_IN').length,
    checkedOut: filteredHistory.filter(v => v.check_in_status === 'CHECKED_OUT').length,
    avgDuration: filteredHistory.length > 0 
      ? filteredHistory.reduce((sum, v) => sum + (v.visit_duration_hours || 0), 0) / filteredHistory.length 
      : 0,
    byType: filteredHistory.reduce((acc, v) => {
      const type = v.visitor_type || 'GENERAL';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map((v: any) => v.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Visitor History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6">
            {/* Action buttons and controls */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button
                onClick={handleShowAll}
                variant="outline"
                className="h-9 text-sm"
              >
                Show All
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="h-9 text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading || filteredHistory.length === 0}
                className="bg-[#123B70] hover:bg-[#0d2d52] h-9 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <div className="flex-1"></div>
              
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filters
              </Button>
              
              {/* Desktop: Show all buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Columns
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Printer className="w-3 h-3 mr-1" />
                  Print
                </Button>
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 text-xs ${autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh'}
                </Button>
                <Button
                  onClick={() => setShowStatistics(!showStatistics)}
                  variant={showStatistics ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 text-xs ${showStatistics ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  {showStatistics ? 'Hide Stats' : 'Show Stats'}
                </Button>
              </div>
              
              {/* Mobile: Show dropdown menu */}
              <div className="md:hidden relative">
                <Button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {showMobileMenu && (
                  <div className="absolute left-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 w-48">
                    <Button
                      onClick={() => {
                        setShowColumnMenu(!showColumnMenu);
                        setShowMobileMenu(false);
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                    >
                      <Settings className="w-3 h-3 mr-2" />
                      Columns
                    </Button>
                    <Button
                      onClick={() => {
                        handlePrint();
                        setShowMobileMenu(false);
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                    >
                      <Printer className="w-3 h-3 mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => {
                        setAutoRefresh(!autoRefresh);
                        setShowMobileMenu(false);
                      }}
                      variant={autoRefresh ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start h-8 text-xs ${autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      <Clock className="w-3 h-3 mr-2" />
                      {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowStatistics(!showStatistics);
                        setShowMobileMenu(false);
                      }}
                      variant={showStatistics ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start h-8 text-xs ${showStatistics ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      <BarChart3 className="w-3 h-3 mr-2" />
                      {showStatistics ? 'Hide Stats' : 'Show Stats'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Filters Panel */}
            {showAdvancedFilters && (
              <div className="bg-muted/50 p-4 rounded-lg mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search" className="flex items-center gap-2 mb-1.5 text-xs">
                      <Search className="w-3.5 h-3.5" />
                      Search
                    </Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Name, code, org, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate" className="flex items-center gap-2 mb-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="flex items-center gap-2 mb-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visitorType" className="flex items-center gap-2 mb-1.5 text-xs">
                      <Filter className="w-3.5 h-3.5" />
                      Visitor Type
                    </Label>
                    <select
                      id="visitorType"
                      value={visitorTypeFilter}
                      onChange={(e) => setVisitorTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    >
                      <option value="ALL">All Types</option>
                      <option value="GENERAL">General</option>
                      <option value="VIP">VIP</option>
                      <option value="CONTRACTOR">Contractor</option>
                      <option value="DELIVERY">Delivery</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="MEETING">Meeting</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5">Status</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="CHECKED_OUT">Checked Out</option>
                      <option value="NOT_CHECKED_IN">Not Checked In</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5">Min Duration (hours)</Label>
                    <Input
                      type="number"
                      placeholder="Min hours"
                      value={minDuration}
                      onChange={(e) => setMinDuration(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5">Max Duration (hours)</Label>
                    <Input
                      type="number"
                      placeholder="Max hours"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                
                {/* Quick date presets */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-xs text-muted-foreground">Quick Date:</span>
                  <Button onClick={() => setDatePreset('today')} variant="ghost" size="sm" className="h-7 text-xs">Today</Button>
                  <Button onClick={() => setDatePreset('last7days')} variant="ghost" size="sm" className="h-7 text-xs">Last 7 Days</Button>
                  <Button onClick={() => setDatePreset('last30days')} variant="ghost" size="sm" className="h-7 text-xs">Last 30 Days</Button>
                  <Button onClick={() => setDatePreset('thisMonth')} variant="ghost" size="sm" className="h-7 text-xs">This Month</Button>
                </div>
              </div>
            )}

            {/* Column Visibility Menu */}
            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-4 z-50 w-64">
                <h4 className="font-semibold text-sm mb-3">Show/Hide Columns</h4>
                <div className="space-y-2">
                  {Object.entries(visibleColumns).map(([key, visible]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics Summary */}
            {showStatistics && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-blue-900">Statistics Summary</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Total Records</p>
                    <p className="font-semibold text-lg">{statistics.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Checked In</p>
                    <p className="font-semibold text-lg text-green-600">{statistics.checkedIn}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Checked Out</p>
                    <p className="font-semibold text-lg text-blue-600">{statistics.checkedOut}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Avg Duration</p>
                    <p className="font-semibold text-lg">{formatDuration(statistics.avgDuration)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-muted-foreground mb-2">By Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statistics.byType).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {String(type)}: {String(count)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>Total Records: <span className="font-semibold text-foreground">{filteredHistory.length}</span></p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#123B70]"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No visitor history found for the selected date range and filters.
            </div>
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center justify-between">
                  <span className="text-sm text-blue-900">
                    {selectedIds.size} visitor{selectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button onClick={handleExportSelected} size="sm" className="h-8 text-sm">
                      <Download className="w-3 h-3 mr-1" />
                      Export Selected
                    </Button>
                    <Button onClick={() => setSelectedIds(new Set())} variant="outline" size="sm" className="h-8 text-sm">
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4">
                        <button onClick={toggleSelectAll} className="hover:bg-muted p-1 rounded">
                          {selectedIds.size === currentItems.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      {visibleColumns.regCode && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('registration_code')}
                        >
                          Reg Code {sortColumn === 'registration_code' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.name && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('full_name')}
                        >
                          Name {sortColumn === 'full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.organisation && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('organisation')}
                        >
                          Organisation {sortColumn === 'organisation' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.position && (
                        <th className="text-left py-3 px-4 font-semibold">Position</th>
                      )}
                      {visibleColumns.phone && (
                        <th className="text-left py-3 px-4 font-semibold">Phone</th>
                      )}
                      {visibleColumns.type && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('visitor_type')}
                        >
                          Type {sortColumn === 'visitor_type' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.recurring && (
                        <th className="text-left py-3 px-4 font-semibold">Recurring</th>
                      )}
                      {visibleColumns.checkIn && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('check_in_date')}
                        >
                          Check-In {sortColumn === 'check_in_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.checkOut && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('check_out_date')}
                        >
                          Check-Out {sortColumn === 'check_out_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.status && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('check_in_status')}
                        >
                          Status {sortColumn === 'check_in_status' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {visibleColumns.duration && (
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('visit_duration_hours')}
                        >
                          Duration {sortColumn === 'visit_duration_hours' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((visitor) => (
                      <tr key={visitor.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <button onClick={() => toggleSelectOne(visitor.id)} className="hover:bg-muted p-1 rounded">
                            {selectedIds.has(visitor.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        {visibleColumns.regCode && (
                          <td className="py-3 px-4 font-mono text-xs">{visitor.registration_code}</td>
                        )}
                        {visibleColumns.name && (
                          <td className="py-3 px-4 font-medium">{visitor.full_name}</td>
                        )}
                        {visibleColumns.organisation && (
                          <td className="py-3 px-4">{visitor.organisation}</td>
                        )}
                        {visibleColumns.position && (
                          <td className="py-3 px-4">{visitor.position}</td>
                        )}
                        {visibleColumns.phone && (
                          <td className="py-3 px-4">{visitor.phone || 'N/A'}</td>
                        )}
                        {visibleColumns.type && (
                          <td className="py-3 px-4">
                            <Badge className="bg-[#123B70]/10 text-[#123B70] border-[#123B70]/20">
                              {visitor.visitor_type || 'GENERAL'}
                            </Badge>
                          </td>
                        )}
                        {visibleColumns.recurring && (
                          <td className="py-3 px-4">
                            {visitor.is_recurring ? (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">Yes</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 border-gray-200">No</Badge>
                            )}
                          </td>
                        )}
                        {visibleColumns.checkIn && (
                          <td className="py-3 px-4">
                            {new Date(visitor.check_in_date).toLocaleString()}
                          </td>
                        )}
                        {visibleColumns.checkOut && (
                          <td className="py-3 px-4">
                            {visitor.check_out_date ? new Date(visitor.check_out_date).toLocaleString() : 'N/A'}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="py-3 px-4">
                            <Badge className={
                              visitor.check_in_status === 'CHECKED_IN' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : visitor.check_in_status === 'CHECKED_OUT'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }>
                              {visitor.check_in_status}
                            </Badge>
                          </td>
                        )}
                        {visibleColumns.duration && (
                          <td className="py-3 px-4">
                            {formatDuration(visitor.visit_duration_hours)}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <Button
                            onClick={() => handleViewDetails(visitor)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleFirstPage}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-[#123B70] hover:bg-[#0d2d52]' : ''}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleLastPage}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Detailed View Modal */}
          {showDetailModal && selectedVisitor && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Visitor Details</h3>
                    <Button onClick={() => setShowDetailModal(false)} variant="ghost" size="sm">
                      ×
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Registration Code</p>
                        <p className="font-medium">{selectedVisitor.registration_code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{selectedVisitor.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Organisation</p>
                        <p className="font-medium">{selectedVisitor.organisation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p className="font-medium">{selectedVisitor.position}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedVisitor.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedVisitor.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Visitor Type</p>
                        <p className="font-medium">{selectedVisitor.visitor_type || 'GENERAL'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recurring</p>
                        <p className="font-medium">{selectedVisitor.is_recurring ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-In Date</p>
                        <p className="font-medium">{new Date(selectedVisitor.check_in_date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-Out Date</p>
                        <p className="font-medium">{selectedVisitor.check_out_date ? new Date(selectedVisitor.check_out_date).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{selectedVisitor.check_in_status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{formatDuration(selectedVisitor.visit_duration_hours)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Checked In By</p>
                        <p className="font-medium">{selectedVisitor.checked_in_by || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Checked Out By</p>
                        <p className="font-medium">{selectedVisitor.checked_out_by || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Check-Out Notes</p>
                        <p className="font-medium">{selectedVisitor.check_out_notes || 'N/A'}</p>
                      </div>
                      {selectedVisitor.host_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Host Name</p>
                          <p className="font-medium">{selectedVisitor.host_name}</p>
                        </div>
                      )}
                      {selectedVisitor.host_department && (
                        <div>
                          <p className="text-sm text-muted-foreground">Host Department</p>
                          <p className="font-medium">{selectedVisitor.host_department}</p>
                        </div>
                      )}
                      {selectedVisitor.badge_number && (
                        <div>
                          <p className="text-sm text-muted-foreground">Badge Number</p>
                          <p className="font-medium">{selectedVisitor.badge_number}</p>
                        </div>
                      )}
                      {selectedVisitor.visit_purpose && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Visit Purpose</p>
                          <p className="font-medium">{selectedVisitor.visit_purpose}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
