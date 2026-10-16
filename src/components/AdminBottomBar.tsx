'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Users,
  MoreHorizontal,
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
  ChevronRight,
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
  // Primary (also on bar)
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    description: 'Real-time overview of visitor volume & metrics',
    icon: LayoutDashboard,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/check-in',
    label: 'Check In',
    description: 'Process incoming expected and walk-in visitors',
    icon: LogIn,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/check-out',
    label: 'Check Out',
    description: 'Verify departures and clear visitor badges',
    icon: LogOut,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/visitors',
    label: 'Visitors Directory',
    description: 'Master list of registered participants and visitors',
    icon: Users,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    category: 'Visitor Operations',
  },

  // Visitor Operations
  {
    href: '/check-out',
    label: 'Gate Check-out Station',
    description: 'Fast barcode scanner & code checkout for gate guards',
    icon: ShieldCheck,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/pre-registration',
    label: 'Pre-Registration',
    description: 'Schedule upcoming delegations and individual guests',
    icon: CalendarCheck,
    color: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/visitor-history',
    label: 'Visitor Audit Log',
    description: 'Chronological timeline of all visitor entries and exits',
    icon: History,
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/qr-code',
    label: 'QR Code Generator',
    description: 'Generate and print scannable QR passes for events',
    icon: QrCode,
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    category: 'Visitor Operations',
  },
  {
    href: '/admin/expected-attendees',
    label: 'Expected Attendees',
    description: 'Review upcoming RSVPs and invitations',
    icon: Users,
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    category: 'Visitor Operations',
  },

  // Security & Patrol
  {
    href: '/admin/watchlist',
    label: 'Security Watchlist',
    description: 'Flagged persons, VIPs, and restriction alerts',
    icon: ShieldAlert,
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    category: 'Security & Patrol',
  },
  {
    href: '/admin/vehicles',
    label: 'Vehicles & Parking',
    description: 'Log and track visitor & contractor vehicles on site',
    icon: Car,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    category: 'Security & Patrol',
  },
  {
    href: '/admin/incidents',
    label: 'Incident Reports',
    description: 'Security occurrences, logs, and supervisor reviews',
    icon: AlertTriangle,
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    category: 'Security & Patrol',
    requiredRole: 'supervisor',
  },
  {
    href: '/admin/shift-handover',
    label: 'Shift Handover',
    description: 'Guard duty shift notes, equipment, and sign-offs',
    icon: ClipboardList,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    category: 'Security & Patrol',
    requiredRole: 'supervisor',
  },

  // Management & Settings
  {
    href: '/admin/hosts-staff',
    label: 'Hosts & Staff Directory',
    description: 'Internal departments, officers, and host contacts',
    icon: UserCog,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    category: 'Management & Settings',
  },
  {
    href: '/admin/reports',
    label: 'Reports & Analytics',
    description: 'Export traffic trends, visitor counts, and dwell times',
    icon: BarChart3,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    category: 'Management & Settings',
    requiredRole: 'supervisor',
  },
  {
    href: '/admin/settings',
    label: 'Users & Permissions',
    description: 'Manage staff roles, access levels, and credentials',
    icon: Settings,
    color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
    category: 'Management & Settings',
  },
  {
    href: '/admin/visitor-categories',
    label: 'Visitor Categories',
    description: 'Define badges, VIP designations, and access tags',
    icon: Tag,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    category: 'Management & Settings',
  },
  {
    href: '/admin/audit-log',
    label: 'System Audit Trail',
    description: 'Immutable record of staff actions and system modifications',
    icon: ScrollText,
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
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
      {/* Floating Bottom Navigation Bar */}
      <nav
        aria-label="Admin Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] py-1.5 px-3 sm:px-6"
      >
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around">
          {PRIMARY_BAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 sm:px-4 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'text-[#123B70] dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Capsule */}
                <div
                  className={`w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#123B70]/10 dark:bg-blue-500/20 text-[#123B70] dark:text-blue-400 scale-105'
                      : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-[10.5px] sm:text-[11px] font-medium tracking-tight mt-0.5">
                  {item.label}
                </span>

                {/* Subtle active pip */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#123B70] dark:bg-blue-400" />
                )}
              </Link>
            );
          })}

          {/* More... Button (Trigger for Full Modules Modal) */}
          <button
            type="button"
            onClick={() => setMoreModalOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 sm:px-4 rounded-2xl transition-all duration-200 group cursor-pointer ${
              isMoreActive || moreModalOpen
                ? 'text-[#123B70] dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                isMoreActive || moreModalOpen
                  ? 'bg-[#123B70]/10 dark:bg-blue-500/20 text-[#123B70] dark:text-blue-400 scale-105'
                  : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="text-[10.5px] sm:text-[11px] font-medium tracking-tight mt-0.5">
              More...
            </span>

            {isMoreActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#123B70] dark:bg-blue-400" />
            )}
          </button>
        </div>
      </nav>

      {/* "More..." Modules Modal */}
      {moreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMoreModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] sm:max-h-[80vh] flex flex-col z-10 overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#123B70]/10 dark:bg-blue-500/20 text-[#123B70] dark:text-blue-400 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">All Modules & Tools</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PCC Visitor Management System</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search inside Modal */}
            <div className="px-4 sm:px-5 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Quick jump to any module..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
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
            <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
              {categories.map((category) => {
                const categoryItems = visibleModules.filter((m) => m.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-2.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      {category}
                    </h4>
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
                                ? 'bg-[#123B70]/10 border-[#123B70]/30 dark:bg-blue-950/40 dark:border-blue-700/40'
                                : 'bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800'
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
                                    isCurrent ? 'text-[#123B70] dark:text-blue-400' : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {mod.label}
                                </p>
                                {isCurrent && (
                                  <span className="text-[10px] font-semibold text-[#123B70] dark:text-blue-400 px-1.5 py-0.2 rounded bg-[#123B70]/10">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
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
