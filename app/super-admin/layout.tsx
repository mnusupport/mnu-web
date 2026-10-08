'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authApi, type AuthUser } from '@/lib/api';
import { resolveLanding } from '@/lib/roleRouting';

const NAV = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/super-admin/restaurants', label: 'All Restaurants', icon: '▤' },
  { href: '/super-admin/feedback', label: 'Customer Feedback', icon: '◔' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Frontend route protection is UX only; every /super-admin API call is
  // re-authorized server-side (JwtAuthGuard + SuperAdminGuard).
  useEffect(() => {
    if (!localStorage.getItem('mnu_token')) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    authApi.me().then((res) => {
      if (cancelled) return;
      if (res.platformRole !== 'SUPER_ADMIN') {
        // A signed-in Restaurant Admin who types a /super-admin URL is sent
        // back to their own panel, never shown platform pages.
        const landing = resolveLanding(res.platformRole, res.memberships);
        router.replace(landing.kind === 'redirect' ? landing.href : '/');
        return;
      }
      setUser(res.user);
    }).catch(() => {
      if (cancelled) return;
      localStorage.removeItem('mnu_token');
      router.replace('/');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [router]);

  if (loading || !user) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-400">Loading Super Admin...</main>;

  const logout = () => {
    authApi.logout().finally(() => {
      localStorage.removeItem('mnu_token');
      router.replace('/');
    });
  };

  return (
    <div className="min-h-screen bg-ink-900 text-white md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#171513] px-4 py-6 md:block">
        <div className="mb-8 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">MnU Platform</p>
          <h1 className="mt-2 text-lg font-bold">Super Admin</h1>
          <p className="mt-1 text-xs text-white/45">Platform control</p>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}><span>{item.icon}</span>{item.label}</Link>;
          })}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-5 space-y-2">
          <p className="px-2 text-xs text-white/40">Future modules</p>
          {['POS Partners', 'CRM', 'Menu Engineering', 'Personalisation', 'Platform Analytics'].map((label) => <div key={label} className="rounded-xl px-3 py-2 text-sm text-white/30">{label}</div>)}
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-cream-100 text-ink-900">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-4 md:px-8">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Super Admin</p><p className="text-sm font-semibold text-ink-900">{user.name}</p></div>
          <div className="flex items-center gap-3"><button onClick={logout} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-red-300 hover:text-red-600">Logout</button></div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
