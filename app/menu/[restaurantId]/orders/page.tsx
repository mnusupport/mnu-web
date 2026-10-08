'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { menuApi, ordersApi, type CustomerOrderHistoryResponse } from '@/lib/api';
import { getRecognitionToken } from '@/lib/customerRecognition';
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
    const token = getRecognitionToken(restaurantId);
    if (!token) {
      setData({ restaurant: { id: restaurantId, name: 'Orders' }, customer: null, orders: [] });
      setLoading(false);
      return;
    }
    ordersApi.customerHistory(restaurantId, token)
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
      ) : data?.orders.length ? (
        <div className="space-y-4 animate-fade-slide-up">
          {data.orders.map((order) => (
            <Link key={order.id} href={`/menu/${restaurantId}/orders/${order.id}${contextQuery}`} className="block rounded-[26px] border border-[var(--mnu-line)] bg-white p-5 transition active:scale-[.99]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-carbon-400">{new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                  <p className="mt-2 text-[16px] font-semibold text-carbon-900">{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--mnu-card)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-carbon-600">{order.status}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--mnu-line)] pt-4">
                <span className="text-[13px] text-carbon-400">{order.orderNumber}</span>
                <span className="font-semibold tabular-nums text-carbon-900">₹{order.total}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[46vh] animate-fade-slide-up flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mnu-card)] text-2xl ring-1 ring-[var(--mnu-line)]">✓</div>
          <h2 className="mnu-display mt-7 text-[2rem] leading-none text-carbon-900">No orders yet</h2>
          <p className="mt-3 max-w-[280px] text-[14px] leading-6 text-carbon-400">Your orders from this restaurant will appear here after you identify yourself.</p>
          <Link href={menuHref} className="mt-7 flex h-[52px] items-center rounded-full bg-night px-7 text-[14px] font-semibold text-white transition active:scale-95">Back to menu</Link>
        </div>
      )}
    </StageLayout>
  );
}
