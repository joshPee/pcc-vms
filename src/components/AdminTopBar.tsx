'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings, Menu } from 'lucide-react';

interface AdminTopBarProps {
  onMobileMenuToggle?: () => void;
}

export default function AdminTopBar({ onMobileMenuToggle }: AdminTopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const handleSignOut = () => {
    setConfirmingLogout(true);
  };

  const confirmLogout = () => {
    setShowProfileMenu(false);
    setConfirmingLogout(false);
    window.location.href = '/api/auth/signout?callbackUrl=/admin/login';
  };

  const cancelLogout = () => {
    setConfirmingLogout(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-3 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-16 w-16 flex items-center justify-center">
              <img src="/pcc.png" alt="PCC Logo" className="object-contain w-full h-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-blue-700">PCC-VMS</p>
              <p className="text-[10px] text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground ml-2 md:ml-8">
            <span className="hidden md:inline">{greeting}, Administrator</span>
            <span className="md:hidden">{greeting}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-8 px-2 gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Admin</span>
            </Button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setConfirmingLogout(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  {confirmingLogout ? (
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium text-gray-900">Confirm logout?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelLogout}
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmLogout}
                          className="flex-1 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 rounded-md text-white"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 rounded-md"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
