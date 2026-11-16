'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Calendar, AlertOctagon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === '/admin/dashboard') {
      return [{ label: 'Dashboard', href: '/admin/dashboard' }];
    }

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin/dashboard' }
    ];

    segments.forEach((segment, index) => {
      if (segment === 'admin') return;

      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (pathname === '/admin/login') {
    return null;
  }

  const isDashboard = pathname === '/admin/dashboard';
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb path */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/admin/dashboard"
            className="hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.slice(1).map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 shrink-0" />
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    index === breadcrumbs.length - 2 && "text-foreground font-medium"
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Desktop Quick Actions: arranged to the right of the breadcrumb */}
        {isDashboard && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#123B70]" />
              <span>{todayFormatted}</span>
            </div>

            <Link
              href="/admin/visitors"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123B70] hover:bg-[#0C284E] text-white font-bold shadow-xs transition hover:-translate-y-0.5"
            >
              <Users className="w-3.5 h-3.5 text-[#E5A823]" />
              <span>Visitors Directory</span>
            </Link>

            <Link
              href="/admin/emergency"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs shadow-rose-600/20 transition hover:-translate-y-0.5"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-white" />
              <span>Emergency Evac Roster</span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Quick Actions: clean modern position below the breadcrumb */}
      {isDashboard && (
        <div className="flex md:hidden flex-wrap items-center gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 font-semibold border border-slate-200 text-[11px]">
            <Calendar className="w-3 h-3 text-[#123B70]" />
            <span>{todayFormatted}</span>
          </div>

          <Link
            href="/admin/visitors"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#123B70] text-white font-bold text-[11px]"
          >
            <Users className="w-3 h-3 text-[#E5A823]" />
            <span>Visitors</span>
          </Link>

          <Link
            href="/admin/emergency"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
          >
            <AlertOctagon className="w-3 h-3 text-white" />
            <span>Emergency Evac</span>
          </Link>
        </div>
      )}
    </div>
  );
}
