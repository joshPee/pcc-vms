'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LogIn,
  QrCode,
  Car,
  ArrowRight,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export default function GuardPortalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Auto-detect Shift based on current time
  const currentShift = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'Day Shift' : 'Night Shift';
  }, []);

  const isDay = currentShift === 'Day Shift';

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/admin/login');
    }
  }, [status, router]);

  // Fetch active visitors count
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/active-visitors?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const activeOnly = data.filter((v: any) => v.check_in_status === 'CHECKED_IN');
            setActiveCount(activeOnly.length);
            const vehicles = activeOnly.filter((v: any) => !!v.vehicle_registration).length;
            setVehicleCount(vehicles);
          }
        }
      } catch (err) {
        console.error('Failed to fetch guard portal stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const guardName = session?.user?.name || 'Security Officer';
  const guardShift = (session?.user as any)?.shift || currentShift;
  const initials = guardName
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isAdminOrSupervisor =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'supervisor' ||
    session?.user?.role === 'sector_head';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#123B70] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100 flex flex-col justify-between selection:bg-[#E5A823] selection:text-white">
      {/* Top Security Gate Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Gate Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              <img src="/pcc.png" alt="PCC Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-[#123B70] tracking-tight uppercase">PCC Gate Station</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Main Gate
                </span>
              </div>
            </div>
          </div>

          {/* Profile Icon Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
              aria-label="Profile menu"
            >
              <div className="w-7 h-7 rounded-full bg-[#123B70] text-white flex items-center justify-center text-xs font-black shrink-0">
                {initials}
              </div>
              <div className="text-left hidden xs:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{guardName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-none flex items-center gap-1">
                  {isDay ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-indigo-500" />}
                  {guardShift}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{guardName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{session?.user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#123B70] border border-blue-200">
                      {isDay ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                      {guardShift}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/admin/login' })}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out of Duty
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Station Controls */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 sm:py-7 flex flex-col justify-center space-y-5">
        {/* Guard Shift Status Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Duty</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                isDay ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isDay ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                {guardShift}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">{guardName}</p>
            <p className="text-xs text-slate-500">{currentDate || 'Today'} • {currentTime || '--:--'}</p>
          </div>

          <div className="text-right border-l border-slate-100 pl-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              On Premises
            </span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 leading-none">
                {activeCount !== null ? activeCount : '...'}
              </span>
              <span className="text-xs text-slate-500 font-medium">visitors</span>
            </div>
            {vehicleCount !== null && (
              <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1 font-medium">
                <Car className="w-3 h-3 text-slate-400" />
                {vehicleCount} vehicles
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3.5">
          {/* Action 1: Gate Check-In → Landing Page */}
          <Link
            href="/"
            className="group block bg-[#123B70] hover:bg-[#0d2d52] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-[#123B70]/15 transition-all duration-200 active:scale-[0.99] border border-[#123B70]/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[10.5px] font-bold uppercase tracking-wider text-amber-300/90 mb-0.5">
                    Gate Entry
                  </span>
                  <h2 className="text-lg sm:text-xl font-black leading-tight text-white tracking-tight">
                    Visitor Check-In
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100/80 mt-1 line-clamp-1">
                    Lookup pass code, verify host, or add walk-in attendee
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition text-white">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Action 2: Gate Check-Out (Camera QR Scanner) */}
          <Link
            href="/check-out"
            className="group block bg-white hover:bg-slate-50 border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs transition-all duration-200 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#123B70] group-hover:scale-105 transition">
                  <QrCode className="w-7 h-7 sm:w-8 sm:h-8 text-[#123B70]" />
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Exit Clearance
                  </span>
                  <h2 className="text-lg sm:text-xl font-black leading-tight text-slate-900 tracking-tight">
                    Visitor Check-Out
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">
                    Scan badge QR with camera or enter pass code
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition">
                <ArrowRight className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Dashboard Switcher (Visible to supervisors/admins only) */}
        {isAdminOrSupervisor && (
          <div className="pt-2">
            <Link
              href="/admin/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-[#123B70]" />
              <span>Switch to Admin Management Dashboard →</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p className="font-semibold text-slate-700">Pentecost Convention Centre</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Gate Security Operations • {guardName} • {guardShift}
        </p>
      </footer>
    </div>
  );
}
