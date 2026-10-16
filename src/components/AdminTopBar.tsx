'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, Menu } from 'lucide-react';

interface AdminTopBarProps {
  onMobileMenuToggle?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  security_officer: 'Security Officer',
  supervisor: 'Supervisor',
  sector_head: 'Sector Head',
};

function formatRole(role?: string): string {
  if (!role) return 'Staff';
  return ROLE_LABELS[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminTopBar({ onMobileMenuToggle }: AdminTopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUserName(data.name || session?.user?.name || 'Staff');
          setUserRole(formatRole(data.role || session?.user?.role));
        } else if (session?.user) {
          setUserName(session.user.name || 'Staff');
          setUserRole(formatRole(session.user.role));
        }
      } catch {
        if (session?.user) {
          setUserName(session.user.name || 'Staff');
          setUserRole(formatRole(session.user.role));
        }
      }
    };

    fetchUser();
  }, [session]);

  const handleSignOut = () => {
    setShowProfileMenu(false);
    signOut({ callbackUrl: '/admin/login', redirect: true });
  };

  if (pathname === '/admin/login') return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-3 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-10 w-10 flex items-center justify-center p-0.5 rounded-xl bg-white shadow-xs group-hover:scale-105 transition">
            <img src="/pcc.png" alt="PCC Logo" className="object-contain w-full h-full" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#123B70] leading-none">PCC-VMS</p>
            <p className="text-[10.5px] text-muted-foreground font-medium mt-0.5">Admin Management</p>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground ml-4 truncate">
          <span>{greeting},</span>
          <span className="font-medium text-foreground truncate">{userName || '...'}</span>
          {userRole && (
            <Badge variant="outline" className="text-[10px] border-[#123B70]/20 text-[#123B70] shrink-0">
              {userRole}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 px-2 gap-1.5"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs truncate max-w-[100px]">
              {userName || 'Account'}
            </span>
          </Button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
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
  );
}
