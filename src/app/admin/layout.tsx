'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminTopBar from '@/components/AdminTopBar';
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#123B70]"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950 flex-col">
      {/* Top Header */}
      <AdminTopBar />

      {/* Main Full-Width Content Container with Bottom Clearance for the Floating Bar */}
      <main className="flex-1 w-full pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumb />
        </div>
        {children}
      </main>

      {/* Modern Bottom Floating Navigation Bar & More... Modal */}
      <AdminBottomBar />
    </div>
  );
}
