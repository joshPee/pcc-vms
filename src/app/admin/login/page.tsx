'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanIdentifier = email.trim();
      const result = await signIn('credentials', {
        email: cleanIdentifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please verify your email/username and password.');
      } else {
        setShowToast(true);
        setTimeout(() => {
          window.location.replace('/admin/dashboard');
        }, 350);
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 px-4 py-8 relative overflow-hidden">
      {/* Decorative ambient background glows using PCC colors */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#123B70]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E5A823]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* PCC Tri-Color Accent Ribbon */}
        <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden shadow-xs">
          <div className="flex-1 bg-[#123B70]" title="PCC Blue" />
          <div className="flex-1 bg-[#E5A823]" title="PCC Gold" />
          <div className="flex-1 bg-[#C5222E]" title="PCC Red" />
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white/95 backdrop-blur-xl p-7 sm:p-9 border-x border-b border-slate-200/90 rounded-b-3xl shadow-xl shadow-slate-900/5 space-y-6">
          {/* Header & Logo */}
          <div className="text-center">
            <Link href="/" className="inline-block transition hover:scale-105">
              <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center p-1 bg-white rounded-2xl shadow-xs border border-slate-100">
                <img src="/pcc.png" alt="PCC Logo" className="object-contain w-full h-full" />
              </div>
            </Link>
            <h2 className="text-xl sm:text-2xl font-black text-[#123B70] tracking-tight">
              Staff & Admin Portal
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Pentecost Convention Centre • Visitor Management
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/90 border border-red-200 text-[#C5222E] px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5222E] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Identifier Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pcc.gov.gh or admin"
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-slate-50/60 rounded-xl placeholder-slate-400 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#123B70]/30 focus:border-[#123B70] transition"
                  />
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 bg-slate-50/60 rounded-xl placeholder-slate-400 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#123B70]/30 focus:border-[#123B70] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Fill Preset Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="font-bold block text-slate-800 text-[11px]">Default Admin Demo:</span>
                <span className="font-mono text-[11px] text-slate-500 truncate block">admin@pcc.gov.gh / admin123</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@pcc.gov.gh');
                  setPassword('admin123');
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-[#123B70] hover:text-[#0C284E] bg-white hover:bg-blue-50/70 border border-slate-200 rounded-lg transition shadow-2xs shrink-0"
              >
                Auto Fill
              </button>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#123B70] hover:bg-[#0C284E] active:bg-[#081e3d] shadow-md shadow-[#123B70]/20 focus:outline-none focus:ring-2 focus:ring-[#E5A823] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition hover:-translate-y-0.5"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to VMS</span>
                    <ArrowRight className="w-4 h-4 text-[#E5A823] group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Back Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-[#123B70] transition inline-flex items-center gap-1.5"
            >
              <span>← Back to Public Visitor Kiosk</span>
            </Link>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast variant="success" className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold">Authentication successful! Opening dashboard...</span>
        </Toast>
      )}
    </div>
  );
}
