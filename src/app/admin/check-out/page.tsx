'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  AlertCircle,
  Search,
  LogOut,
  XCircle,
  ShieldCheck,
  Users,
  Clock,
  Car,
  RotateCcw,
  Building,
  Hash,
} from 'lucide-react';

export default function CheckOutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyCheckedOut, setAlreadyCheckedOut] = useState(false);
  const [notes, setNotes] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch active visitors currently on premises
  const fetchActiveVisitors = useCallback(async () => {
    setActiveLoading(true);
    try {
      const res = await fetch(`/api/active-visitors?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const activeOnly = Array.isArray(data)
          ? data.filter((p: any) => p.check_in_status === 'CHECKED_IN')
          : [];
        setActiveVisitors(activeOnly);
      }
    } catch (err) {
      console.error('Failed to fetch active visitors in admin:', err);
    } finally {
      setActiveLoading(false);
    }
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
    fetchActiveVisitors();
  }, [fetchActiveVisitors]);

  // Auto-search when query reaches 3 characters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        performSearch();
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setError('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults, searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setSearchResults([]);
    setSelectedVisitor(null);
    setSuccess(false);
    setAlreadyCheckedOut(false);

    try {
      const response = await fetch(
        `/api/participants/search?q=${encodeURIComponent(searchQuery)}&checkInStatus=CHECKED_IN&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Search failed');
      } else {
        const activeResults = Array.isArray(data)
          ? data.filter((p: any) => p.check_in_status === 'CHECKED_IN')
          : [];
        setSearchResults(activeResults);
        if (activeResults.length === 1) {
          setSelectedVisitor(activeResults[0]);
        }
      }
    } catch (err) {
      setError('An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch();
  };

  const handleCheckOut = async (visitor: any) => {
    setSelectedVisitor(visitor);
    setLoading(true);
    setError('');
    setSuccess(false);
    setAlreadyCheckedOut(false);

    try {
      const registrationCode = visitor.registration_code;
      if (!registrationCode) {
        setError('Invalid visitor data - missing registration code');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationCode, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyCheckedOut) {
          setAlreadyCheckedOut(true);
          setSelectedVisitor({ ...visitor, checkOutData: data });
          // Remove from local lists since already checked out
          setActiveVisitors((prev) =>
            prev.filter(
              (p) => String(p.id) !== String(visitor.id) && p.registration_code !== visitor.registration_code
            )
          );
          setSearchResults((prev) =>
            prev.filter(
              (p) => String(p.id) !== String(visitor.id) && p.registration_code !== visitor.registration_code
            )
          );
        } else {
          setError(data.error || 'Check-out failed');
        }
      } else {
        setSuccess(true);
        setSelectedVisitor({ ...visitor, checkOutData: data });

        // Immediately purge from active visitors and search results so visitor does NOT remain
        const vId = String(visitor.id);
        const vCode = visitor.registration_code;
        setActiveVisitors((prev) =>
          prev.filter((p) => String(p.id) !== vId && p.registration_code !== vCode)
        );
        setSearchResults((prev) =>
          prev.filter((p) => String(p.id) !== vId && p.registration_code !== vCode)
        );

        fetchActiveVisitors();
      }
    } catch (err) {
      setError('An error occurred during check-out');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedVisitor(null);
    setError('');
    setSuccess(false);
    setAlreadyCheckedOut(false);
    setNotes('');
    fetchActiveVisitors();
    searchInputRef.current?.focus();
  };

  const calculateMinutesOnSite = (checkInDate?: string) => {
    if (!checkInDate) return null;
    const start = new Date(checkInDate).getTime();
    const diffMins = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m on site`;
    return `${hours}h ${mins}m on site`;
  };

  // Determine what list to display - strictly filter to only CHECKED_IN visitors
  const isSearching = searchQuery.trim().length > 0;
  const rawList = isSearching ? searchResults : activeVisitors;
  const displayList = rawList.filter((p) => p.check_in_status === 'CHECKED_IN');

  // Pagination
  const totalPages = Math.ceil(displayList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = displayList.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Top Search & Actions Card */}
      <Card className="border border-slate-200 shadow-sm">
        <div className="p-4 sm:p-6 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-foreground uppercase tracking-tight">
                  Visitor Check-Out
                </h2>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  {activeVisitors.length} On Site
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin back-office check-out verification and gate clearance
              </p>
            </div>

            <Link
              href="/check-out"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#123B70] hover:bg-[#0d2d52] text-white text-xs font-bold transition shadow-xs min-h-[40px]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dedicated Gate Guard Terminal →</span>
            </Link>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearch}>
            <div className="space-y-1.5">
              <Label htmlFor="search" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search Checked-In Visitors</span>
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={searchInputRef}
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter code (e.g. CTS-7479), visitor name, or plate..."
                    className="h-10 text-sm pl-3 pr-8 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#123B70] hover:bg-[#0d2d52] h-10 text-xs sm:text-sm px-4 rounded-xl font-bold flex-1 sm:flex-none"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchActiveVisitors}
                    disabled={activeLoading}
                    className="h-10 px-3 rounded-xl"
                    title="Refresh on-site visitors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${activeLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {error && !selectedVisitor && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3.5 py-2.5 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Visitor / Clearance Action Card */}
      {selectedVisitor && (
        <Card className="border-2 border-[#123B70] shadow-md animate-in fade-in duration-200 overflow-hidden">
          {success ? (
            <CardContent className="text-center py-6 sm:py-8 px-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 border border-emerald-300">
                <CheckCircle className="h-7 w-7 text-emerald-700" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-foreground mb-1">
                CHECK-OUT SUCCESSFUL
              </h3>
              <p className="text-sm font-semibold text-slate-900">{selectedVisitor.full_name}</p>
              <p className="font-mono text-xs font-bold text-[#123B70] mt-0.5">
                {selectedVisitor.registration_code}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Cleared at {new Date(selectedVisitor.checkOutData?.check_out_time || Date.now()).toLocaleTimeString()}
              </p>
              <Button
                onClick={resetSearch}
                className="mt-5 bg-[#123B70] hover:bg-[#0d2d52] h-11 px-6 text-xs sm:text-sm font-bold rounded-xl w-full sm:w-auto"
              >
                Check Out Next Visitor
              </Button>
            </CardContent>
          ) : alreadyCheckedOut ? (
            <CardContent className="text-center py-6 sm:py-8 px-4">
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 border border-amber-300">
                <XCircle className="h-7 w-7 text-amber-700" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-foreground mb-1">
                ALREADY CHECKED OUT
              </h3>
              <p className="text-sm font-semibold text-slate-900">{selectedVisitor.full_name}</p>
              <p className="font-mono text-xs font-bold text-amber-700 mt-0.5">
                {selectedVisitor.registration_code}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Previously checked out at{' '}
                {selectedVisitor.checkOutData?.check_out_time
                  ? new Date(selectedVisitor.checkOutData.check_out_time).toLocaleTimeString()
                  : 'Earlier'}
              </p>
              <Button
                onClick={resetSearch}
                className="mt-5 bg-[#123B70] hover:bg-[#0d2d52] h-11 px-6 text-xs sm:text-sm font-bold rounded-xl w-full sm:w-auto"
              >
                Return to Directory
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 sm:py-4 px-4 sm:px-6">
                <CardTitle className="flex items-center justify-between text-sm sm:text-base font-bold">
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-[#123B70]" />
                    <span>Confirm Visitor Check-Out</span>
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-[#123B70] text-white">
                    {selectedVisitor.registration_code}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Visitor Name</span>
                    <span className="text-sm font-bold text-foreground">{selectedVisitor.full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Organisation</span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedVisitor.organisation || 'Personal Visit'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Host</span>
                    <span className="text-xs font-semibold text-foreground">
                      {selectedVisitor.host_name || 'General Visit'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Duration On Site</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {calculateMinutesOnSite(selectedVisitor.check_in_date) || 'Today'}
                    </span>
                  </div>
                  {selectedVisitor.vehicle_registration && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[11px]">Vehicle Plate</span>
                      <span className="font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded border border-amber-500 text-xs inline-block mt-0.5">
                        {selectedVisitor.vehicle_registration}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs font-semibold text-slate-700 block mb-1">
                    Check-Out Remarks (Optional)
                  </Label>
                  <Input
                    id="notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes or exit gate observations"
                    className="h-10 text-xs sm:text-sm rounded-xl"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-xl flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={() => handleCheckOut(selectedVisitor)}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white h-11 text-xs sm:text-sm font-extrabold rounded-xl"
                  >
                    {loading ? 'Processing check-out...' : 'Confirm & Check Out Visitor'}
                  </Button>
                  <Button
                    onClick={() => setSelectedVisitor(null)}
                    variant="outline"
                    className="h-11 text-xs sm:text-sm font-semibold rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}

      {/* Visitors List: On-Site Section OR Search Results */}
      {!selectedVisitor && (
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#123B70]" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {isSearching ? `Search Results (${searchResults.length})` : `On-Site Visitors (${activeVisitors.length})`}
              </h3>
            </div>
            {isSearching && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Clear search & show all on site
              </button>
            )}
          </div>

          <CardContent className="divide-y divide-slate-100 p-0">
            {displayList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  {isSearching ? 'No Checked-In Visitors Found' : 'No Visitors Currently On Site'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isSearching
                    ? `No matching checked-in visitors for "${searchQuery}"`
                    : 'All visitors have been cleared and checked out.'}
                </p>
              </div>
            ) : (
              paginatedResults.map((visitor) => (
                <div
                  key={visitor.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                        {visitor.registration_code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{visitor.full_name}</h4>
                      {visitor.check_in_date && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {calculateMinutesOnSite(visitor.check_in_date) || 'Active'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {visitor.organisation ? `${visitor.organisation} • ` : ''}
                      Host: {visitor.host_name || 'General'}
                    </p>
                    {visitor.vehicle_registration && (
                      <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                        <Car className="w-3 h-3 text-amber-600" />
                        <span className="font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded text-[10px]">
                          {visitor.vehicle_registration}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
                    <Button
                      onClick={() => setSelectedVisitor(visitor)}
                      className="bg-[#123B70] hover:bg-[#0d2d52] text-white text-xs font-bold h-9 px-4 rounded-xl w-full sm:w-auto"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1.5" />
                      <span>Check Out</span>
                    </Button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-2 border-t border-slate-100 bg-slate-50/40">
                <div className="text-xs text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, displayList.length)} of{' '}
                  {displayList.length}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs rounded-lg"
                  >
                    Previous
                  </Button>
                  <span className="text-xs px-2 font-semibold">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
