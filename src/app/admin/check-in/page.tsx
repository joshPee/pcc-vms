'use client';

import { useState, useEffect, useRef } from 'react';
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
  UserCheck,
  XCircle,
  Repeat,
  Building,
  Phone,
  MapPin,
  Car,
  User,
  PlusCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Sparkles,
  CalendarCheck,
  Briefcase,
} from 'lucide-react';

const AVATAR_COLORS = [
  'bg-[#123B70] text-white',
  'bg-blue-600 text-white',
  'bg-slate-700 text-white',
  'bg-indigo-600 text-white',
  'bg-sky-700 text-white',
];

function getInitials(name: string) {
  if (!name) return 'V';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInData, setWalkInData] = useState({
    fullName: '',
    organisation: '',
    position: '',
    phone: '',
    isRecurring: false,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    searchInputRef.current?.focus();
    fetch('/api/events/active')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title) {
          setActiveEvent(data);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-search when query reaches 3 characters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        performSearch();
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setSelectedVisitor(null);
        setError('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setSearchResults([]);
    setSelectedVisitor(null);
    setSuccess(false);
    setAlreadyCheckedIn(false);

    try {
      const response = await fetch(`/api/participants/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Search failed');
      } else {
        const sortedResults = [...data].sort((a, b) => {
          if (a.is_recurring && !b.is_recurring) return -1;
          if (!a.is_recurring && b.is_recurring) return 1;
          return 0;
        });
        setSearchResults(sortedResults);
        if (sortedResults.length === 1) {
          setSelectedVisitor(sortedResults[0]);
        }
      }
    } catch {
      setError('An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch();
  };

  const handleCheckIn = async (visitor: any) => {
    setSelectedVisitor(visitor);
    setLoading(true);
    setError('');
    setSuccess(false);
    setAlreadyCheckedIn(false);

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: visitor.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyCheckedIn) {
          setAlreadyCheckedIn(true);
          setSelectedVisitor({ ...visitor, checkInData: data });
        } else {
          setError(data.error || 'Check-in failed');
        }
      } else {
        setSuccess(true);
        setSelectedVisitor({ ...visitor, checkInData: data });
        setSearchResults((prev) =>
          prev.map((p) => (p.id === visitor.id ? { ...p, check_in_status: 'CHECKED_IN' } : p))
        );
        setTimeout(() => {
          resetSearch();
        }, 3000);
      }
    } catch {
      setError('An error occurred during check-in');
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
    setAlreadyCheckedIn(false);
    searchInputRef.current?.focus();
  };

  // Pagination
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleWalkInSubmit = async (e: React.FormEvent, checkInImmediately = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: walkInData.fullName,
          organisation: walkInData.organisation,
          position: walkInData.position,
          phone: walkInData.phone,
          isRecurring: walkInData.isRecurring,
          checkInImmediately,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Walk-in registration failed');
      } else {
        if (checkInImmediately && data.checkInData) {
          setSuccess(true);
          setSelectedVisitor({
            full_name: walkInData.fullName,
            organisation: walkInData.organisation,
            position: walkInData.position,
            registration_code: data.registrationCode,
            checkInData: data.checkInData,
          });
          setShowWalkInModal(false);
        } else {
          setShowWalkInModal(false);
          setWalkInData({ fullName: '', organisation: '', position: '', phone: '', isRecurring: false });
          setSearchQuery(data.registrationCode);
          handleSearch(e);
        }
      }
    } catch {
      setError('An error occurred during walk-in registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6">
      {/* Top Search & Actions Card */}
      <Card className="border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                  Visitor Check-In
                </h1>
                {activeEvent?.title && (
                  <Badge variant="outline" className="bg-blue-50 text-[#123B70] border-blue-200 text-xs font-semibold">
                    🎯 {activeEvent.title}
                  </Badge>
                )}
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verify credentials, review security host details, and confirm gate entry clearance
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/guard"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1E36] text-xs font-bold transition border border-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Guard Dashboard</span>
              </Link>
              <Button
                onClick={() => setShowWalkInModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-[#123B70] hover:bg-[#0d2d52] text-white text-xs sm:text-sm font-bold h-10 px-4 rounded-xl transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Walk-In Visitor</span>
              </Button>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search Registered or Expected Visitors</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type visitor name, phone number, or registration code..."
                  className="pl-10 pr-9 h-11 text-sm rounded-xl border-slate-200 focus-visible:ring-[#123B70]/20 focus-visible:border-[#123B70]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#123B70] hover:bg-[#0d2d52] h-11 text-sm font-bold px-6 rounded-xl shrink-0 transition"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Auto-searches after 3 characters. Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-slate-600">Enter</kbd> to search immediately.
            </p>
          </form>

          {error && !selectedVisitor && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <span className="font-semibold">Search notice:</span> {error}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Reception Guidance Welcome State (When idle & not searching) */}
      {!searchQuery && searchResults.length === 0 && !selectedVisitor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#123B70] border border-blue-100 flex items-center justify-center mb-3">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">1. Instant Lookup</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Find visitors by their 6-digit registration code, phone number, or full name.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center mb-3">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">2. Verify & Check-In</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Verify host department, purpose of visit, and vehicle plates before clearance.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-3">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">3. Rapid Walk-Ins</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Register unscheduled attendees on the fly with immediate gate clearance.
            </p>
          </div>
        </div>
      )}

      {/* Search Results List */}
      {searchResults.length > 0 && !selectedVisitor && (
        <Card className="border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/60 border-b border-slate-100 px-4 sm:px-6 py-3.5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                Matching Visitors
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-semibold bg-slate-200/80 text-slate-700">
                {searchResults.length}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">Click any visitor to review and check in</span>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {paginatedResults.map((participant, idx) => {
              const isCheckedIn = participant.check_in_status === 'CHECKED_IN';
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <div
                  key={participant.id}
                  onClick={() => setSelectedVisitor(participant)}
                  className="p-4 sm:p-5 hover:bg-blue-50/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 shadow-2xs ${avatarColor}`}
                    >
                      {getInitials(participant.full_name)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[#123B70] transition">
                          {participant.full_name}
                        </span>
                        {participant.is_recurring && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-semibold py-0">
                            <Repeat className="w-2.5 h-2.5 mr-1" />
                            Recurring
                          </Badge>
                        )}
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {participant.registration_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {participant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {participant.phone}
                          </span>
                        )}
                        {participant.organisation && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {participant.organisation}
                          </span>
                        )}
                        {participant.location && (
                          <span className="flex items-center gap-1 hidden sm:inline-flex">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {participant.location}
                          </span>
                        )}
                      </div>

                      {participant.host_name && (
                        <p className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Host:</span> {participant.host_name}{' '}
                          {participant.host_department && `(${participant.host_department})`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Badge
                      className={`${
                        isCheckedIn
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-[#123B70] border-blue-200'
                      } text-xs font-semibold`}
                    >
                      {isCheckedIn ? 'Checked In' : 'Ready to Check In'}
                    </Badge>
                    <span className="text-xs font-bold text-[#123B70] group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-50/60 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-slate-700">{Math.min(endIndex, searchResults.length)}</span> of{' '}
                  <span className="font-semibold text-slate-700">{searchResults.length}</span> results
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs rounded-lg"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 text-xs rounded-lg ${
                            currentPage === pageNum ? 'bg-[#123B70] hover:bg-[#0d2d52] font-bold' : ''
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Selected Visitor / Verification Card */}
      {selectedVisitor && (
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          {success ? (
            <CardContent className="text-center py-10 px-4 sm:px-8 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="h-9 w-9 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  CHECK-IN CONFIRMED
                </h2>
                <p className="text-sm text-slate-600 font-medium">
                  {selectedVisitor.full_name} has been granted entrance clearance
                </p>
                <div className="inline-block mt-2">
                  <span className="font-mono text-sm font-bold text-[#123B70] bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                    Pass: {selectedVisitor.registration_code}
                  </span>
                </div>
              </div>

              {selectedVisitor.checkInData?.check_in_time && (
                <p className="text-xs text-slate-500">
                  Timestamp: {new Date(selectedVisitor.checkInData.check_in_time).toLocaleTimeString()}
                </p>
              )}

              <div className="pt-4 max-w-sm mx-auto">
                <Button
                  onClick={resetSearch}
                  className="w-full bg-[#123B70] hover:bg-[#0d2d52] h-11 text-sm font-bold rounded-xl shadow-xs transition"
                >
                  Check In Another Visitor
                </Button>
              </div>
            </CardContent>
          ) : alreadyCheckedIn ? (
            <CardContent className="text-center py-10 px-4 sm:px-8 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <XCircle className="h-9 w-9 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  VISITOR ALREADY CHECKED IN
                </h2>
                <p className="text-sm text-slate-600 font-medium">{selectedVisitor.full_name}</p>
                <p className="text-xs text-slate-500">
                  Already checked in at{' '}
                  <span className="font-semibold text-slate-700">
                    {selectedVisitor.checkInData?.check_in_time
                      ? new Date(selectedVisitor.checkInData.check_in_time).toLocaleTimeString()
                      : 'Earlier today'}
                  </span>
                  {selectedVisitor.checkInData?.checked_in_by && (
                    <span> by {selectedVisitor.checkInData.checked_in_by}</span>
                  )}
                </p>
              </div>

              <div className="pt-4 max-w-sm mx-auto">
                <Button
                  onClick={resetSearch}
                  className="w-full bg-[#123B70] hover:bg-[#0d2d52] h-11 text-sm font-bold rounded-xl shadow-xs transition"
                >
                  Check In Another Visitor
                </Button>
              </div>
            </CardContent>
          ) : (
            <div>
              {/* Header */}
              <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#123B70]/10 text-[#123B70] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Verify Visitor Credentials
                    </h2>
                    <p className="text-[11px] text-slate-500">Confirm visitor information before completing check-in</p>
                  </div>
                </div>

                <Badge
                  className={`${
                    selectedVisitor.check_in_status === 'CHECKED_IN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-[#123B70] border-blue-200'
                  } text-xs font-semibold`}
                >
                  {selectedVisitor.check_in_status === 'CHECKED_IN' ? 'Already Checked In' : 'Ready For Clearance'}
                </Badge>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* 2-Column Responsive Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Visitor Identity */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-[#123B70]" />
                      <span>Visitor Profile</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Full Name</span>
                        <span className="font-bold text-slate-900">{selectedVisitor.full_name}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Visitor Pass ID</span>
                        <span className="font-mono font-bold text-[#123B70]">{selectedVisitor.registration_code}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Phone Number</span>
                        <span className="font-medium text-slate-800">{selectedVisitor.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Organization</span>
                        <span className="font-medium text-slate-800">{selectedVisitor.organisation || 'Personal'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Location</span>
                        <span className="font-medium text-slate-800">{selectedVisitor.location || 'N/A'}</span>
                      </div>
                      {selectedVisitor.vehicle_registration && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Car className="w-3 h-3 text-slate-400" />
                            Vehicle Reg
                          </span>
                          <span className="font-bold text-slate-900 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            {selectedVisitor.vehicle_registration}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Host & Destination */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5 text-[#123B70]" />
                      <span>Host & Visit Authorization</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Host Officer</span>
                        <span className="font-bold text-slate-900">{selectedVisitor.host_name || 'General Reception'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Department</span>
                        <span className="font-medium text-slate-800">{selectedVisitor.host_department || 'General'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Purpose of Visit</span>
                        <span className="font-medium text-slate-800">{selectedVisitor.visit_purpose || 'Official'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Visitor Type</span>
                        <span className="font-medium text-slate-800">
                          {selectedVisitor.is_recurring ? 'Recurring Visitor' : 'Standard Visitor'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">Gate Authorization</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Authorized
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <Button
                    onClick={() => handleCheckIn(selectedVisitor)}
                    disabled={loading || selectedVisitor.check_in_status === 'CHECKED_IN'}
                    className="flex-1 bg-[#123B70] hover:bg-[#0d2d52] h-11 text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{loading ? 'Processing Clearance...' : 'Confirm & Check In'}</span>
                  </Button>
                  <Button
                    onClick={() => setSelectedVisitor(null)}
                    variant="outline"
                    className="h-11 text-sm font-semibold rounded-xl border-slate-200 hover:bg-slate-100"
                  >
                    Back to Results
                  </Button>
                </div>
              </CardContent>
            </div>
          )}
        </Card>
      )}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <Card className="max-w-lg w-full rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
            <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#123B70]/10 text-[#123B70] flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add Walk-In Visitor</h2>
                  <p className="text-xs text-slate-500">Register and check in unscheduled guests at reception</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWalkInModal(false);
                  setWalkInData({ fullName: '', organisation: '', position: '', phone: '', isRecurring: false });
                  setError('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={(e) => handleWalkInSubmit(e, false)} className="space-y-3.5">
                <div>
                  <Label htmlFor="walkInName" className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="walkInName"
                    type="text"
                    required
                    placeholder="e.g. Samuel K. Mensah"
                    value={walkInData.fullName}
                    onChange={(e) => setWalkInData({ ...walkInData, fullName: e.target.value })}
                    className="h-10 text-sm rounded-xl border-slate-200 focus-visible:ring-[#123B70]/20 focus-visible:border-[#123B70]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="walkInOrg" className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-700">
                      Organisation <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="walkInOrg"
                      type="text"
                      required
                      placeholder="e.g. Bank of Ghana"
                      value={walkInData.organisation}
                      onChange={(e) => setWalkInData({ ...walkInData, organisation: e.target.value })}
                      className="h-10 text-sm rounded-xl border-slate-200 focus-visible:ring-[#123B70]/20 focus-visible:border-[#123B70]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="walkInPosition" className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-700">
                      Position / Role
                    </Label>
                    <Input
                      id="walkInPosition"
                      type="text"
                      placeholder="e.g. Operations Officer"
                      value={walkInData.position}
                      onChange={(e) => setWalkInData({ ...walkInData, position: e.target.value })}
                      className="h-10 text-sm rounded-xl border-slate-200 focus-visible:ring-[#123B70]/20 focus-visible:border-[#123B70]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="walkInPhone" className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-700">
                    Contact Phone Number
                  </Label>
                  <Input
                    id="walkInPhone"
                    type="tel"
                    placeholder="e.g. +233 24 000 0000"
                    value={walkInData.phone}
                    onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                    className="h-10 text-sm rounded-xl border-slate-200 focus-visible:ring-[#123B70]/20 focus-visible:border-[#123B70]"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={walkInData.isRecurring}
                    onChange={(e) => setWalkInData({ ...walkInData, isRecurring: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#123B70] focus:ring-[#123B70]"
                  />
                  <Label htmlFor="isRecurring" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Mark as Recurring Visitor (Contractor, Frequent Delegate)
                  </Label>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={(e) => handleWalkInSubmit(e, true)}
                    disabled={loading}
                    className="flex-1 bg-[#123B70] hover:bg-[#0d2d52] h-10 text-xs sm:text-sm font-bold rounded-xl transition shadow-xs"
                  >
                    {loading ? 'Processing...' : 'Register & Check In'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="outline"
                    className="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
                  >
                    Register Only
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
