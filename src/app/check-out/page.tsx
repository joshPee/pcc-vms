'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ShieldCheck,
  Search,
  LogOut,
  QrCode,
  Users,
  Clock,
  Car,
  Building,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Check,
  MapPin,
  FileCheck,
  Volume2,
  VolumeX,
  Hash,
  X,
  Camera,
  Filter,
  Phone,
  Briefcase,
  AlertCircle,
  Shield,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

// Dynamically import the camera scanner to prevent SSR issues
const GuardQrScanner = dynamic(() => import('@/components/GuardQrScanner'), {
  ssr: false,
  loading: () => (
    <div className="h-48 sm:h-56 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs">
      Loading camera scanner...
    </div>
  ),
});

const DEFAULT_GATE = 'Main Gate';

export default function VisitorCheckOutPage() {
  const [visitorCode, setVisitorCode] = useState('');
  const [activeTab, setActiveTab] = useState<'checkout' | 'directory' | 'log'>('checkout');
  const [showScanner, setShowScanner] = useState(false);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckOut, setLastCheckOut] = useState<any>(null);
  const [recentDepartures, setRecentDepartures] = useState<any[]>([]);

  // Guard Duty Settings
  const [gateStation, setGateStation] = useState<string>(DEFAULT_GATE);
  const [guardName, setGuardName] = useState<string>('Security Officer');
  const [isEditingGuard, setIsEditingGuard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Security Clearance Checklist for Selected Visitor in Code tab
  const [badgeReturned, setBadgeReturned] = useState(true);
  const [vehicleInspected, setVehicleInspected] = useState(false);
  const [exitNotes, setExitNotes] = useState('');

  // On-Site Section Specific State
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'vehicles' | 'overstay'>('all');
  const [onSiteModalVisitor, setOnSiteModalVisitor] = useState<any | null>(null);
  const [onSiteBadgeReturned, setOnSiteBadgeReturned] = useState(true);
  const [onSiteVehicleInspected, setOnSiteVehicleInspected] = useState(false);
  const [onSiteNotes, setOnSiteNotes] = useState('');
  const [onSiteGateStation, setOnSiteGateStation] = useState(DEFAULT_GATE);
  const [onSiteSubmitting, setOnSiteSubmitting] = useState(false);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Audio synthesizer tone for instant feedback without external mp3s
  const playSound = useCallback((type: 'success' | 'warning') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'success') {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880, now + 0.1); // A5
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.1); // D6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } else {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(164.81, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio not permitted or user hasn't interacted
    }
  }, [soundEnabled]);

  // Load persisted guard settings from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGuard = localStorage.getItem('pcc_guard_name');
      const savedStation = localStorage.getItem('pcc_gate_station');
      if (savedGuard) setGuardName(savedGuard);
      if (savedStation) {
        setGateStation(savedStation);
        setOnSiteGateStation(savedStation);
      }
    }
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus input on initial mount
  useEffect(() => {
    if (activeTab === 'checkout' && !selectedVisitor) {
      codeInputRef.current?.focus();
    }
  }, [activeTab, selectedVisitor]);

  // Fetch active visitors on premises
  const fetchActiveVisitors = useCallback(async () => {
    setActiveLoading(true);
    try {
      const res = await fetch(`/api/active-visitors?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const activeOnly = Array.isArray(data)
          ? data.filter((v: any) => v.check_in_status === 'CHECKED_IN')
          : [];
        setActiveVisitors(activeOnly);
        setActiveCount(activeOnly.length);
      }
    } catch (err) {
      console.error('Failed to fetch active visitors:', err);
    } finally {
      setActiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveVisitors]);

  // Calculate minutes / hours on site
  const calculateMinutesOnSite = (checkInDate?: string) => {
    if (!checkInDate) return null;
    const start = new Date(checkInDate).getTime();
    const now = Date.now();
    const diffMins = Math.max(0, Math.floor((now - start) / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m on site`;
    return `${hours}h ${mins}m on site`;
  };

  const getMinutesDifference = (checkInDate?: string) => {
    if (!checkInDate) return 0;
    const start = new Date(checkInDate).getTime();
    return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60)));
  };

  // Filtered on-site visitors
  const filteredActiveVisitors = useMemo(() => {
    return activeVisitors.filter((visitor) => {
      // 1. Search query filter
      if (directorySearch.trim()) {
        const q = directorySearch.toLowerCase().trim();
        const matchesName = visitor.full_name?.toLowerCase().includes(q);
        const matchesCode = visitor.registration_code?.toLowerCase().includes(q);
        const matchesVehicle = visitor.vehicle_registration?.toLowerCase().includes(q);
        const matchesOrg = visitor.organisation?.toLowerCase().includes(q);
        const matchesHost = visitor.host_name?.toLowerCase().includes(q);
        const matchesPhone = visitor.phone?.toLowerCase().includes(q);

        if (!matchesName && !matchesCode && !matchesVehicle && !matchesOrg && !matchesHost && !matchesPhone) {
          return false;
        }
      }

      // 2. Chip filter
      if (directoryFilter === 'vehicles') {
        return !!visitor.vehicle_registration;
      }
      if (directoryFilter === 'overstay') {
        return getMinutesDifference(visitor.check_in_date) >= 120; // 2+ hours
      }

      return true;
    });
  }, [activeVisitors, directorySearch, directoryFilter]);

  // Count visitors with vehicles
  const vehiclesOnSiteCount = useMemo(() => {
    return activeVisitors.filter((v) => !!v.vehicle_registration).length;
  }, [activeVisitors]);

  // Count overstay visitors (>2 hours)
  const overstayCount = useMemo(() => {
    return activeVisitors.filter((v) => getMinutesDifference(v.check_in_date) >= 120).length;
  }, [activeVisitors]);

  // Handle searching / verifying a code entered by the guard
  const handleVerifyCode = async (codeToVerify?: string) => {
    const raw = (codeToVerify || visitorCode).trim();
    if (!raw) return;

    let clean = raw.toUpperCase();
    if (/^\d{4}$/.test(clean)) {
      clean = `CTS-${clean}`;
    }

    setLoading(true);
    setError(null);
    setSelectedVisitor(null);

    try {
      // 1. Check local active visitors first for zero-latency response
      const cleanUpper = clean.toUpperCase();
      const match = activeVisitors.find((v) => {
        const reg = (v.registration_code || '').toUpperCase();
        const veh = (v.vehicle_registration || '').toUpperCase();
        const name = (v.full_name || '').toUpperCase();
        return (
          reg === cleanUpper ||
          reg.replace('-', '') === cleanUpper.replace('-', '') ||
          veh === cleanUpper ||
          veh.replace(/\s+/g, '') === cleanUpper.replace(/\s+/g, '') ||
          name.includes(cleanUpper)
        );
      });

      if (match) {
        setSelectedVisitor(match);
        setVehicleInspected(false);
        setBadgeReturned(true);
        playSound('success');
        setLoading(false);
        return;
      }

      // 2. Fetch from participants search endpoint with fresh query
      const res = await fetch(
        `/api/participants/search?q=${encodeURIComponent(clean)}&checkInStatus=CHECKED_IN&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const checkedInVisitor = data.find((v: any) => v.check_in_status === 'CHECKED_IN');
        if (checkedInVisitor) {
          setSelectedVisitor(checkedInVisitor);
          setVehicleInspected(false);
          setBadgeReturned(true);
          playSound('success');
        } else {
          setError(`Visitor "${clean}" has already been checked out.`);
          playSound('warning');
        }
      } else {
        setError(`No checked-in visitor found matching "${clean}". Please verify the code or check On-Site directory.`);
        playSound('warning');
      }
    } catch (err) {
      console.error(err);
      setError('Error verifying visitor code. Please check connection.');
      playSound('warning');
    } finally {
      setLoading(false);
    }
  };

  // Perform checkout from Code tab
  const handleExecuteCheckOut = async () => {
    if (!selectedVisitor) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationCode: selectedVisitor.registration_code,
          gateStation,
          guardName,
          badgeReturned,
          vehicleInspected,
          notes: exitNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyCheckedOut) {
          setError(`${selectedVisitor.full_name} is already checked out.`);
        } else {
          setError(data.error || 'Check-out process failed.');
        }
        playSound('warning');
      } else {
        playSound('success');
        const completed = {
          ...selectedVisitor,
          check_out_time: data.check_out_time,
          duration_minutes: data.duration_minutes,
          gate_station: gateStation,
          guard_name: guardName,
        };

        setLastCheckOut(completed);
        setRecentDepartures((prev) => [completed, ...prev.slice(0, 19)]);

        // Remove from active list immediately (safe string id and code comparison)
        const vId = String(selectedVisitor.id);
        const vCode = selectedVisitor.registration_code;
        setActiveVisitors((prev) =>
          prev.filter((v) => String(v.id) !== vId && v.registration_code !== vCode)
        );
        setActiveCount((prev) => Math.max(0, prev - 1));

        // Refresh active visitors from server to ensure sync
        fetchActiveVisitors();

        // Reset state
        setSelectedVisitor(null);
        setVisitorCode('');
        setExitNotes('');
        setVehicleInspected(false);
        setTimeout(() => {
          codeInputRef.current?.focus();
        }, 150);
      }
    } catch (err) {
      console.error(err);
      setError('Network communication error while checking out.');
      playSound('warning');
    } finally {
      setLoading(false);
    }
  };

  // Open Direct Check-Out Modal from On-Site section
  const openOnSiteCheckOutModal = (visitor: any) => {
    setOnSiteModalVisitor(visitor);
    setOnSiteBadgeReturned(true);
    setOnSiteVehicleInspected(false);
    setOnSiteNotes('');
    setOnSiteGateStation(gateStation);
    setError(null);
  };

  // Execute Direct Check-Out from On-Site Modal
  const handleDirectOnSiteCheckOut = async () => {
    if (!onSiteModalVisitor) return;

    setOnSiteSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationCode: onSiteModalVisitor.registration_code,
          gateStation: onSiteGateStation,
          guardName,
          badgeReturned: onSiteBadgeReturned,
          vehicleInspected: onSiteVehicleInspected,
          notes: onSiteNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyCheckedOut) {
          setError(`${onSiteModalVisitor.full_name} is already checked out.`);
        } else {
          setError(data.error || 'Check-out process failed.');
        }
        playSound('warning');
      } else {
        playSound('success');
        const completed = {
          ...onSiteModalVisitor,
          check_out_time: data.check_out_time,
          duration_minutes: data.duration_minutes,
          gate_station: onSiteGateStation,
          guard_name: guardName,
        };

        setLastCheckOut(completed);
        setRecentDepartures((prev) => [completed, ...prev.slice(0, 19)]);

        // Optimistically remove from on-site list (safe string id and code comparison)
        const modalVisitorId = String(onSiteModalVisitor.id);
        const modalVisitorCode = onSiteModalVisitor.registration_code;
        setActiveVisitors((prev) =>
          prev.filter((v) => String(v.id) !== modalVisitorId && v.registration_code !== modalVisitorCode)
        );
        setActiveCount((prev) => Math.max(0, prev - 1));

        // Close modal
        setOnSiteModalVisitor(null);

        // Refresh active visitors from server to ensure sync
        fetchActiveVisitors();
      }
    } catch (err) {
      console.error(err);
      setError('Network error while executing check-out.');
      playSound('warning');
    } finally {
      setOnSiteSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#C89B3C] selection:text-white">
      {/* Top Security Header - Clean Minimal Single Row */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Left: PCC Logo + Title + Main Gate Live Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200/80 transition group-hover:scale-105">
                <img src="/pcc.png" alt="PCC" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase truncate">
                  Check-Out
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Main Gate</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Right Controls: Officer + Clock + Sound Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Officer Name Pill (Compact, click to edit) */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-lg px-2 py-1 text-xs transition">
              <ShieldCheck className="w-3.5 h-3.5 text-[#123B70] shrink-0" />
              {isEditingGuard ? (
                <input
                  type="text"
                  value={guardName}
                  onChange={(e) => setGuardName(e.target.value)}
                  onBlur={() => {
                    setIsEditingGuard(false);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('pcc_guard_name', guardName);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingGuard(false);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('pcc_guard_name', guardName);
                      }
                    }
                  }}
                  autoFocus
                  className="bg-white text-slate-900 px-1 py-0.5 rounded border border-[#123B70] text-xs w-28"
                />
              ) : (
                <span
                  onClick={() => setIsEditingGuard(true)}
                  className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer text-[11px]"
                  title="Click to edit officer name"
                >
                  {guardName}
                </span>
              )}
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
              <Clock className="w-3 h-3 text-[#C89B3C] shrink-0" />
              <span className="font-semibold">{currentTime || '--:--'}</span>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition"
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 lg:p-8 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Navigation Tabs Bar - Fully Responsive for Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('checkout');
                setTimeout(() => codeInputRef.current?.focus(), 100);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'checkout'
                  ? 'bg-[#123B70] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Enter Code</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('directory');
                fetchActiveVisitors();
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'directory'
                  ? 'bg-[#123B70] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>On-Site</span>
              <span
                className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'directory' ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'log'
                  ? 'bg-[#123B70] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Shift Log</span>
              {recentDepartures.length > 0 && (
                <span
                  className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'log' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {recentDepartures.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeCount} visitors currently checked in</span>
          </div>
        </div>

        {/* Check-Out Success Banner */}
        {lastCheckOut && (
          <div className="bg-gradient-to-r from-emerald-50 via-emerald-100 to-slate-50 border-2 border-emerald-400 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-300">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-emerald-200 text-emerald-900 font-extrabold border border-emerald-300">
                    {lastCheckOut.registration_code}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    Checked Out Successfully
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 truncate">
                  {lastCheckOut.participant_name || lastCheckOut.full_name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  {lastCheckOut.organisation ? `${lastCheckOut.organisation} • ` : ''}
                  {lastCheckOut.duration_minutes ? `${lastCheckOut.duration_minutes}m on site` : 'Completed'} •{' '}
                  {lastCheckOut.gate_station}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setLastCheckOut(null);
                  if (activeTab === 'checkout') {
                    codeInputRef.current?.focus();
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3 sm:p-4 flex items-start justify-between gap-3 text-rose-800 text-xs sm:text-sm shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-900 p-1 font-bold shrink-0 text-base"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: Enter Visitor Code (Primary Workflow)
            ========================================================================= */}
        {activeTab === 'checkout' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            {/* On mobile: If visitor is selected, show visitor clearance card FIRST! */}

            {/* Left Box: Code Entry & Camera Option (7 cols on desktop) */}
            <div
              className={`w-full lg:col-span-7 space-y-3 sm:space-y-4 ${
                selectedVisitor ? 'order-2 lg:order-1' : 'order-1'
              }`}
            >
              {/* Main Code Input Card */}
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
                      Lookup Visitor For Check-Out
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Enter code (e.g. <span className="text-[#C89B3C] font-mono font-bold">CTS-1234</span> or{' '}
                      <span className="font-mono font-semibold">1234</span>), name, or vehicle plate
                    </p>
                  </div>

                  <button
                    onClick={() => setShowScanner(!showScanner)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 hover:text-slate-900 transition font-semibold border border-slate-200 w-full sm:w-auto justify-center min-h-[42px]"
                  >
                    <Camera className="w-4 h-4 text-[#C89B3C]" />
                    <span>{showScanner ? 'Hide Camera' : 'Scan QR'}</span>
                  </button>
                </div>

                {/* Camera Scanner Expandable */}
                {showScanner && (
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <GuardQrScanner
                      active={showScanner}
                      onScanSuccess={(decodedText) => {
                        setVisitorCode(decodedText);
                        handleVerifyCode(decodedText);
                        setShowScanner(false);
                      }}
                      onScanError={() => {}}
                    />
                  </div>
                )}

                {/* Form to submit code */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyCode();
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <div className="relative">
                      <Hash className="w-5 h-5 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={visitorCode}
                        onChange={(e) => setVisitorCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CTS-7479, 7479, or plate"
                        className="w-full bg-white border-2 border-slate-300 focus:border-[#123B70] focus:ring-2 focus:ring-[#123B70]/20 rounded-2xl pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 text-base sm:text-xl font-mono font-bold text-slate-900 placeholder-slate-400 tracking-wider focus:outline-none transition"
                      />
                      {visitorCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setVisitorCode('');
                            setSelectedVisitor(null);
                            codeInputRef.current?.focus();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-1 rounded-full hover:bg-slate-100"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Suggestions & Chips from currently active visitors */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                      <span className="text-[11px] text-slate-400 font-semibold mr-0.5">Quick:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorCode('CTS-');
                          codeInputRef.current?.focus();
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#C89B3C] font-mono font-bold border border-slate-200 transition text-[11px]"
                      >
                        + CTS-
                      </button>

                      {activeVisitors.slice(0, 3).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setVisitorCode(v.registration_code);
                            setSelectedVisitor(v);
                            setVehicleInspected(false);
                            setBadgeReturned(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-medium border border-slate-200 transition text-[11px] truncate max-w-[140px]"
                          title={`${v.full_name} (${v.registration_code})`}
                        >
                          {v.full_name?.split(' ')[0]} ({v.registration_code})
                        </button>
                      ))}

                      {activeVisitors.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('directory')}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition text-[11px]"
                        >
                          +{activeVisitors.length - 3} more on site →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading || !visitorCode.trim()}
                      className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-[#123B70] hover:bg-[#0d2d52] text-white font-extrabold text-xs sm:text-sm tracking-wide transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 min-h-[46px]"
                    >
                      {loading ? (
                        <span>Searching...</span>
                      ) : (
                        <>
                          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Lookup Visitor</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Helpful prompt */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Enter visitor code or license plate</span>
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View all {activeCount} on site</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Box: Visitor Details & Checkout Action (5 cols on desktop) */}
            <div
              className={`w-full lg:col-span-5 ${
                selectedVisitor ? 'order-1 lg:order-2' : 'order-2'
              }`}
            >
              {selectedVisitor ? (
                <div className="bg-white border-2 border-[#123B70] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden animate-in fade-in duration-200">
                  {/* Top Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4951B]">
                        Verified Active Visitor
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 truncate">
                        {selectedVisitor.full_name}
                      </h3>
                      {selectedVisitor.organisation && (
                        <p className="text-xs text-slate-500 truncate">{selectedVisitor.organisation}</p>
                      )}
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-[#123B70] text-white font-mono font-bold text-xs sm:text-sm tracking-wider shadow-sm shrink-0">
                      {selectedVisitor.registration_code}
                    </div>
                  </div>

                  {/* Visitor Meta Grid */}
                  <div className="space-y-2 text-xs mb-4 divide-y divide-slate-100">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Host / Contact</span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[60%]">
                        {selectedVisitor.host_name || 'General Visit'}
                        {selectedVisitor.host_department ? ` (${selectedVisitor.host_department})` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Time on Site</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {calculateMinutesOnSite(selectedVisitor.check_in_date) || 'Just arrived'}
                      </span>
                    </div>

                    {selectedVisitor.vehicle_registration && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Vehicle Plate</span>
                        <span className="font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded border border-amber-500 shadow-xs text-xs">
                          {selectedVisitor.vehicle_registration}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Exit Gate Station</span>
                      <span className="font-semibold text-slate-700">{gateStation}</span>
                    </div>
                  </div>

                  {/* Security Clearance Checklist */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-200 mb-4 space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Exit Clearance Checklist</span>
                    </p>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 font-medium">
                      <input
                        type="checkbox"
                        checked={badgeReturned}
                        onChange={(e) => setBadgeReturned(e.target.checked)}
                        className="w-4 h-4 rounded text-[#123B70] border-slate-300 bg-white focus:ring-0"
                      />
                      <span>Physical Visitor Badge / Pass Returned</span>
                    </label>

                    {selectedVisitor.vehicle_registration && (
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 font-medium">
                        <input
                          type="checkbox"
                          checked={vehicleInspected}
                          onChange={(e) => setVehicleInspected(e.target.checked)}
                          className="w-4 h-4 rounded text-[#123B70] border-slate-300 bg-white focus:ring-0"
                        />
                        <span>Vehicle Inspected & Cleared at Barrier</span>
                      </label>
                    )}

                    <div>
                      <input
                        type="text"
                        value={exitNotes}
                        onChange={(e) => setExitNotes(e.target.value)}
                        placeholder="Optional exit notes / remarks"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Checkout Action Button */}
                  <div className="space-y-2">
                    <button
                      onClick={handleExecuteCheckOut}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C5222E] to-[#9B1A24] hover:from-[#B01D28] hover:to-[#82151D] text-white font-extrabold text-xs sm:text-sm tracking-wide transition shadow-md shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                    >
                      {loading ? (
                        <span>Processing Check-Out...</span>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>CONFIRM & CHECK OUT VISITOR</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedVisitor(null);
                        setVisitorCode('');
                        codeInputRef.current?.focus();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition min-h-[40px]"
                    >
                      Cancel / Select Different Visitor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-2.5">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-700">Awaiting Visitor Lookup</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Enter code, scan QR pass, or select a visitor from the On-Site list to verify and check out.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: Active Visitors Directory (On-Site Section) - FULLY FUNCTIONAL
            ========================================================================= */}
        {activeTab === 'directory' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Control & Search Bar */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
                      Visitors Currently On Site
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono text-xs font-bold">
                      {activeCount} Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap &ldquo;Check Out&rdquo; on any visitor card for immediate gate clearance
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={fetchActiveVisitors}
                    disabled={activeLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition border border-slate-200 min-h-[40px]"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${activeLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Filter by visitor name, code, vehicle plate, organisation, or host..."
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#123B70] focus:ring-2 focus:ring-[#123B70]/20 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
                {directorySearch && (
                  <button
                    onClick={() => setDirectorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <button
                  onClick={() => setDirectoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 min-h-[34px] ${
                    directoryFilter === 'all'
                      ? 'bg-[#123B70] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>All Visitors</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                    {activeVisitors.length}
                  </span>
                </button>

                <button
                  onClick={() => setDirectoryFilter('vehicles')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 min-h-[34px] ${
                    directoryFilter === 'vehicles'
                      ? 'bg-[#123B70] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>With Vehicles</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                    {vehiclesOnSiteCount}
                  </span>
                </button>

                <button
                  onClick={() => setDirectoryFilter('overstay')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 min-h-[34px] ${
                    directoryFilter === 'overstay'
                      ? 'bg-[#123B70] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Over 2 Hours</span>
                  {overstayCount > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 font-extrabold">
                      {overstayCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* List of Active Visitors */}
            {filteredActiveVisitors.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-xs">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                {directorySearch || directoryFilter !== 'all' ? (
                  <>
                    <h3 className="text-base font-bold text-slate-700">No Matching Visitors Found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      No on-site visitors match your current search or filter criteria. Try clearing the filter.
                    </p>
                    <button
                      onClick={() => {
                        setDirectorySearch('');
                        setDirectoryFilter('all');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                      Reset Filter
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-slate-700">No Visitors Currently On Site</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      All checked-in visitors have departed the premises through the gate checkpoints.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredActiveVisitors.map((visitor) => {
                  const minutesOnSite = getMinutesDifference(visitor.check_in_date);
                  const isLongStay = minutesOnSite >= 180; // 3+ hours

                  return (
                    <div
                      key={visitor.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between gap-3 group relative overflow-hidden"
                    >
                      <div>
                        {/* Top Row: Code Pill + Time On Site Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-extrabold flex items-center gap-1">
                            <Hash className="w-3 h-3 text-[#C89B3C]" />
                            <span>{visitor.registration_code}</span>
                          </span>

                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              isLongStay
                                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{calculateMinutesOnSite(visitor.check_in_date) || 'On Site'}</span>
                          </span>
                        </div>

                        {/* Full Name & Organisation */}
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                          {visitor.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {visitor.organisation || 'Personal Visitor'}
                          {visitor.position ? ` • ${visitor.position}` : ''}
                        </p>

                        {/* Meta Details: Host & Vehicle */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              Host: <span className="font-semibold text-slate-800">{visitor.host_name || 'General'}</span>
                              {visitor.host_department ? ` (${visitor.host_department})` : ''}
                            </span>
                          </div>

                          {visitor.vehicle_registration && (
                            <div className="flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-[11px] text-slate-500">Vehicle:</span>
                              <span className="font-mono text-xs font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded border border-amber-500">
                                {visitor.vehicle_registration}
                              </span>
                            </div>
                          )}

                          {visitor.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{visitor.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        {/* Direct Checkout Button */}
                        <button
                          onClick={() => openOnSiteCheckOutModal(visitor)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#123B70] hover:bg-[#0d2d52] active:bg-[#091f38] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5 min-h-[42px]"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check Out</span>
                        </button>

                        {/* Switch to Code Tab with this visitor preselected */}
                        <button
                          onClick={() => {
                            setVisitorCode(visitor.registration_code);
                            setSelectedVisitor(visitor);
                            setActiveTab('checkout');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200 min-h-[42px] shrink-0"
                          title="Open in Code Tab"
                          aria-label="Open in Code Tab"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: Shift Exit Log
            ========================================================================= */}
        {activeTab === 'log' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <h2 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900">
                  Duty Shift Exit Log
                </h2>
                <p className="text-xs text-slate-500">
                  Visitors processed and cleared during this active duty period
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                {recentDepartures.length} Departed
              </span>
            </div>

            {recentDepartures.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-slate-500 shadow-xs">
                <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">No Check-outs Recorded Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When visitors are checked out via code entry or directly from the on-site list, their exit details will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                {recentDepartures.map((dep, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {dep.registration_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {dep.participant_name || dep.full_name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        {dep.organisation ? `${dep.organisation} • ` : ''}
                        Exit: {dep.gate_station} • Officer: {dep.guard_name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {dep.duration_minutes || '0'}m on site
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-700">
                        {dep.check_out_time
                          ? new Date(dep.check_out_time).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '--:--'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          DIRECT ON-SITE CHECK-OUT MODAL / BOTTOM SHEET
          ========================================================================= */}
      {onSiteModalVisitor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C89B3C]">
                  Direct Exit Clearance
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                  Check Out: {onSiteModalVisitor.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {onSiteModalVisitor.organisation || 'Personal Visit'} • Code:{' '}
                  <span className="font-mono font-bold text-blue-700">
                    {onSiteModalVisitor.registration_code}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setOnSiteModalVisitor(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visit Details Box */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Host:</span>
                <span className="font-semibold">{onSiteModalVisitor.host_name || 'General Visit'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration On Site:</span>
                <span className="font-bold text-emerald-700">
                  {calculateMinutesOnSite(onSiteModalVisitor.check_in_date) || 'Today'}
                </span>
              </div>
              {onSiteModalVisitor.vehicle_registration && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vehicle Plate:</span>
                  <span className="font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded border border-amber-500 text-xs">
                    {onSiteModalVisitor.vehicle_registration}
                  </span>
                </div>
              )}
            </div>

            {/* Security Clearance Checklist */}
            <div className="space-y-2.5">
              <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Security Checklist
              </p>

              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={onSiteBadgeReturned}
                  onChange={(e) => setOnSiteBadgeReturned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#123B70] border-slate-300 focus:ring-0"
                />
                <span>Physical Visitor Pass / Badge Returned</span>
              </label>

              {onSiteModalVisitor.vehicle_registration && (
                <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={onSiteVehicleInspected}
                    onChange={(e) => setOnSiteVehicleInspected(e.target.checked)}
                    className="w-4 h-4 rounded text-[#123B70] border-slate-300 focus:ring-0"
                  />
                  <span>Vehicle Inspected & Cleared at Barrier</span>
                </label>
              )}
            </div>

            {/* Exit Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Exit Notes / Remarks (Optional):
              </label>
              <input
                type="text"
                value={onSiteNotes}
                onChange={(e) => setOnSiteNotes(e.target.value)}
                placeholder="e.g. Standard exit, badge collected"
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#123B70]"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDirectOnSiteCheckOut}
                disabled={onSiteSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C5222E] to-[#9B1A24] hover:from-[#B01D28] hover:to-[#82151D] text-white font-extrabold text-xs sm:text-sm tracking-wide transition shadow-md shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[46px]"
              >
                {onSiteSubmitting ? (
                  <span>Checking Out...</span>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>CONFIRM & CHECK OUT VISITOR</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setOnSiteModalVisitor(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[40px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Terminal Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-3 sm:px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              PCC Security System • Gate Checkpoint: {gateStation}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <Link href="/register" className="hover:text-slate-900 transition">
              Visitor Check-in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
