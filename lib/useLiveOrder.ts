'use client';

import { useCallback, useEffect, useState } from 'react';
import { ordersApi, type CustomerOrderRecord } from './api';
import {
  dismissOrderNotice,
  getRememberedOrderIds,
  isFinalStatus,
  isOrderNoticeDismissed,
  phaseOf,
  type LiveOrderPhase,
} from './liveOrder';

const POLL_MS = 10_000;

export interface LiveOrderState {
  order: CustomerOrderRecord | null;
  /** null = nothing to announce (no order yet, or a finished order the diner already closed). */
  phase: LiveOrderPhase | null;
  dismiss: () => void;
}

// Tracks the diner's LAST order at this restaurant. It polls only while that
// order is still in progress and the tab is visible, and stops for good once
// the order is completed or cancelled, so an idle menu makes no requests.
export function useLiveOrder(restaurantId: string): LiveOrderState {
  const [order, setOrder] = useState<CustomerOrderRecord | null>(null);
  const [dismissedTick, setDismissedTick] = useState(0);
  const [lastId, setLastId] = useState<string | null>(null);

  // Re-read the remembered id on mount and whenever a new order is placed.
  useEffect(() => {
    const sync = () => setLastId(getRememberedOrderIds(restaurantId)[0] ?? null);
    sync();
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === restaurantId) { sync(); setDismissedTick((n) => n + 1); }
    };
    window.addEventListener('mnu-orders-changed', onChange);
    return () => window.removeEventListener('mnu-orders-changed', onChange);
  }, [restaurantId]);

  useEffect(() => {
    if (!lastId) { setOrder(null); return; }
    let cancelled = false;
    let timer: number | undefined;

    const fetchOnce = async () => {
      try {
        const next = await ordersApi.customerOrder(restaurantId, lastId);
        if (cancelled) return;
        setOrder(next);
        if (!isFinalStatus(next.status)) schedule();
      } catch {
        // Order not found / offline: keep whatever we had and try again later.
        if (!cancelled) schedule();
      }
    };
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === 'visible') void fetchOnce();
        else schedule();
      }, POLL_MS);
    };
    void fetchOnce();

    // Refresh immediately when the diner comes back to this tab.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timer);
        void fetchOnce();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [restaurantId, lastId]);

  const dismiss = useCallback(() => {
    if (!order) return;
    dismissOrderNotice(restaurantId, order.id);
    setDismissedTick((n) => n + 1);
  }, [order, restaurantId]);

  void dismissedTick; // re-render trigger for the dismissed lookup below
  let phase: LiveOrderPhase | null = null;
  if (order) {
    const p = phaseOf(order.status);
    const finished = p === 'completed' || p === 'cancelled';
    phase = finished && isOrderNoticeDismissed(restaurantId, order.id) ? null : p;
  }
  return { order, phase, dismiss };
}
