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
  FileText,
  Tag,
  ScrollText
} from 'lucide-react';
import { canAccessPage, type UserRole } from '@/lib/rbac';

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  children?: NavItem[];
  requiredRole?: UserRole;
  collapsible?: boolean;
}

const allNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/check-in', label: 'Check-In/ Out', icon: LogIn },
  { href: '/admin/visitors', label: 'Active Visitors', icon: Users },
  { href: '/admin/pre-registration', label: 'Pre-Registration', icon: CalendarCheck },
  { href: '/admin/visitor-history', label: 'Visitor Log', icon: History },
  { href: '/admin/watchlist', label: 'Watchlist', icon: ShieldAlert },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, requiredRole: 'Supervisor' },
  { 
    label: 'Settings', 
    icon: Settings, 
    collapsible: true,
    children: [
      { href: '/admin/settings', label: 'Users & Roles', icon: Users },
      { href: '/admin/visitor-categories', label: 'Visitor Categories', icon: Tag },
      { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
    ]
  },
];

export default function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen: boolean; setMobileMenuOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<UserRole>('Security Officer');
  const [navItems, setNavItems] = useState<NavItem[]>(allNavItems); // Start with all items

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users/me');
        
        if (response.ok) {
          const data = await response.json();
          const role = data.role || 'Security Officer';
          setUserRole(role);
          
          // Filter nav items based on role
          const filteredItems = allNavItems.filter(item => {
            // Check if item has a required role
            if (item.requiredRole) {
              const roleHierarchy: Record<string, number> = {
                'Security Officer': 1,
                'Supervisor': 2,
                'Sector Head': 3,
                'Admin': 4,
              };
              const userLevel = roleHierarchy[role] || 0;
              const requiredLevel = roleHierarchy[item.requiredRole] || 999;
              return userLevel >= requiredLevel;
            }
            
            // If item has children, check if any children are accessible
            if (item.children) {
              const filteredChildren = item.children.filter(child => 
                canAccessPage(role, child.href || '')
              );
              return filteredChildren.length > 0;
            }
            
            // Check if the item itself is accessible
            return canAccessPage(role, item.href || '');
          }).map(item => {
            if (item.children) {
              return {
                ...item,
                children: item.children.filter(child => canAccessPage(role, child.href || ''))
              };
            }
            return item;
          });
          
          setNavItems(filteredItems);
        } else {
          setNavItems(allNavItems);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setNavItems(allNavItems);
      }
    };

    fetchUserRole();
  }, []);

  // Don't render sidebar on the login page
  if (pathname === '/admin/login') {
    return null;
  }

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const NavLink = ({ href, label, icon: Icon, children, collapsible }: NavItem) => {
    const hasChildren = children && children.length > 0;
    const isActive = href ? pathname === href : false;
    const isMenuOpen = openMenus.has(label);
    const isChildActive = children?.some(child => child.href === pathname);

    if (hasChildren) {
      if (collapsible) {
        // Collapsible dropdown (Settings)
        return (
          <div className="mx-2">
            <button
              onClick={() => toggleMenu(label)}
              className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
                isChildActive
                  ? 'bg-[#123B70]/10 text-[#123B70]'
                  : 'text-muted-foreground hover:bg-[#123B70]/10 hover:text-[#123B70]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMenuOpen && (
              <div className="ml-4 mt-1 space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {children.map((child) => (
                  <NavLink key={child.href} {...child} />
                ))}
              </div>
            )}
          </div>
        );
      } else {
        // Always expanded header (Visitors)
        return (
          <div className="mx-2">
            <div className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              isChildActive
                ? 'text-[#123B70]'
                : 'text-muted-foreground'
            }`}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </div>
            <div className="ml-4 mt-1 space-y-1">
              {children.map((child) => (
                <NavLink key={child.href} {...child} />
              ))}
            </div>
          </div>
        );
      }
    }

    return (
      <Link
        href={href!}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2 ${
          isActive
            ? 'bg-[#123B70] text-white shadow-md'
            : 'text-muted-foreground hover:bg-[#123B70]/10 hover:text-[#123B70]'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-[260px] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:w-[220px] lg:transform-none lg:block lg:h-screen lg:overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full py-4">
          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <NavLink key={item.href || item.label + index} {...item} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
