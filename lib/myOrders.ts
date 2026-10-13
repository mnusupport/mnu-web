'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ordersApi, type CustomerOrderRecord, type OrderStatus } from '@/lib/api';
import { getRecognitionToken } from '@/lib/customerRecognition';

// Customer "Orders" tab support.
//
// Orders placed from this browser are remembered by id (per restaurant) so
// the Orders tab and the nav indicator work even when the customer never
// identified themselves with a phone number. If a recognition token exists,
// the server-side history is merged in as well, so past orders show up
// across devices. Each order is always fetched through the public,
// restaurant-scoped order endpoint — nothing here trusts client data.

const MAX_REMEMBERED = 30;
const POLL_MS = 10000;
const keyFor = (restaurantId: string) => `mrwiserr_orders_${restaurantId}`;
const seenKeyFor = (restaurantId: string) => `mrwiserr_orders_seen_${restaurantId}`;

export const LIVE_STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'PREPARING', 'READY'];
export const isLiveStatus = (s: OrderStatus) => LIVE_STATUSES.includes(s);

function readIds(restaurantId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(keyFor(restaurantId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function readSeen(restaurantId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(seenKeyFor(restaurantId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Call right after an order is created so it shows as live in the nav. */
export function rememberOrder(restaurantId: string, orderId: string) {
  try {
    const ids = [orderId, ...readIds(restaurantId).filter((id) => id !== orderId)].slice(0, MAX_REMEMBERED);
    localStorage.setItem(keyFor(restaurantId), JSON.stringify(ids));
    window.dispatchEvent(new Event('mrwiserr-orders-changed'));
  } catch {
    // Private browsing / quota: the order still exists server-side.
  }
}

/** Marks finished orders as seen so the "completed" dot clears. */
export function markOrdersSeen(restaurantId: string, orderIds: string[]) {
  try {
    const next = Array.from(new Set([...readSeen(restaurantId), ...orderIds])).slice(-60);
    localStorage.setItem(seenKeyFor(restaurantId), JSON.stringify(next));
    window.dispatchEvent(new Event('mrwiserr-orders-changed'));
  } catch {
    // ignore
  }
}

export type OrdersIndicator = 'none' | 'live' | 'ready' | 'completed';

export function useMyOrders(restaurantId: string) {
  const [orders, setOrders] = useState<CustomerOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const ordersRef = useRef<CustomerOrderRecord[]>([]);
  ordersRef.current = orders;

  const refresh = useCallback(
    async (opts?: { onlyLive?: boolean }) => {
      const ids = readIds(restaurantId);
      const token = getRecognitionToken(restaurantId);
      const byId = new Map<string, CustomerOrderRecord>();
      ordersRef.current.forEach((o) => byId.set(o.id, o));
      let failed = false;

      if (!opts?.onlyLive && token) {
        try {
          const history = await ordersApi.customerHistory(restaurantId, token);
          history.orders.forEach((o) => byId.set(o.id, o));
        } catch {
          failed = true;
        }
      }

      const toFetch = ids.filter((id) => {
        const known = byId.get(id);
        if (!known) return !opts?.onlyLive;
        return opts?.onlyLive ? isLiveStatus(known.status) : true;
      });
      await Promise.all(
        toFetch.map((id) =>
          ordersApi
            .customerOrder(restaurantId, id)
            .then((o) => byId.set(o.id, o))
            .catch(() => {
              /* an order that can't be loaded is simply skipped */
            }),
        ),
      );

      const list = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setOrders(list);
      setSeen(readSeen(restaurantId));
      setError(failed && list.length === 0 ? 'Could not load your orders.' : null);
      setLoading(false);
    },
    [restaurantId],
  );

  // Initial load + react to orders placed / seen elsewhere in this tab.
  useEffect(() => {
    setLoading(true);
    refresh();
    const onChange = () => refresh();
    window.addEventListener('mrwiserr-orders-changed', onChange);
    return () => window.removeEventListener('mrwiserr-orders-changed', onChange);
  }, [refresh]);

  const hasLive = orders.some((o) => isLiveStatus(o.status));

  // Poll only while something is live; stops by itself once all are done.
  useEffect(() => {
    if (!hasLive) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh({ onlyLive: true });
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [hasLive, refresh]);

  const liveOrders = useMemo(() => orders.filter((o) => isLiveStatus(o.status)), [orders]);
  const pastOrders = useMemo(() => orders.filter((o) => !isLiveStatus(o.status)), [orders]);
  const latestOrder = orders[0] ?? null;
  const unseenCompleted = useMemo(
    () => pastOrders.filter((o) => o.status === 'COMPLETED' && !seen.includes(o.id) && readIds(restaurantId).includes(o.id)),
    [pastOrders, seen, restaurantId],
  );

  let indicator: OrdersIndicator = 'none';
  if (liveOrders.some((o) => o.status === 'READY')) indicator = 'ready';
  else if (liveOrders.length > 0) indicator = 'live';
  else if (unseenCompleted.length > 0) indicator = 'completed';

  return { orders, liveOrders, pastOrders, latestOrder, indicator, unseenCompleted, loading, error, refresh };
}
