'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { resolveLanding } from '@/lib/roleRouting';

// Ported from mnu_v1 to replace a stale stub that predated this file:
// the previous version deliberately never called the real backend (it
// posted with a bare fetch() and always caught into a hardcoded "not
// built yet" message), and even if it had succeeded, it stored the token
// under localStorage['auth_token'] while the rest of the app (lib/api.ts,
// /dashboard) reads localStorage['mnu_token'] — a second bug that would
// have broken the session regardless. This version uses authApi and the
// same 'mnu_token' key as everywhere else.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { token, platformRole, memberships } = await authApi.login({ email, password });
      // ONE login for everyone. The backend authenticates the credentials
      // and tells us the account's role; we only use that to pick the landing
      // page (Super Admin panel vs the account's restaurant). There is no
      // role selector and no separate Super Admin sign-in. Real authorization
      // is enforced server-side on every API request.
      //
      // Restaurant users go straight to their restaurant dashboard (a
      // multi-restaurant admin gets the switcher in the restaurant layout).
      const landing = resolveLanding(platformRole, memberships);
      if (landing.kind === 'no-restaurant') {
        // Don't leave a half-signed-in session behind for an account that has
        // nowhere to land.
        setError('Your account isn\u2019t linked to a restaurant yet.');
        return;
      }
      localStorage.setItem('mnu_token', token);
      router.push(landing.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-xl text-white">
            🍴
          </div>
          <h1 className="text-xl font-bold text-ink-900">Sign in</h1>
          <p className="mt-1 text-sm text-ink-400">Sign in to your MnU account</p>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-ink-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              placeholder="you@restaurant.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-400">
          New restaurant?{' '}
          <a href="/register" className="font-semibold text-brand-500">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
