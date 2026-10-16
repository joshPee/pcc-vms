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
} from 'lucide-react';
import { canAccessPage, type UserRole } from '@/lib/rbac';

interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  requiredRole?: UserRole;
  collapsible?: boolean;
}

const allNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/check-in', label: 'Check In', icon: LogIn },
  { href: '/admin/check-out', label: 'Check Out (Admin)', icon: LogOut },
  { href: '/check-out', label: 'Visitor Check-out', icon: LogOut },
  { href: '/admin/visitors', label: 'Visitors', icon: Users },
  { href: '/admin/pre-registration', label: 'Pre-Registration', icon: CalendarCheck },
  { href: '/admin/visitor-history', label: 'Visitor Log', icon: History },
  { href: '/admin/watchlist', label: 'Watchlist', icon: ShieldAlert },
  { href: '/admin/hosts-staff', label: 'Hosts & Staff', icon: UserCog },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/incidents', label: 'Incidents', icon: AlertTriangle, requiredRole: 'supervisor' },
  { href: '/admin/shift-handover', label: 'Shift Handover', icon: ClipboardList, requiredRole: 'supervisor' },
  { href: '/admin/qr-code', label: 'QR Code Generator', icon: QrCode },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, requiredRole: 'supervisor' },
  {
    label: 'Settings',
    icon: Settings,
    collapsible: true,
    children: [
      { href: '/admin/settings', label: 'Users & Roles', icon: Users },
      { href: '/admin/visitor-categories', label: 'Visitor Categories', icon: Tag },
      { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
    ],
  },
];

const roleHierarchy: Record<string, number> = {
  security_officer: 1,
  supervisor: 2,
  sector_head: 3,
  admin: 4,
};

function filterNavItems(role: UserRole): NavItem[] {
  return allNavItems
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
    });
}

export default function AdminSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set(['Settings']));
  const [navItems, setNavItems] = useState<NavItem[]>(allNavItems);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setNavItems(filterNavItems(data.role || 'security_officer'));
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
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

  const NavLink = ({ href, label, icon: Icon, children, collapsible }: NavItem) => {
    const hasChildren = children && children.length > 0;
    const isActive = href ? pathname === href : false;
    const isMenuOpen = openMenus.has(label);
    const isChildActive = children?.some((child) => child.href === pathname);

    if (hasChildren) {
      if (collapsible) {
        return (
          <div className="mx-2">
            <button
              onClick={() => toggleMenu(label)}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                isChildActive
                  ? 'bg-[#123B70]/10 text-[#123B70]'
                  : 'text-muted-foreground hover:bg-[#123B70]/10 hover:text-[#123B70]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMenuOpen && (
              <div className="ml-4 mt-1 space-y-0.5">
                {children.map((child) => (
                  <NavLink key={child.href} {...child} />
                ))}
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <Link
        href={href!}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg mx-2 ${
          isActive
            ? 'bg-[#123B70]/10 text-[#123B70] font-semibold'
            : 'text-muted-foreground hover:bg-[#123B70]/10 hover:text-[#123B70]'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <Icon className={`h-4 w-4 ${isActive ? 'text-[#123B70]' : ''}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-[260px] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:w-[220px] lg:transform-none lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="flex flex-col py-4 space-y-0.5">
          {navItems.map((item, index) => (
            <NavLink key={item.href || item.label + index} {...item} />
          ))}
        </nav>
      </aside>
    </>
  );
}
