'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  LogIn,
  LogOut,
  BarChart3,
  Settings,
  History,
  ChevronDown,
  ShieldAlert,
  CalendarCheck,
  Car,
  AlertTriangle,
  ClipboardList,
  Tag,
  ScrollText,
  QrCode,
  UserCog,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Shield,
  Building,
} from 'lucide-react';
import { canAccessPage, type UserRole } from '@/lib/rbac';

interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  children?: NavItem[];
  requiredRole?: UserRole;
  collapsible?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'OPERATIONS',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/check-in', label: 'Check In', icon: LogIn },
      { href: '/admin/check-out', label: 'Check Out', icon: LogOut },
      {
        href: '/check-out',
        label: 'Gate Terminal',
        icon: ShieldCheck,
        badge: 'Exit Gate',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
      },
      { href: '/admin/visitors', label: 'Visitors Directory', icon: Users },
      { href: '/admin/expected-attendees', label: 'Expected Attendees', icon: CalendarCheck },
    ],
  },
  {
    title: 'SECURITY & PATROL',
    items: [
      {
        href: '/admin/watchlist',
        label: 'Security Watchlist',
        icon: ShieldAlert,
        badge: 'Alerts',
        badgeColor: 'bg-rose-50 text-rose-700 border border-rose-300',
      },
      { href: '/admin/vehicles', label: 'Vehicles & Parking', icon: Car },
      { href: '/admin/visitor-history', label: 'Visitor Audit Log', icon: History },
      { href: '/admin/incidents', label: 'Incident Reports', icon: AlertTriangle, requiredRole: 'supervisor' },
      { href: '/admin/shift-handover', label: 'Shift Handover', icon: ClipboardList, requiredRole: 'supervisor' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { href: '/admin/pre-registration', label: 'Pre-Registration', icon: CalendarCheck },
      { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3, requiredRole: 'supervisor' },
      { href: '/admin/qr-code', label: 'QR Pass Generator', icon: QrCode },
      { href: '/admin/hosts-staff', label: 'Hosts & Staff', icon: UserCog },
      {
        label: 'Settings',
        icon: Settings,
        collapsible: true,
        children: [
          { href: '/admin/settings', label: 'Users & Roles', icon: Users },
          { href: '/admin/visitor-categories', label: 'Categories', icon: Tag },
          { href: '/admin/audit-log', label: 'System Audit Log', icon: ScrollText },
        ],
      },
    ],
  },
];

const roleHierarchy: Record<string, number> = {
  security_officer: 1,
  supervisor: 2,
  sector_head: 3,
  admin: 4,
};

function filterNavSections(sections: NavSection[], role: UserRole): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => {
          if (item.requiredRole) {
            const userLevel = roleHierarchy[role] || 0;
            const requiredLevel = roleHierarchy[item.requiredRole] || 999;
            return userLevel >= requiredLevel;
          }
          if (item.children) {
            return item.children.some((child) => canAccessPage(role, child.href || ''));
          }
          return canAccessPage(role, item.href || '');
        })
        .map((item) => {
          if (item.children) {
            return {
              ...item,
              children: item.children.filter((child) => canAccessPage(role, child.href || '')),
            };
          }
          return item;
        }),
    }))
    .filter((section) => section.items.length > 0);
}

export default function AdminSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set(['Settings']));
  const [sections, setSections] = useState<NavSection[]>(NAV_SECTIONS);
  const [activeVisitorsCount, setActiveVisitorsCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserRoleAndCount = async () => {
      try {
        const [userRes, visitorsRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch('/api/active-visitors'),
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setSections(filterNavSections(NAV_SECTIONS, data.role || 'security_officer'));
        }

        if (visitorsRes.ok) {
          const visitors = await visitorsRes.json();
          if (Array.isArray(visitors)) {
            setActiveVisitorsCount(visitors.length);
          }
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      }
    };
    fetchUserRoleAndCount();
  }, []);

  if (pathname === '/admin/login') return null;

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const NavLink = ({ href, label, icon: Icon, badge, badgeColor, children, collapsible }: NavItem) => {
    const hasChildren = children && children.length > 0;
    const isActive = href ? pathname === href : false;
    const isMenuOpen = openMenus.has(label);
    const isChildActive = children?.some((child) => child.href === pathname);

    if (hasChildren && collapsible) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu(label)}
            className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 group cursor-pointer ${
              isChildActive
                ? 'bg-[#0B3D2E]/10 text-[#0B3D2E] font-bold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>{label}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isMenuOpen && (
            <div className="pl-6 pr-1 space-y-1 border-l-2 border-[#D8CFB8]/40 ml-4">
              {children.map((child) => (
                <NavLink key={child.href} {...child} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={href!}
        className={`relative flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-[#0B3D2E] text-white shadow-md shadow-[#0B3D2E]/20 font-bold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        onClick={() => setMobileMenuOpen?.(false)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive ? 'text-[#C89B3C]' : 'text-slate-400 group-hover:text-slate-700'
            }`}
          />
          <span className="truncate">{label}</span>
        </div>

        {/* Optional Pill Badges */}
        {badge ? (
          <span
            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
              isActive ? 'bg-white/20 text-white' : badgeColor || 'bg-slate-100 text-slate-600'
            }`}
          >
            {badge}
          </span>
        ) : label === 'Check Out' && activeVisitorsCount !== null && activeVisitorsCount > 0 ? (
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              isActive ? 'bg-[#C89B3C] text-[#082C21]' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {activeVisitorsCount}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop (if triggered manually) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      {/* Modern Desktop & Tablet Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 bg-white border-r border-[#D8CFB8]/60 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:w-64 lg:transform-none lg:h-[calc(100vh-4rem)] lg:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {section.title}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]/50" />
              </div>
              <nav className="space-y-0.5">
                {section.items.map((item, itemIdx) => (
                  <NavLink key={item.href || item.label + itemIdx} {...item} />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Quick Gate Terminal Shortcut Card at Bottom */}
        <div className="p-3 border-t border-[#D8CFB8]/50 bg-[#FBFAF6]">
          <Link
            href="/check-out"
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#0B3D2E] to-[#125c46] text-white shadow-md hover:shadow-lg transition-all group hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Gate Terminal</p>
                <p className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Exit Clearance</span>
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      </aside>
    </>
  );
}
