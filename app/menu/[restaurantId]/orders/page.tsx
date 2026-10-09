'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { menuApi, type CustomerOrderRecord, type OrderStatus } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { markOrdersSeen, useMyOrders } from '@/lib/myOrders';
import { CustomerBottomNav } from '../_components/CustomerBottomNav';
import { StageLayout } from '../_components/StageLayout';

const STATUS_COPY: Record<OrderStatus, { label: string; hint: string }> = {
  NEW: { label: 'Order placed', hint: 'Waiting for the kitchen to accept it' },
  CONFIRMED: { label: 'Accepted', hint: 'The kitchen has accepted your order' },
  PREPARING: { label: 'Preparing', hint: 'Your food is being prepared' },
  READY: { label: 'Ready', hint: 'Your order is ready!' },
  COMPLETED: { label: 'Completed', hint: 'Enjoy your meal' },
  CANCELLED: { label: 'Cancelled', hint: 'This order was cancelled' },
};

// Customer Orders tab (4th item of the bottom nav). Live orders are pinned
// at the top with a blinking indicator that updates by itself; everything
// else is listed below as past orders. Orders come from this browser's
// own placed orders, plus the server-side history when the customer has
// identified themselves.
export default function CustomerOrdersPage() {
  const params = useParams<{ restaurantId: string }>();
  const searchParams = useSearchParams();
  const restaurantId = params.restaurantId;
  const table = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const { liveOrders, pastOrders, loading, error, refresh } = useMyOrders(restaurantId);
  const { count, subtotal } = useCart(restaurantId);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const contextQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (table) qs.set('table', table);
    if (tableId) qs.set('tableId', tableId);
    const value = qs.toString();
    return value ? `?${value}` : '';
  }, [table, tableId]);
  const menuHref = `/menu/${restaurantId}${contextQuery}`;
  const homeHref = `/menu/${restaurantId}/home${contextQuery}`;
  const cartHref = `/menu/${restaurantId}/cart${contextQuery}`;
  const ordersHref = `/menu/${restaurantId}/orders${contextQuery}`;

  useEffect(() => {
    menuApi.getPublicMenu(restaurantId).then((m) => setRestaurantName(m.restaurantName)).catch(() => undefined);
  }, [restaurantId]);

  // Opening the tab acknowledges finished orders, which clears the green
  // "completed" dot on the nav.
  useEffect(() => {
    const done = pastOrders.filter((o) => o.status === 'COMPLETED').map((o) => o.id);
    if (done.length) markOrdersSeen(restaurantId, done);
  }, [pastOrders, restaurantId]);

  const orderHref = (id: string) => `/menu/${restaurantId}/orders/${id}${contextQuery}`;
  const hasAny = liveOrders.length + pastOrders.length > 0;

  return (
    <StageLayout
      restaurantId={restaurantId}
      backHref={menuHref}
      backLabel="Back to menu"
      kicker={restaurantName ?? 'Orders'}
      title="Orders"
      chip={table ? `Table ${table}` : 'Takeaway'}
      bottomPad="pb-40"
      footer={
        <CustomerBottomNav
          restaurantId={restaurantId}
          homeHref={homeHref}
          menuHref={menuHref}
          cartHref={cartHref}
          ordersHref={ordersHref}
          active="orders"
          cartCount={count}
          cartSubtotal={subtotal}
        />
      }
    >
      {loading ? (
        <div className="space-y-4" aria-busy="true"><div className="mnu-shimmer-light h-28 rounded-[26px]" /><div className="mnu-shimmer-light h-20 rounded-[26px]" /></div>
      ) : error && !hasAny ? (
        <div className="rounded-[26px] border border-red-100 bg-red-50 p-5">
          <p className="text-[14px] font-semibold text-red-700">We couldn&apos;t load your orders.</p>
          <p className="mt-1 text-[13px] leading-6 text-red-600">{error}</p>
          <button type="button" onClick={() => refresh()} className="mt-4 rounded-full bg-night px-5 py-3 text-[13px] font-semibold text-white">Try again</button>
        </div>
      ) : hasAny ? (
        <div className="space-y-8 animate-fade-slide-up">
          {liveOrders.length > 0 && (
            <section aria-label="Live orders" className="space-y-3">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-carbon-400">
                <LiveDot ready={liveOrders.some((o) => o.status === 'READY')} /> Live now
              </h2>
              {liveOrders.map((order) => (
                <OrderCard key={order.id} order={order} href={orderHref(order.id)} live />
              ))}
            </section>
          )}

          {pastOrders.length > 0 && (
            <section aria-label="Past orders" className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[.16em] text-carbon-400">Past orders</h2>
              {pastOrders.map((order) => (
                <OrderCard key={order.id} order={order} href={orderHref(order.id)} />
              ))}
            </section>
          )}
        </div>
      ) : (
        <div className="flex min-h-[46vh] animate-fade-slide-up flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mnu-card)] text-2xl ring-1 ring-[var(--mnu-line)]">🧾</div>
          <h2 className="mnu-display mt-7 text-[2rem] leading-none text-carbon-900">No orders yet</h2>
          <p className="mt-3 max-w-[280px] text-[14px] leading-6 text-carbon-400">Orders you place here will show up with live status, and move to past orders when finished.</p>
          <Link href={menuHref} className="mt-7 flex h-[52px] items-center rounded-full bg-night px-7 text-[14px] font-semibold text-white transition active:scale-95">Explore the menu</Link>
        </div>
      )}
    </StageLayout>
  );
}

function LiveDot({ ready }: { ready: boolean }) {
  const color = ready ? 'bg-emerald-400' : 'bg-amber-400';
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      <span className={`absolute inline-flex h-full w-full animate-ping-soft rounded-full ${color}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 animate-blink rounded-full ${color}`} />
    </span>
  );
}

function OrderCard({ order, href, live = false }: { order: CustomerOrderRecord; href: string; live?: boolean }) {
  const copy = STATUS_COPY[order.status] ?? { label: order.status, hint: '' };
  const ready = order.status === 'READY';
  const cancelled = order.status === 'CANCELLED';
  const badge = live
    ? ready
      ? 'bg-emerald-500 text-white'
      : 'bg-amber-400 text-night'
    : cancelled
      ? 'bg-red-50 text-red-600'
      : 'bg-[var(--mnu-card)] text-carbon-600';
  return (
    <Link
      href={href}
      className={`block rounded-[26px] border bg-white p-5 transition active:scale-[.99] ${live ? (ready ? 'border-emerald-300 shadow-[0_18px_40px_-24px_rgba(16,185,129,.7)]' : 'border-amber-300 shadow-[0_18px_40px_-24px_rgba(245,158,11,.7)]') : 'border-[var(--mnu-line)]'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-carbon-400">
            {new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="mt-2 text-[16px] font-semibold text-carbon-900">{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[.08em] ${badge} ${live ? 'animate-blink' : ''}`}>
          {copy.label}
        </span>
      </div>
      {live && <p className="mt-3 text-[13px] text-carbon-600">{copy.hint}</p>}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--mnu-line)] pt-4">
        <span className="text-[13px] text-carbon-400">{order.orderNumber}</span>
        <span className="font-semibold tabular-nums text-carbon-900">₹{order.total}</span>
      </div>
    </Link>
  );
}
