'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Clock,
  MapPin,
  Users,
  LogIn,
  LogOut,
  Home,
  User,
  Search,
  X,
  Car,
  ChevronRight,
  Shield,
  LayoutDashboard,
  Building,
  CheckCircle2,
} from 'lucide-react';

export default function GuardPortalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'visitors' | 'profile'>('home');
  const [profileOpen, setProfileOpen] = useState(false);

  // Time & date
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Auto-detect shift or read assigned shift from user session
  const assignedShift = (session?.user as any)?.shift;
  const currentShift = useMemo(() => {
    if (assignedShift === 'night') return 'Night Shift';
    if (assignedShift === 'day') return 'Day Shift';
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'Day Shift' : 'Night Shift';
  }, [assignedShift]);

  const shiftHours = currentShift === 'Night Shift' ? '18:00 – 06:00' : '06:00 – 18:00';

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/admin/login');
    }
  }, [status, router]);

  // Fetch active visitors stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/active-visitors?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const activeOnly = data.filter((v: any) => v.check_in_status === 'CHECKED_IN');
          setActiveVisitors(activeOnly);
          setActiveCount(activeOnly.length);
        }
      }
    } catch (err) {
      console.error('Failed to fetch guard portal stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 12000);
    return () => clearInterval(interval);
  }, []);

  const guardName = session?.user?.name || 'Gate Officer';
  const roleDisplay =
    session?.user?.role === 'admin'
      ? 'System Admin'
      : session?.user?.role === 'supervisor'
      ? 'Shift Supervisor'
      : 'Gate Guard';

  const initials = guardName
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GG';

  const isAdminOrSupervisor =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'supervisor' ||
    session?.user?.role === 'sector_head';

  const filteredVisitors = activeVisitors.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.full_name && v.full_name.toLowerCase().includes(q)) ||
      (v.host_name && v.host_name.toLowerCase().includes(q)) ||
      (v.registration_code && v.registration_code.toLowerCase().includes(q)) ||
      (v.vehicle_registration && v.vehicle_registration.toLowerCase().includes(q)) ||
      (v.organisation && v.organisation.toLowerCase().includes(q))
    );
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1E36]">
        <div className="w-9 h-9 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF0F5] sm:py-6 flex justify-center selection:bg-amber-400 selection:text-slate-900 font-sans">
      {/* Mobile container that mirrors mobile app shell */}
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen sm:min-h-[844px] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-300/60 overflow-hidden flex flex-col justify-between relative">
        
        {/* Top Dark Navy Branded App Header */}
        <div className="bg-[#0B1E36] pt-6 pb-9 px-5 text-white">
          <div className="flex items-center justify-between">
            {/* Logo + Titles */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-[#0B1E36] text-sm tracking-tight shrink-0 p-1">
                <img src="/pcc.png" alt="PCC" className="w-full h-full object-contain" onError={(e) => {
                  // Fallback to text if image not found
                  (e.target as HTMLElement).style.display = 'none';
                }} />
                <span className="pcc-text-fallback hidden font-black text-xs text-[#0B1E36]">PCC</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white leading-tight tracking-tight">
                  Pentecost Convention Centre
                </h1>
                <p className="text-xs text-blue-200/80 font-medium">
                  Visitor Management
                </p>
              </div>
            </div>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-white shrink-0"
              aria-label="Guard Profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-4 -mt-5 space-y-3.5 pb-24 z-10 overflow-y-auto">
          {/* Card 1: Guard Duty Card */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-2px_rgba(11,30,54,0.08)] border border-slate-100">
            {/* Guard Info Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-13 h-13 rounded-full bg-[#0E5466] text-white flex items-center justify-center text-lg font-black shrink-0 shadow-inner">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400">Welcome back</p>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-snug truncate">
                    {guardName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{roleDisplay}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  On duty
                </span>
              </div>
            </div>

            {/* Shift & Duty Point Pills */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100">
              {/* Shift Pill */}
              <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-700 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Shift
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block">
                    {currentShift}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {shiftHours}
                  </span>
                </div>
              </div>

              {/* Duty Point Pill */}
              <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B1E36] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#0B1E36]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Duty point
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block">
                    Main Gate
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    Active Station
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Live Visitors on Premises */}
          <button
            onClick={() => setActiveTab('visitors')}
            className="w-full text-left bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(11,30,54,0.06)] border border-slate-100 flex items-center justify-between hover:border-slate-200 transition active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                    LIVE
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                  Visitors on premises
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#0B1E36] tracking-tight">
                {activeCount !== null ? activeCount : '...'}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          {/* Card 3: Two Big Primary Action Cards (Side-by-side) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Action 1: Check In */}
            <Link
              href="/"
              className="bg-[#007A4D] hover:bg-[#006C44] active:scale-[0.98] transition-all duration-150 rounded-3xl p-4 sm:p-5 text-white flex flex-col justify-between aspect-[3/4] min-h-[200px] shadow-lg shadow-[#007A4D]/25 relative overflow-hidden group"
            >
              {/* Subtle decorative glow */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

              {/* Top-left entrance arrow icon box */}
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-105 transition">
                <LogIn className="w-6 h-6" />
              </div>

              {/* Bottom text */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                  Check In
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-1 leading-snug">
                  Log an arriving visitor
                </p>
              </div>
            </Link>

            {/* Action 2: Check Out */}
            <Link
              href="/check-out"
              className="bg-[#B84A0A] hover:bg-[#A33F06] active:scale-[0.98] transition-all duration-150 rounded-3xl p-4 sm:p-5 text-white flex flex-col justify-between aspect-[3/4] min-h-[200px] shadow-lg shadow-[#B84A0A]/25 relative overflow-hidden group"
            >
              {/* Subtle decorative glow */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

              {/* Top-left exit arrow icon box */}
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-105 transition">
                <LogOut className="w-6 h-6" />
              </div>

              {/* Bottom text */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                  Check Out
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-100 font-medium mt-1 leading-snug">
                  Log a departing visitor
                </p>
              </div>
            </Link>
          </div>

          {/* Supervisor / Admin quick switch (if applicable) */}
          {isAdminOrSupervisor && (
            <div className="pt-1">
              <Link
                href="/admin/dashboard"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition"
              >
                <LayoutDashboard className="w-4 h-4 text-[#0B1E36]" />
                <span>Admin Management Dashboard</span>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 z-20 flex items-center justify-around">
          {/* Home Tab */}
          <button
            onClick={() => {
              setActiveTab('home');
              setProfileOpen(false);
            }}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'home' && !profileOpen
                ? 'text-[#0B1E36] font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <Home className="w-5 h-5" />
              {activeTab === 'home' && !profileOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0B1E36]" />
              )}
            </div>
            <span className="text-[11px]">Home</span>
          </button>

          {/* Visitors Tab */}
          <button
            onClick={() => {
              setActiveTab('visitors');
              setProfileOpen(false);
            }}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'visitors' && !profileOpen
                ? 'text-[#0B1E36] font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {activeCount !== null && activeCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
            <span className="text-[11px]">Visitors</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => {
              setProfileOpen(true);
            }}
            className={`flex flex-col items-center gap-1 transition ${
              profileOpen
                ? 'text-[#0B1E36] font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px]">Profile</span>
          </button>
        </nav>

        {/* Visitors Overlay Sheet */}
        {activeTab === 'visitors' && !profileOpen && (
          <div className="absolute inset-0 bg-[#F4F6F9] z-30 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-[#0B1E36] text-white pt-6 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">Visitors on Premises</h2>
                  <p className="text-xs text-blue-200/80">
                    {activeVisitors.length} currently checked in
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3.5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, code, vehicle, host..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Visitors List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24">
              {filteredVisitors.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-600">No visitors found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {searchQuery ? 'Try matching another name or code' : 'No active visitors currently on premises'}
                  </p>
                </div>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {visitor.full_name}
                        </p>
                        {visitor.vehicle_registration && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            <Car className="w-3 h-3 text-slate-500" />
                            {visitor.vehicle_registration}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Host: <span className="font-semibold text-slate-700">{visitor.host_name || 'N/A'}</span>
                        {visitor.organisation ? ` • ${visitor.organisation}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        In: {visitor.check_in_date ? new Date(visitor.check_in_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </p>
                    </div>

                    <Link
                      href="/check-out"
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Checkout
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Profile Modal / Drawer */}
        {profileOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex flex-col justify-end animate-in fade-in duration-150">
            <div className="bg-white rounded-t-[32px] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Guard Profile</span>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guard Avatar & Basic info */}
              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-14 h-14 rounded-full bg-[#0E5466] text-white flex items-center justify-center text-xl font-black shrink-0">
                  {initials}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{guardName}</h3>
                  <p className="text-xs text-slate-500">{session?.user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B1E36] border border-blue-200">
                    <Shield className="w-3 h-3 text-[#0B1E36]" />
                    {roleDisplay}
                  </span>
                </div>
              </div>

              {/* Duty Details */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Shift</span>
                  <span className="font-bold text-slate-900">{currentShift} ({shiftHours})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Post</span>
                  <span className="font-bold text-slate-900">Main Gate - Terminal 1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duty Date</span>
                  <span className="font-bold text-slate-900">{currentDate || 'Today'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Station Time</span>
                  <span className="font-mono font-bold text-emerald-700">{currentTime || '--:--'}</span>
                </div>
              </div>

              {/* Admin Dashboard button */}
              {isAdminOrSupervisor && (
                <Link
                  href="/admin/dashboard"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0B1E36]" />
                  <span>Go to Admin Dashboard</span>
                </Link>
              )}

              {/* Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold border border-rose-200 transition active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / End Shift
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
