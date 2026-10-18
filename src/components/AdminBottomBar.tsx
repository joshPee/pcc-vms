'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Users,
  LayoutGrid,
  CalendarCheck,
  History,
  ShieldAlert,
  UserCog,
  Car,
  AlertTriangle,
  ClipboardList,
  QrCode,
  BarChart3,
  Settings,
  Tag,
  ScrollText,
  Search,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { canAccessPage, type UserRole } from '@/lib/rbac';

interface MenuModule {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: 'Visitor Operations' | 'Security & Patrol' | 'Management & Settings';
  requiredRole?: UserRole;
}

const ALL_MODULES: MenuModule[] = [
  // Primary
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    description: 'Real-time overview of visitor volume & metrics',
    icon: LayoutDashboard,
    color: 'bg-emerald-50 text-[#0B3D2E] border-emerald-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/check-in',
    label: 'Check In',
    description: 'Process incoming expected and walk-in visitors',
    icon: LogIn,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/check-out',
    label: 'Check Out',
    description: 'Verify departures and clear visitor badges',
    icon: LogOut,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/visitors',
    label: 'Visitors Directory',
    description: 'Master list of registered participants and visitors',
    icon: Users,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    category: 'Visitor Operations',
  },

  // Visitor Operations
  {
    href: '/check-out',
    label: 'Gate Terminal View',
    description: 'Fast barcode scanner & code checkout for gate guards',
    icon: ShieldCheck,
    color: 'bg-emerald-50 text-[#0B3D2E] border-emerald-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/pre-registration',
    label: 'Pre-Registration',
    description: 'Schedule upcoming delegations and individual guests',
    icon: CalendarCheck,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/visitor-history',
    label: 'Visitor Audit Log',
    description: 'Chronological timeline of all visitor entries and exits',
    icon: History,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/qr-code',
    label: 'QR Code Generator',
    description: 'Generate and print scannable QR passes for events',
    icon: QrCode,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/expected-attendees',
    label: 'Expected Attendees',
    description: 'Review upcoming RSVPs and invitations',
    icon: Users,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    category: 'Visitor Operations',
  },

  // Security & Patrol
  {
    href: '/admin/watchlist',
    label: 'Security Watchlist',
    description: 'Flagged persons, VIPs, and restriction alerts',
    icon: ShieldAlert,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    category: 'Security & Patrol',
  },
  {
    href: '/admin/vehicles',
    label: 'Vehicles & Parking',
    description: 'Log and track visitor & contractor vehicles on site',
    icon: Car,
    color: 'bg-amber-50 text-[#C89B3C] border-amber-200',
    category: 'Security & Patrol',
  },
  {
    href: '/admin/incidents',
    label: 'Incident Reports',
    description: 'Security occurrences, logs, and supervisor reviews',
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-700 border-red-200',
    category: 'Security & Patrol',
    requiredRole: 'supervisor',
  },
  {
    href: '/admin/shift-handover',
    label: 'Shift Handover',
    description: 'Guard duty shift notes, equipment, and sign-offs',
    icon: ClipboardList,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    category: 'Security & Patrol',
    requiredRole: 'supervisor',
  },

  // Management & Settings
  {
    href: '/admin/hosts-staff',
    label: 'Hosts & Staff Directory',
    description: 'Internal departments, officers, and host contacts',
    icon: UserCog,
    color: 'bg-emerald-50 text-[#0B3D2E] border-emerald-200',
    category: 'Management & Settings',
  },
  {
    href: '/admin/reports',
    label: 'Reports & Analytics',
    description: 'Export traffic trends, visitor counts, and dwell times',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    category: 'Management & Settings',
    requiredRole: 'supervisor',
  },
  {
    href: '/admin/settings',
    label: 'Users & Permissions',
    description: 'Manage staff roles, access levels, and credentials',
    icon: Settings,
    color: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    category: 'Management & Settings',
  },
  {
    href: '/admin/visitor-categories',
    label: 'Visitor Categories',
    description: 'Define badges, VIP designations, and access tags',
    icon: Tag,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    category: 'Management & Settings',
  },
  {
    href: '/admin/audit-log',
    label: 'System Audit Trail',
    description: 'Immutable record of staff actions and system modifications',
    icon: ScrollText,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    category: 'Management & Settings',
  },
];

const PRIMARY_BAR_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/check-in', label: 'Check In', icon: LogIn },
  { href: '/admin/check-out', label: 'Check Out', icon: LogOut },
  { href: '/admin/visitors', label: 'Visitors', icon: Users },
];

export default function AdminBottomBar() {
  const pathname = usePathname();
  const [moreModalOpen, setMoreModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('security_officer');

  // Fetch current user role
  useEffect(() => {
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreModalOpen(false);
    };
    if (moreModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moreModalOpen]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (moreModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [moreModalOpen]);

  // Is current path one of the primary 4 or in the "More..." menu?
  const isPrimaryActive = PRIMARY_BAR_ITEMS.some((item) => item.href === pathname);
  const isMoreActive = !isPrimaryActive && pathname.startsWith('/admin');

  // Filter modules by role & search
  const visibleModules = ALL_MODULES.filter((mod) => {
    if (!canAccessPage(userRole, mod.href)) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      mod.label.toLowerCase().includes(q) ||
      mod.description.toLowerCase().includes(q) ||
      mod.category.toLowerCase().includes(q)
    );
  });

  const categories = ['Visitor Operations', 'Security & Patrol', 'Management & Settings'] as const;

  return (
    <>
      {/* Floating Bottom Navigation Bar (Mobile & Tablet Only) */}
      <nav
        aria-label="Admin Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#D8CFB8]/70 shadow-[0_-8px_30px_rgba(11,61,46,0.08)] py-1.5 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {PRIMARY_BAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 group ${
                  isActive ? 'text-[#0B3D2E] font-black' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {/* Active Indicator Capsule */}
                <div
                  className={`w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0B3D2E] text-white shadow-md shadow-[#0B3D2E]/25 scale-105'
                      : 'group-hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-[#C89B3C]' : ''}`} />
                </div>
                <span className="text-[10px] font-bold tracking-tight mt-1">
                  {item.label}
                </span>

                {/* Subtle active pip */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#C89B3C]" />
                )}
              </Link>
            );
          })}

          {/* More... Button (Trigger for Full Modules Modal) */}
          <button
            type="button"
            onClick={() => setMoreModalOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 group cursor-pointer ${
              isMoreActive || moreModalOpen ? 'text-[#0B3D2E] font-black' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div
              className={`w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isMoreActive || moreModalOpen
                  ? 'bg-[#0B3D2E] text-white shadow-md shadow-[#0B3D2E]/25 scale-105'
                  : 'group-hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className={`w-4 h-4 ${isMoreActive || moreModalOpen ? 'text-[#C89B3C]' : ''}`} />
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">
              More...
            </span>

            {isMoreActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#C89B3C]" />
            )}
          </button>
        </div>
      </nav>

      {/* "More..." Modules Modal */}
      {moreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full sm:max-w-2xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#D8CFB8]/80 max-h-[85vh] sm:max-h-[80vh] flex flex-col z-10 overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#D8CFB8]/50 flex items-center justify-between shrink-0 bg-[#FBFAF6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0B3D2E]/10 text-[#0B3D2E] flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">All Modules & Tools</h3>
                  <p className="text-xs text-slate-500">PCC Visitor Management System</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search inside Modal */}
            <div className="px-4 sm:px-5 pt-3 pb-2 shrink-0 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Quick search across all modules..."
                  className="w-full bg-[#FBFAF6] border border-[#D8CFB8]/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/30"
                  autoFocus
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Categories List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1 bg-white">
              {categories.map((category) => {
                const categoryItems = visibleModules.filter((m) => m.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        {category}
                      </h4>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryItems.map((mod) => {
                        const Icon = mod.icon;
                        const isCurrent = pathname === mod.href;

                        return (
                          <Link
                            key={mod.href}
                            href={mod.href}
                            onClick={() => setMoreModalOpen(false)}
                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-150 group ${
                              isCurrent
                                ? 'bg-[#0B3D2E]/10 border-[#0B3D2E]/40'
                                : 'bg-slate-50/70 hover:bg-[#FBFAF6] border-slate-200/80 hover:border-[#D8CFB8]'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${mod.color}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`text-xs font-bold truncate ${
                                    isCurrent ? 'text-[#0B3D2E]' : 'text-slate-900'
                                  }`}
                                >
                                  {mod.label}
                                </p>
                                {isCurrent && (
                                  <span className="text-[10px] font-semibold text-[#0B3D2E] px-1.5 py-0.2 rounded bg-[#0B3D2E]/10">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {mod.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {visibleModules.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No modules match &quot;{searchFilter}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
