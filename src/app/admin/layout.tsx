'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminTopBar from '@/components/AdminTopBar';
import AdminSidebar from '@/components/AdminSidebar';
import AdminBottomBar from '@/components/AdminBottomBar';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/80 dark:bg-slate-950 flex-col">
      {/* Top Header */}
      <AdminTopBar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar (visible on lg:block, hidden on mobile) */}
        <AdminSidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        {/* Main Content Area */}
        {/* On desktop: full width of remaining screen with comfortable padding */}
        {/* On mobile: full width with bottom clearance for floating bottom bar */}
        <main className="flex-1 w-full min-w-0 pt-4 sm:pt-6 pb-28 lg:pb-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-4">
            <Breadcrumb />
          </div>
          {children}
        </main>
      </div>

      {/* Modern Bottom Floating Navigation Bar (Mobile / Tablet Only) */}
      <AdminBottomBar />
    </div>
  );
}
