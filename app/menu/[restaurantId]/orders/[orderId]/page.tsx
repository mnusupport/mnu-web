'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { menuApi, ordersApi, type CustomerOrderRecord, type OrderStatus } from '@/lib/api';
import { StageLayout } from '../../_components/StageLayout';
import { OrderStatusTimeline } from '../_components/OrderStatusTimeline';

const FINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED'];

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CustomerOrderDetailPage() {
  const params = useParams<{ restaurantId: string; orderId: string }>();
  const searchParams = useSearchParams();
  const restaurantId = params.restaurantId;
  const orderId = params.orderId;
  const table = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const [order, setOrder] = useState<CustomerOrderRecord | null>(null);
  const [restaurantName, setRestaurantName] = useState('this restaurant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contextQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (table) qs.set('table', table);
    if (tableId) qs.set('tableId', tableId);
    const value = qs.toString();
    return value ? `?${value}` : '';
  }, [table, tableId]);
  const historyHref = `/menu/${restaurantId}/orders${contextQuery}`;
  const homeHref = `/menu/${restaurantId}/home${contextQuery}`;
  const menuHref = `/menu/${restaurantId}${contextQuery}`;

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    ordersApi.customerOrder(restaurantId, orderId).then(setOrder).catch((err) => setError(err instanceof Error ? err.message : 'Could not load this order.')).finally(() => setLoading(false));
  }, [restaurantId, orderId]);

  useEffect(() => {
    menuApi.getPublicMenu(restaurantId).then((menu) => setRestaurantName(menu.restaurantName)).catch(() => undefined);
    load();
  }, [restaurantId, load]);

  // Lightweight polling only for active orders. The public detail endpoint
  // is scoped by restaurantId + orderId and stops at a terminal state.
  useEffect(() => {
    if (!order || FINAL_STATUSES.includes(order.status)) return;
    const timer = window.setInterval(() => {
      ordersApi.customerOrder(restaurantId, orderId).then(setOrder).catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [order, restaurantId, orderId]);

  if (loading) {
    return <StageLayout restaurantId={restaurantId} backHref={historyHref} backLabel="Back to orders" kicker="Order" title="Loading…" bottomPad="pb-24"><div className="space-y-4"><div className="mnu-shimmer-light h-64 rounded-[28px]" /><div className="mnu-shimmer-light h-56 rounded-[28px]" /></div></StageLayout>;
  }

  if (error || !order) {
    return (
      <StageLayout restaurantId={restaurantId} backHref={historyHref} backLabel="Back to orders" kicker="Order" title="Order unavailable" bottomPad="pb-24">
        <div className="rounded-[26px] border border-red-100 bg-red-50 p-5">
          <p className="text-[14px] font-semibold text-red-700">We couldn&apos;t find that order.</p>
          <p className="mt-1 text-[13px] leading-6 text-red-600">It may not belong to your account, may be from another restaurant, or may no longer be available.</p>
          <button type="button" onClick={load} className="mt-4 rounded-full bg-night px-5 py-3 text-[13px] font-semibold text-white">Try again</button>
        </div>
        <Link href={menuHref} className="mt-4 flex h-[52px] items-center justify-center rounded-full border border-[var(--mnu-line)] text-[14px] font-semibold text-carbon-900">Back to menu</Link>
      </StageLayout>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StageLayout restaurantId={restaurantId} backHref={historyHref} backLabel="Back to orders" kicker={order.restaurant.name} title={order.orderNumber} chip={order.status} bottomPad="pb-24">
      <div className="space-y-5">
        <OrderStatusTimeline status={order.status} />

        <section className="rounded-[26px] border border-[var(--mnu-line)] bg-white p-5">
          <div className="flex justify-between gap-4 text-[13px]">
            <div><p className="text-carbon-400">Placed</p><p className="mt-1 font-semibold text-carbon-900">{formatDate(order.createdAt)}</p></div>
            <div className="text-right"><p className="text-carbon-400">Table</p><p className="mt-1 font-semibold text-carbon-900">{order.tableNumber}</p></div>
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between"><h2 className="mnu-display text-[1.65rem] text-carbon-900">Your items</h2><span className="text-[12px] text-carbon-400">{itemCount} item{itemCount === 1 ? '' : 's'}</span></div>
          <div className="mt-3 divide-y divide-[var(--mnu-line)] rounded-[26px] border border-[var(--mnu-line)] bg-white px-5">
            {order.items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0"><p className="text-[14px] font-semibold text-carbon-900">{item.name}</p><p className="mt-1 text-[12px] text-carbon-400">₹{item.price} × {item.quantity}</p></div>
                <p className="shrink-0 text-[14px] font-semibold tabular-nums text-carbon-900">₹{item.lineTotal}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-[var(--mnu-line)] bg-white p-5 text-[14px]">
          <div className="flex justify-between text-carbon-400"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="mt-3 flex justify-between border-t border-[var(--mnu-line)] pt-3"><span className="font-semibold text-carbon-900">Total</span><span className="mnu-display text-[1.7rem] leading-none text-carbon-900">₹{order.total}</span></div>
        </section>

        {!FINAL_STATUSES.includes(order.status) && <p className="text-center text-[11px] text-carbon-400">Status updates automatically every 10 seconds.</p>}
        <Link href={menuHref} className="flex h-[52px] items-center justify-center rounded-full border border-[var(--mnu-line)] text-[14px] font-semibold text-carbon-900">Back to menu</Link>
      </div>
    </StageLayout>
  );
}
