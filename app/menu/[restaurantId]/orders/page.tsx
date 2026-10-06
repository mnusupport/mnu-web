'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { menuApi, ordersApi, type CustomerOrderHistoryResponse } from '@/lib/api';
import { StageLayout } from '../_components/StageLayout';

export default function CustomerOrdersPage() {
  const params = useParams<{ restaurantId: string }>();
  const searchParams = useSearchParams();
  const restaurantId = params.restaurantId;
  const table = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const [data, setData] = useState<CustomerOrderHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contextQuery = (() => {
    const qs = new URLSearchParams();
    if (table) qs.set('table', table);
    if (tableId) qs.set('tableId', tableId);
    const value = qs.toString();
    return value ? `?${value}` : '';
  })();
  const menuHref = `/menu/${restaurantId}${contextQuery}`;

  useEffect(() => {
    setLoading(true);
    setError(null);
    // This public endpoint intentionally returns an empty history because
    // anonymous ordering has no customer identity to scope history to.
    ordersApi.customerHistory(restaurantId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load orders.'))
      .finally(() => setLoading(false));
    menuApi.getPublicMenu(restaurantId).catch(() => undefined);
  }, [restaurantId]);

  return (
    <StageLayout
      restaurantId={restaurantId}
      backHref={menuHref}
      backLabel="Back to menu"
      kicker={data?.restaurant.name ?? 'Orders'}
      title="Orders"
      chip={table ? `Table ${table}` : 'Takeaway'}
      bottomPad="pb-24"
    >
      {loading ? (
        <div className="space-y-4" aria-busy="true"><div className="mnu-shimmer-light h-28 rounded-[26px]" /><div className="mnu-shimmer-light h-20 rounded-[26px]" /></div>
      ) : error ? (
        <div className="rounded-[26px] border border-red-100 bg-red-50 p-5">
          <p className="text-[14px] font-semibold text-red-700">We couldn&apos;t load this screen.</p>
          <p className="mt-1 text-[13px] leading-6 text-red-600">{error}</p>
        </div>
      ) : (
        <div className="flex min-h-[46vh] animate-fade-slide-up flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mnu-card)] text-2xl ring-1 ring-[var(--mnu-line)]">✓</div>
          <h2 className="mnu-display mt-7 text-[2rem] leading-none text-carbon-900">No saved orders</h2>
          <p className="mt-3 max-w-[280px] text-[14px] leading-6 text-carbon-400">Orders are placed without customer accounts, so this screen does not identify or retrieve a personal order history.</p>
          <Link href={menuHref} className="mt-7 flex h-[52px] items-center rounded-full bg-night px-7 text-[14px] font-semibold text-white transition active:scale-95">Back to menu</Link>
        </div>
      )}
    </StageLayout>
  );
}
