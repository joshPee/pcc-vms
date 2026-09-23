'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckOut() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin check-out page
    router.replace('/admin/check-out');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to secure check-out...</p>
      </div>
    </div>
  );
}
