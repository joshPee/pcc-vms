'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';

// Dynamically import the camera scanner to prevent SSR issues
const GuardQrScanner = dynamic(() => import('@/components/GuardQrScanner'), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs">
      Loading camera scanner...
    </div>
  ),
});

const GATE_STATIONS = [
  'Main Gate (Exit 1)',
  'Main Gate (Exit 2)',
  'VIP & Dignitary Gate',
  'Contractors & Logistics Gate',
  'South Gate',
];

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
  const [gateStation, setGateStation] = useState<string>(GATE_STATIONS[0]);
  const [guardName, setGuardName] = useState<string>('Security Officer');
  const [isEditingGuard, setIsEditingGuard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Security Clearance Checklist
  const [badgeReturned, setBadgeReturned] = useState(true);
  const [vehicleInspected, setVehicleInspected] = useState(false);
  const [exitNotes, setExitNotes] = useState('');

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
      if (savedStation) setGateStation(savedStation);
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
    codeInputRef.current?.focus();
  }, []);

  // Fetch active visitors on premises
  const fetchActiveVisitors = useCallback(async () => {
    setActiveLoading(true);
    try {
      const res = await fetch('/api/active-visitors');
      if (res.ok) {
        const data = await res.json();
        setActiveVisitors(Array.isArray(data) ? data : []);
        setActiveCount(Array.isArray(data) ? data.length : 0);
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

  // Handle searching / verifying a code entered by the guard
  const handleVerifyCode = async (codeToVerify?: string) => {
    const raw = (codeToVerify || visitorCode).trim();
    if (!raw) return;

    // Normalize code: if only digits entered (e.g. 1234), format as CTS-1234
    let clean = raw.toUpperCase();
    if (/^\d{4}$/.test(clean)) {
      clean = `CTS-${clean}`;
    }

    setLoading(true);
    setError(null);
    setSelectedVisitor(null);

    try {
      // 1. Check local active visitors first for zero-latency response
      const match = activeVisitors.find(
        (v) =>
          v.registration_code?.toUpperCase() === clean ||
          v.vehicle_registration?.toUpperCase() === clean
      );

      if (match) {
        setSelectedVisitor(match);
        playSound('success');
        setLoading(false);
        return;
      }

      // 2. Fetch from participants search endpoint
      const res = await fetch(`/api/participants/search?q=${encodeURIComponent(clean)}&checkInStatus=CHECKED_IN`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setSelectedVisitor(data[0]);
        playSound('success');
      } else {
        setError(`No checked-in visitor found for code "${clean}". Please verify the code.`);
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

  // Perform checkout
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

        // Remove from active list
        setActiveVisitors((prev) => prev.filter((v) => v.id !== selectedVisitor.id));
        setActiveCount((prev) => Math.max(0, prev - 1));

        // Reset state & focus back to code input for next visitor
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#C89B3C] selection:text-white">
      {/* Top Security Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3">
        <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:gap-3">
          {/* Top Row: Logo + Mobile Controls */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md transition group-hover:scale-105">
                <img src="/pcc.png" alt="PCC" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm sm:text-base font-bold text-slate-900 tracking-wide uppercase">
                    Visitor Check-Out
                  </h1>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="hidden sm:inline">Security Gate</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">Pentecost Convention Centre • Exit Verification</p>
              </div>
            </Link>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 font-mono text-[10px] sm:text-xs text-slate-500">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>{currentTime || '--:--'}</span>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-200 text-slate-600 hover:text-slate-900"
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Bottom Row: Gate & Guard Settings */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between sm:justify-end text-xs">
            {/* Gate Station Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1.5 flex-1 sm:flex-none min-w-[120px]">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C89B3C] shrink-0" />
              <select
                value={gateStation}
                onChange={(e) => {
                  setGateStation(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('pcc_gate_station', e.target.value);
                  }
                }}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs w-full"
              >
                {GATE_STATIONS.map((station) => (
                  <option key={station} value={station} className="bg-white text-slate-700">
                    {station}
                  </option>
                ))}
              </select>
            </div>

            {/* Guard Name */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1.5 flex-1 sm:flex-none min-w-[100px]">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
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
                  className="bg-white text-slate-900 px-1.5 py-0.5 rounded border border-blue-500 text-xs w-full sm:w-28"
                />
              ) : (
                <span
                  onClick={() => setIsEditingGuard(true)}
                  className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer underline decoration-dotted truncate"
                  title="Click to change guard name"
                >
                  {guardName}
                </span>
              )}
            </div>

            {/* Sound Toggle (Desktop) */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition text-xs font-medium"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 lg:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('checkout');
                setTimeout(() => codeInputRef.current?.focus(), 100);
              }}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === 'checkout' ? 'bg-[#123B70] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span className="hidden sm:inline">Enter Visitor Code</span>
              <span className="sm:hidden">Code</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('directory');
                fetchActiveVisitors();
              }}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === 'directory' ? 'bg-[#123B70] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">On-Premises ({activeCount})</span>
              <span className="sm:inline sm:hidden">({activeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === 'log' ? 'bg-[#123B70] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Shift Log ({recentDepartures.length})</span>
              <span className="sm:inline sm:hidden">Log ({recentDepartures.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>{currentTime || '--:--:--'}</span>
          </div>
        </div>

        {/* Check-Out Success Banner */}
        {lastCheckOut && (
          <div className="bg-gradient-to-r from-emerald-50 via-emerald-100 to-slate-100 border border-emerald-300 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold">
                    {lastCheckOut.registration_code}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                    Checked Out · Gate Cleared
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                  {lastCheckOut.participant_name || lastCheckOut.full_name}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {lastCheckOut.organisation ? `${lastCheckOut.organisation} • ` : ''}
                  Duration: {lastCheckOut.duration_minutes ? `${lastCheckOut.duration_minutes} mins` : 'Completed'} • Gate: {lastCheckOut.gate_station}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setLastCheckOut(null);
                codeInputRef.current?.focus();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 transition"
            >
              Process Next Visitor
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start justify-between gap-3 text-rose-700 text-xs sm:text-sm shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: Enter Visitor Code (Primary Workflow) */}
        {activeTab === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            {/* Left Box: Code Entry & Camera Option (7 cols) */}
            <div className="lg:col-span-7 space-y-4 lg:space-y-5">
              {/* Main Code Input Card */}
              <div className="bg-white border border-slate-200 rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-7 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-wide">
                      Enter Visitor Code
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter the 4-digit or full code (e.g. <span className="text-[#C89B3C] font-mono font-bold">CTS-1234</span>)
                    </p>
                  </div>

                  <button
                    onClick={() => setShowScanner(!showScanner)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 hover:text-slate-900 transition font-medium border border-slate-200 w-full sm:w-auto justify-center"
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
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative">
                      <Hash className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={visitorCode}
                        onChange={(e) => setVisitorCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CTS-4821 or 4821"
                        className="w-full bg-white border-2 border-slate-300 focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/30 rounded-2xl pl-13 pr-12 py-3.5 sm:py-4 text-lg sm:text-xl lg:text-2xl font-mono font-bold text-slate-900 placeholder-slate-400 tracking-wider focus:outline-none transition"
                      />
                      {visitorCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setVisitorCode('');
                            setSelectedVisitor(null);
                            codeInputRef.current?.focus();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Prefix buttons */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Quick:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorCode('CTS-');
                          codeInputRef.current?.focus();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#C89B3C] font-mono font-bold border border-slate-200 transition"
                      >
                        + CTS-
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      disabled={loading || !visitorCode.trim()}
                      className="flex-1 py-4 rounded-2xl bg-[#123B70] hover:bg-[#0d2d52] text-white font-bold text-sm sm:text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 min-h-[52px]"
                    >
                      {loading ? (
                        <span>Checking Code...</span>
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
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Visitors receive code at check-in</span>
                  <span className="text-emerald-600 font-semibold">{activeCount} on site</span>
                </div>
              </div>
            </div>

            {/* Right Box: Visitor Details & Checkout Action (5 cols) */}
            <div className="lg:col-span-5">
              {selectedVisitor ? (
                <div className="bg-white border-2 border-[#123B70] rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-lg relative overflow-hidden animate-in fade-in duration-200">
                  {/* Top Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 sm:pb-4 mb-3 sm:mb-4">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#C89B3C]">
                        Visitor Pass Found
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{selectedVisitor.full_name}</h3>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-[#123B70] text-white font-mono font-bold text-sm sm:text-base tracking-widest shadow-md self-start sm:self-auto">
                      {selectedVisitor.registration_code}
                    </div>
                  </div>

                  {/* Visitor Meta Grid */}
                  <div className="space-y-2 sm:space-y-3 text-xs mb-4 sm:mb-5">
                    {selectedVisitor.organisation && (
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Organisation</span>
                        <span className="font-semibold text-slate-700">{selectedVisitor.organisation}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Host Visited</span>
                      <span className="font-semibold text-slate-700 text-right">
                        {selectedVisitor.host_name || 'General Visit'}
                        {selectedVisitor.host_department ? ` (${selectedVisitor.host_department})` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Check-in Time</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {calculateMinutesOnSite(selectedVisitor.check_in_date) || 'Checked in today'}
                      </span>
                    </div>

                    {selectedVisitor.vehicle_registration && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Vehicle</span>
                        <span className="font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded border border-amber-500 shadow-xs text-xs">
                          {selectedVisitor.vehicle_registration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Security Clearance Checklist */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200 mb-4 sm:mb-5 space-y-2 sm:space-y-2.5">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Exit Clearance Checks
                    </p>

                    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={badgeReturned}
                        onChange={(e) => setBadgeReturned(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 bg-white focus:ring-0"
                      />
                      <span>Badge Returned</span>
                    </label>

                    {selectedVisitor.vehicle_registration && (
                      <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={vehicleInspected}
                          onChange={(e) => setVehicleInspected(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 bg-white focus:ring-0"
                        />
                        <span>Vehicle Cleared</span>
                      </label>
                    )}
                  </div>

                  {/* Checkout Action Button */}
                  <div className="space-y-2 sm:space-y-2.5">
                    <button
                      onClick={handleExecuteCheckOut}
                      disabled={loading}
                      className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px] sm:min-h-[52px]"
                    >
                      {loading ? (
                        <span>Checking Out...</span>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">CONFIRM & CHECK OUT VISITOR</span>
                          <span className="sm:hidden">CHECK OUT</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedVisitor(null);
                        setVisitorCode('');
                        codeInputRef.current?.focus();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
                    >
                      Cancel / Enter Different Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl lg:rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px]">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                    <LogOut className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-700">Awaiting Visitor Code</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Enter visitor code to verify details and clear for exit
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Active Visitors Directory */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Currently Checked-In Visitors</h2>
                <p className="text-xs text-slate-500">
                  Tap any visitor code to check them out
                </p>
              </div>

              <button
                onClick={fetchActiveVisitors}
                disabled={activeLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${activeLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {activeVisitors.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-400 mb-2" />
                <h3 className="text-sm sm:text-base font-bold text-slate-600">No Visitors On Site</h3>
                <p className="text-xs text-slate-500 mt-1">All checked-in visitors have departed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {activeVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-4.5 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button
                          onClick={() => {
                            setVisitorCode(visitor.registration_code);
                            setSelectedVisitor(visitor);
                            setActiveTab('checkout');
                          }}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 transition flex items-center gap-1"
                        >
                          <Hash className="w-3 h-3 text-[#C89B3C]" />
                          <span>{visitor.registration_code}</span>
                        </button>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          {calculateMinutesOnSite(visitor.check_in_date) || 'Active'}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{visitor.full_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{visitor.organisation || 'Personal Visit'}</p>

                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Host: {visitor.host_name || 'N/A'}</span>
                        </div>
                        {visitor.vehicle_registration && (
                          <div className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-mono text-amber-600 font-semibold">{visitor.vehicle_registration}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setVisitorCode(visitor.registration_code);
                        setSelectedVisitor(visitor);
                        setActiveTab('checkout');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto py-2.5 sm:py-2 px-4 rounded-xl bg-[#123B70] hover:bg-[#0d2d52] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Shift Departures Log */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Shift Exit Log</h2>
                <p className="text-xs text-slate-500">Visitors checked out during this duty period</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-100 text-[#C89B3C] font-bold">
                {recentDepartures.length} Checked Out
              </span>
            </div>

            {recentDepartures.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500">
                <FileCheck className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-400 mb-2" />
                <h3 className="text-sm sm:text-base font-bold text-slate-600">No Check-outs Recorded Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Visitors checked out via code entry will appear here.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 shadow-lg">
                {recentDepartures.map((dep, idx) => (
                  <div key={idx} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                          {dep.registration_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{dep.participant_name || dep.full_name}</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        {dep.organisation ? `${dep.organisation} • ` : ''}
                        Gate: {dep.gate_station}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Officer: {dep.guard_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                      <div>
                        <p className="text-xs font-mono text-slate-700">
                          {new Date(dep.check_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="text-[11px] text-emerald-600 font-medium">
                          {dep.duration_minutes || '0'}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Security Terminal Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-2 sm:py-3 px-3 sm:px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="truncate">PCC Security • {gateStation}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-slate-600 justify-center">
          <Link href="/register" className="hover:text-slate-900 transition">
            Check-in
          </Link>
          <Link href="/admin/dashboard" className="hover:text-slate-900 transition">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
