'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ordersApi, resolveImageUrl, type AdminOrderRecord, type OrderStatus } from '@/lib/api';
import { useRestaurantContext } from '../../restaurant-context';
import { StatusBadge } from '../_components/StatusBadge';
import { OrderStatusStepper } from '../_components/OrderStatusStepper';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('91') && digits.length >= 12 ? digits.slice(2) : digits;
  if (national.length < 4) return phone;
  const masked = `${national.slice(0, 2)}${'X'.repeat(Math.max(0, national.length - 4))}${national.slice(-2)}`;
  return digits.startsWith('91') && national.length === 10 ? `+91 ${masked}` : masked;
}

export default function OrderDetailPage() {
  useRestaurantContext();
  const params = useParams<{ restaurantId: string; orderId: string }>();
  const { restaurantId, orderId } = params;

  const [order, setOrder] = useState<AdminOrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<OrderStatus | null>(null);

  useEffect(() => {
    ordersApi
      .get(restaurantId, orderId)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order.'));
  }, [restaurantId, orderId]);

  // Part 2: writes the new status to MongoDB via PATCH, then updates
  // this screen from the *server's* response — not by just optimistically
  // setting local state — so what's shown here is always what's actually
  // persisted. Refresh/logout-login/reopen all read the same way, via
  // ordersApi.get()/list(), so the status can never drift back to a
  // stale value.
  const changeStatus = async (next: OrderStatus) => {
    setError(null);
    setUpdating(next);
    try {
      const updated = await ordersApi.updateStatus(restaurantId, orderId, next);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/restaurants/${restaurantId}/orders`} className="text-xs font-semibold text-ink-400">
        ← Orders
      </Link>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {!order && !error && <p className="mt-6 text-sm text-ink-400">Loading order...</p>}

      {order && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink-900">{order.orderNumber}</h2>
              {/* One order per group — this badge exists so staff know a
                  single ticket covers several diners at the table. */}
              {order.groupCode && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-600">
                  👥 Group {order.groupCode}
                </span>
              )}
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-400">
            {order.orderType === 'TAKEAWAY' ? 'Takeaway' : `Table ${order.tableNumber}`} ·{' '}
            {new Date(order.createdAt).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
          {!order.customer && order.customerName && (
            <p className="mt-1 text-xs text-ink-400">Customer · {order.customerName}</p>
          )}
          {order.groupCode && order.groupMembers?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-ink-400">Group members</p>
              <div className="mt-3 space-y-2">
                {order.groupMembers.map((member) => (
                  <div key={member.participantId} className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2">
                    <span className="text-sm font-semibold text-ink-900">{member.name}</span>
                    <span className="text-xs text-ink-400">{member.phoneMasked ?? 'Phone not provided'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.customer && (
            <p className="mt-1 text-xs text-ink-400">
              Customer {order.customer.customerCode}
              {order.customer.name ? ` · ${order.customer.name}` : ''}
              {order.customer.mobileNumber ? ` · ${maskPhone(order.customer.mobileNumber)}` : ''}
              {order.customer.email ? ` · ${order.customer.email}` : ''}
            </p>
          )}
          {!order.customer && order.customerName && (
            <p className="mt-1 text-xs text-ink-400">
              Customer · {order.customerName} · {order.customerPhoneMasked ?? 'Phone not provided'}
            </p>
          )}

          {/* Status is advanced by tapping the next step on the timeline
              (only transitions OrdersService.updateStatus accepts are
              tappable). The server response is the source of truth. */}
          <OrderStatusStepper status={order.status} updating={updating} onChange={changeStatus} />

          <div className="mt-5 divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                    {item.imageUrl ? <img src={resolveImageUrl(item.imageUrl) ?? ''} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-ink-300">No photo</div>}
                  </div>
                  <p className="font-medium text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-400">
                    ₹{item.price} × {item.quantity}
                    {/* Only present on group orders — keeps a combined
                        ticket actionable by telling staff whose dish is
                        whose. */}
                    {item.addedByName ? ` · for ${item.addedByName}` : ''}
                  </p>
                </div>
                <p className="font-semibold text-ink-900">₹{item.lineTotal}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 rounded-2xl border border-ink-100 bg-white p-4 text-sm">
            <div className="flex justify-between text-ink-400">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-1.5 text-base font-bold text-ink-900">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
