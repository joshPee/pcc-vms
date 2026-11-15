'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  AlertOctagon,
  CalendarCheck,
  ShieldAlert,
  Car,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  Settings,
  QrCode,
  ScrollText,
  UserCheck,
  ArrowRight,
  X,
  Command,
  Loader2,
  Phone,
  Clock,
} from 'lucide-react';

interface QuickLink {
  title: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const STATIC_LINKS: QuickLink[] = [
  { title: 'Dashboard & KPI Overview', category: 'Navigation', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Visitors Directory & Search', category: 'Navigation', href: '/admin/visitors', icon: Users },
  { title: 'Emergency Headcount Roster', category: 'Emergency', href: '/admin/emergency', icon: AlertOctagon, badge: 'Live' },
  { title: 'Expected Attendees & Pre-Registration', category: 'Navigation', href: '/admin/expected-attendees', icon: CalendarCheck },
  { title: 'Security Watchlist & Denied List', category: 'Security', href: '/admin/watchlist', icon: ShieldAlert, badge: 'Alerts' },
  { title: 'Vehicles & Parking Log', category: 'Security', href: '/admin/vehicles', icon: Car },
  { title: 'Security Incident Reports', category: 'Security', href: '/admin/incidents', icon: AlertTriangle },
  { title: 'Guard Shift Handover Logs', category: 'Operations', href: '/admin/shift-handover', icon: ClipboardList },
  { title: 'Reports & Export Analytics', category: 'Management', href: '/admin/reports', icon: BarChart3 },
  { title: 'Entrance QR Code Generator', category: 'Tools', href: '/admin/qr-code', icon: QrCode },
  { title: 'System Settings & User Roles', category: 'Administration', href: '/admin/settings', icon: Settings },
  { title: 'Full System Audit Trail', category: 'Administration', href: '/admin/audit-log', icon: ScrollText },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Search API for visitors when query is typed
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/participants/search?q=${encodeURIComponent(query)}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data.slice(0, 6) : []);
        }
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectLink = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const filteredLinks = query.trim()
    ? STATIC_LINKS.filter((l) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.category.toLowerCase().includes(query.toLowerCase())
      )
    : STATIC_LINKS;

  return (
    <>
      {/* Trigger Button inside TopBar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition"
        title="Command Palette (Ctrl + K)"
      >
        <Search className="w-3.5 h-3.5 text-[#123B70]" />
        <span className="hidden sm:inline text-slate-600 font-medium">Quick search or jump...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-500 shadow-2xs">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Palette Box */}
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search className="w-5 h-5 text-[#123B70] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search visitors by name, pass code, vehicle, or jump to page..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />
              {searching ? (
                <Loader2 className="w-4 h-4 text-[#123B70] animate-spin shrink-0" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-medium text-slate-500">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results Content */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100">
              {/* Dynamic Visitor Results */}
              {searchResults.length > 0 && (
                <div className="pb-2">
                  <p className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Visitors Found ({searchResults.length})
                  </p>
                  <div className="space-y-1 mt-1">
                    {searchResults.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectLink(`/admin/visitors?q=${encodeURIComponent(v.pass_number || v.registration_code || '')}`)}
                        className="w-full text-left flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#123B70]/5 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#123B70] flex items-center justify-center font-bold text-xs shrink-0">
                            {v.full_name?.slice(0, 2).toUpperCase() || 'VI'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#123B70] transition truncate">
                              {v.full_name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                              <span className="font-mono text-[#123B70] font-bold">
                                {v.pass_number || v.registration_code}
                              </span>
                              {v.phone && <span>· {v.phone}</span>}
                              {v.host_name && <span>· Host: {v.host_name}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.check_in_status === 'CHECKED_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.approval_status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {v.check_in_status === 'CHECKED_IN' ? 'Inside' : v.approval_status || 'Registered'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Quick Links */}
              <div className={searchResults.length > 0 ? 'pt-2' : ''}>
                <p className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Navigation & Tools
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                  {filteredLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => handleSelectLink(item.href)}
                        className="w-full text-left flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 text-slate-700 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#123B70] group-hover:text-white flex items-center justify-center shrink-0 transition">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Shortcut Helper */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-[#123B70]" />
                <span>PCC Command Palette</span>
              </span>
              <span>Use ↑ ↓ to navigate · ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

