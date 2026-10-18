'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminTopBar from '@/components/AdminTopBar';
import AdminSidebar from '@/components/AdminSidebar';
import AdminBottomBar from '@/components/AdminBottomBar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useSession } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoginPage && status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#123B70]"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
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
