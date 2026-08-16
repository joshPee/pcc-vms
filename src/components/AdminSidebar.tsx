'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, UserCheck, ClipboardList, BarChart3, Building2, Calendar, Users, Scan } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/participants', label: 'Participants', icon: Users },
  { href: '/admin/check-in', label: 'Check-In', icon: Scan },
  { href: '/admin/attendance', label: 'Attendance', icon: BarChart3 },
  { href: '/admin/meetings', label: 'Meetings', icon: Calendar },
];

export default function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen: boolean; setMobileMenuOpen: (open: boolean) => void }) {
  const pathname = usePathname();

  // Don't render sidebar on the login page
  if (pathname === '/admin/login') {
    return null;
  }

  const NavLink = ({ href, label, icon: Icon }: NavItem) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
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
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
