'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { platformAdminApi, PlatformRestaurantList } from '@/lib/api';

export default function SuperAdminRestaurantsPage() {
  const [data, setData] = useState<PlatformRestaurantList | null>(null);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ restaurant_name: '', name: '', email: '', password: '' });

  const load = () => {
    setData(null);
    setError(null);
    platformAdminApi.listRestaurants({ page, limit: 20, search: activeSearch })
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load restaurants.'));
  };

  useEffect(load, [page, activeSearch]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const createRestaurant = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const result = await platformAdminApi.createRestaurant(form);
      setForm({ restaurant_name: '', name: '', email: '', password: '' });
      setCreateSuccess(`Restaurant “${result.restaurant.name}” created. Admin login: ${result.admin.email}`);
      load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Could not create restaurant.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Platform</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">All Restaurants</h2>
        <p className="mt-1 text-sm text-ink-400">Create and manage restaurant records from the Super Admin panel.</p>
      </div>

      <section className="mb-7 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-ink-900">Create restaurant</h3>
          <p className="mt-1 text-xs text-ink-400">Only Super Admin can create a restaurant and its first Restaurant Admin account.</p>
        </div>
        {createError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{createError}</p>}
        {createSuccess && <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{createSuccess}</p>}
        <form onSubmit={createRestaurant} className="grid gap-3 sm:grid-cols-2">
          <input required value={form.restaurant_name} onChange={update('restaurant_name')} placeholder="Restaurant name" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
          <input required value={form.name} onChange={update('name')} placeholder="Restaurant admin name" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
          <input required type="email" value={form.email} onChange={update('email')} placeholder="Admin email" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
          <input required type="password" minLength={8} value={form.password} onChange={update('password')} placeholder="Initial password (8+ characters)" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400" />
          <button disabled={creating} className="rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
            {creating ? 'Creating...' : 'Create restaurant'}
          </button>
        </form>
      </section>

      <form onSubmit={e => { e.preventDefault(); setPage(1); setActiveSearch(search.trim()); }} className="mb-5 flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search restaurant name..." className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-400" />
        <button className="rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white">Search</button>
      </form>
      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1fr_120px] gap-4 border-b border-ink-100 bg-cream-100 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-400 md:grid"><span>Restaurant</span><span>Admin</span><span /></div>
        {data?.items.map(r => <div key={r.id} className="grid gap-3 border-b border-ink-100 px-5 py-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_120px] md:items-center md:gap-4"><div><p className="font-semibold text-ink-900">{r.name}</p><p className="mt-1 text-xs text-ink-400">{r.memberCount} member{r.memberCount === 1 ? '' : 's'} · Created {new Date(r.createdAt).toLocaleDateString()}</p></div><div className="text-xs text-ink-500">{r.admins.length ? r.admins.map(a => <p key={a.email}>{a.name}<br /><span className="text-ink-400">{a.email}</span></p>) : 'No admin membership found'}</div><Link href={`/restaurants/${r.id}/dashboard`} className="rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold text-white">Manage</Link></div>)}
        {data && data.items.length === 0 && <div className="p-10 text-center text-sm text-ink-400">No data available.</div>}
        {!data && !error && <div className="p-10 text-center text-sm text-ink-400">Loading restaurants...</div>}
      </div>
      {data && data.totalPages > 1 && <div className="mt-4 flex items-center justify-between"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">Previous</button><span className="text-xs text-ink-400">Page {data.page} of {data.totalPages}</span><button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">Next</button></div>}
    </div>
  );
}
