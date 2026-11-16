'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { Shield, ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/25 to-slate-100 px-4 py-8 relative overflow-hidden text-slate-900">
      {/* Decorative ambient background glows using PCC green & gold */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E5A823]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* PCC Tri-Color Accent Ribbon */}
        <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden shadow-xs">
          <div className="flex-1 bg-[#123B70]" title="PCC Blue" />
          <div className="flex-1 bg-[#E5A823]" title="PCC Gold" />
          <div className="flex-1 bg-[#C5222E]" title="PCC Red" />
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white/95 backdrop-blur-xl p-7 sm:p-9 border-x border-b border-slate-200/90 rounded-b-3xl shadow-xl shadow-slate-900/5 space-y-6">
          {/* Header & Logo with Distinctive Gate Station Badge */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center p-1 bg-white rounded-2xl shadow-xs border border-slate-100">
              <img src="/pcc.png" alt="PCC Logo" className="object-contain w-full h-full" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gate Station Terminal</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#123B70] tracking-tight">
              On-Duty Guard Sign In
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Pentecost Convention Centre • Security & Gate Control
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
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Guard Email or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#123B70] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#123B70] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
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
                className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-md shadow-emerald-700/20 focus:outline-none focus:ring-2 focus:ring-[#E5A823] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition hover:-translate-y-0.5"
              >
                {loading ? (
                  <span>Authorizing Gate Session...</span>
                ) : (
                  <>
                    <span>Open Gate Station Terminal</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showToast && (
        <Toast variant="success" className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold">Officer Authorized! Opening Gate Terminal...</span>
        </Toast>
      )}
    </div>
  );
}
