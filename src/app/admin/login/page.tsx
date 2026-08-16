'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        setShowToast(true);
        setTimeout(() => {
          router.push('/admin/dashboard');
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-slate-200 rounded-lg shadow-sm">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4">
            <img src="/qcc.png" alt="QCC Logo" className="object-contain w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            HR Admin Login
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Secure access to meeting management
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#123B70] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#123B70] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#123B70] hover:bg-[#0d2d52] focus:outline-none focus:ring-2 focus:ring-[#123B70] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
      
      {showToast && (
        <Toast variant="success" className="flex items-center gap-2">
          <span className="text-sm">Login successful! Redirecting...</span>
        </Toast>
      )}
    </div>
  );
}
