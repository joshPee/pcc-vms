'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings, Menu } from 'lucide-react';
import { Toast } from '@/components/ui/toast';

interface AdminTopBarProps {
  onMobileMenuToggle?: () => void;
}

export default function AdminTopBar({ onMobileMenuToggle }: AdminTopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showToast, setShowToast] = useState(false);
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
    setShowProfileMenu(false);
    setShowToast(true);
    setTimeout(() => {
      window.location.href = '/api/auth/signout';
    }, 1500);
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
            <div className="h-10 w-10 flex items-center justify-center">
              <img src="/qcc.png" alt="QCC Logo" className="object-contain w-full h-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#123B70]">QCC Training School</p>
              <p className="text-[10px] text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground ml-8">
            <span>{greeting}, Administrator</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                pathname === '/admin/dashboard' ? 'bg-[#123B70]/10 text-[#123B70] font-medium' : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/participants"
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                pathname === '/admin/participants' ? 'bg-[#123B70]/10 text-[#123B70] font-medium' : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              Participants
            </Link>
            <Link
              href="/admin/check-in"
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                pathname === '/admin/check-in' ? 'bg-[#123B70]/10 text-[#123B70] font-medium' : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              Check-In
            </Link>
            <Link
              href="/admin/attendance"
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                pathname === '/admin/attendance' ? 'bg-[#123B70]/10 text-[#123B70] font-medium' : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              Attendance
            </Link>
            <Link
              href="/admin/meetings"
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                pathname === '/admin/meetings' ? 'bg-[#123B70]/10 text-[#123B70] font-medium' : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              Meetings
            </Link>
          </nav>

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
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
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
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      
      {showToast && (
        <Toast variant="default" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Signing out...</span>
        </Toast>
      )}
    </>
  );
}
