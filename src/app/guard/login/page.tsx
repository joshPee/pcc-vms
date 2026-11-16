'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { Shield, ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GuardLogin() {
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
        setError('Invalid security officer credentials. Please check your guard ID and password.');
      } else {
        setShowToast(true);
        setTimeout(() => {
          window.location.replace('/guard');
        }, 350);
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0B1528] to-slate-950 px-4 py-8 relative overflow-hidden text-white">
      {/* Decorative ambient background glows using PCC colors */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#123B70]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E5A823]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* PCC Tri-Color Accent Ribbon */}
        <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden shadow-xs">
          <div className="flex-1 bg-[#123B70]" title="PCC Blue" />
          <div className="flex-1 bg-[#E5A823]" title="PCC Gold" />
          <div className="flex-1 bg-[#C5222E]" title="PCC Red" />
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl p-7 sm:p-9 border-x border-b border-slate-800 rounded-b-3xl shadow-2xl space-y-6">
          {/* Header & Logo with Distinctive Gate Station Badge */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center p-1 bg-white rounded-2xl shadow-md border border-slate-700">
              <img src="/pcc.png" alt="PCC Logo" className="object-contain w-full h-full" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Gate Station Terminal</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              On-Duty Guard Sign In
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
              Pentecost Convention Centre • Security & Gate Control
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Identifier Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Guard Email or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guard@pcc.gov.gh"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5A823] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5A823] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-950 bg-gradient-to-r from-amber-400 to-[#E5A823] hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-500 shadow-md shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition hover:-translate-y-0.5"
              >
                {loading ? (
                  <span>Authorizing Gate Session...</span>
                ) : (
                  <>
                    <span>Open Gate Station Terminal</span>
                    <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick link to Admin Portal */}
          <div className="pt-2 text-center border-t border-slate-800">
            <Link
              href="/admin/login"
              className="text-xs font-semibold text-slate-400 hover:text-white transition inline-flex items-center gap-1.5"
            >
              <span>Administrative Portal Login →</span>
            </Link>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast variant="success" className="flex items-center gap-2 bg-slate-900 text-white border-emerald-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold">Officer Authorized! Opening Gate Terminal...</span>
        </Toast>
      )}
    </div>
  );
}
