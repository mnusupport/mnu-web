'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  platformAdminApi,
  type PlatformFeedbackList,
  type PlatformRestaurantList,
} from '@/lib/api';

const findingLabels = {
  EASY: 'Found it very easily',
  MOSTLY: 'Found it mostly easily',
  SEARCHED: 'Had to search for it',
  COULD_NOT_FIND: "Couldn't find it",
} as const;

const decisionLabels = {
  YES: 'Definitely helped',
  A_LITTLE: 'Helped a little',
  NOT_REALLY: 'Did not really help',
  KNEW: 'Already knew what to order',
} as const;

export default function SuperAdminFeedbackPage() {
  const [data, setData] = useState<PlatformFeedbackList | null>(null);
  const [restaurants, setRestaurants] = useState<PlatformRestaurantList | null>(null);
  const [restaurantId, setRestaurantId] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setData(null);
    setError(null);
    platformAdminApi
      .listFeedback({
        page,
        limit: 20,
        ...(restaurantId ? { restaurantId } : {}),
        ...(rating ? { rating: Number(rating) } : {}),
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load customer feedback.'));
  };

  useEffect(() => {
    platformAdminApi
      .listRestaurants({ page: 1, limit: 100 })
      .then(setRestaurants)
      .catch(() => setRestaurants(null));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, restaurantId, rating]);

  const distribution = useMemo(() => data?.summary.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, [data]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Product Feedback</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">Customer Feedback</h2>
        <p className="mt-1 text-sm text-ink-400">Private platform-level feedback about MnU’s menu and ordering experience.</p>
      </div>

      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Responses" value={data ? String(data.summary.total) : '—'} helper="Customer submissions" />
        <MetricCard label="Average rating" value={data ? `${data.summary.averageRating}/5` : '—'} helper="Menu experience" />
        <MetricCard label="5-star share" value={data && data.summary.total ? `${Math.round((distribution[5] / data.summary.total) * 100)}%` : '—'} helper="Strongest positive signal" />
      </div>

      <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Restaurant</label>
            <select value={restaurantId} onChange={(e) => { setPage(1); setRestaurantId(e.target.value); }} className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400">
              <option value="">All restaurants</option>
              {restaurants?.items.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Rating</label>
            <select value={rating} onChange={(e) => { setPage(1); setRating(e.target.value); }} className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400">
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink-900">What customers are telling us</h3>
            <p className="mt-1 text-xs text-ink-400">Newest feedback first. Only Super Admin can access this section.</p>
          </div>
          {data && <p className="text-xs text-ink-400">{data.total} response{data.total === 1 ? '' : 's'}</p>}
        </div>

        {!data && !error && <div className="p-10 text-center text-sm text-ink-400">Loading feedback...</div>}
        {data && data.items.length === 0 && <div className="p-10 text-center text-sm text-ink-400">No feedback matches this filter yet.</div>}

        {data?.items.map((item) => (
          <article key={item.id} className="mt-4 rounded-2xl border border-ink-100 bg-cream-100/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-ink-900">{item.restaurantName}</p>
                <p className="mt-1 text-xs text-ink-400">Order {item.orderNumber} · {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink-900 shadow-sm">{'★'.repeat(item.rating)}<span className="text-ink-300">{'★'.repeat(5 - item.rating)}</span></div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Answer label="Finding items" value={item.findingEase ? findingLabels[item.findingEase] : null} />
              <Answer label="Helping decide what to order" value={item.decisionHelp ? decisionLabels[item.decisionHelp] : null} />
              <Answer label="What was confusing or frustrating?" value={item.friction} />
              <Answer label="What would they change?" value={item.improvement} />
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-ink-900">Rating distribution</h3>
        <div className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((value) => {
            const count = distribution[value as 1 | 2 | 3 | 4 | 5];
            const width = data?.summary.total ? Math.round((count / data.summary.total) * 100) : 0;
            return (
              <div key={value} className="grid grid-cols-[48px_1fr_36px] items-center gap-3 text-xs text-ink-500">
                <span>{value} star</span>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${width}%` }} /></div>
                <span className="text-right font-semibold text-ink-700">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">Previous</button>
          <span className="text-xs text-ink-400">Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-400">{helper}</p>
    </div>
  );
}

function Answer({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink-800">{value || 'Not answered'}</p>
    </div>
  );
}
