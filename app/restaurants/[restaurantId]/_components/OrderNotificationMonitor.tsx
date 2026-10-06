'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ordersApi, type OrderNotificationSummary } from '@/lib/api';

const POLL_INTERVAL_MS = 10_000;
const STORAGE_PREFIX = 'mnu_order_monitor_v1';

type MonitorState = { cursor: string; seenOrderIds: string[] };

function storageKey(userId: string, restaurantId: string) {
  return `${STORAGE_PREFIX}:${userId}:${restaurantId}`;
}

function readState(userId: string, restaurantId: string): MonitorState | null {
  try {
    const raw = localStorage.getItem(storageKey(userId, restaurantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MonitorState>;
    if (typeof parsed.cursor !== 'string' || !Array.isArray(parsed.seenOrderIds)) return null;
    return {
      cursor: parsed.cursor,
      seenOrderIds: parsed.seenOrderIds.filter((id): id is string => typeof id === 'string').slice(-500),
    };
  } catch {
    return null;
  }
}

function writeState(userId: string, restaurantId: string, state: MonitorState) {
  try {
    localStorage.setItem(storageKey(userId, restaurantId), JSON.stringify({
      cursor: state.cursor,
      seenOrderIds: state.seenOrderIds.slice(-500),
    }));
  } catch {
    // Notification state is an enhancement; polling still works if storage is unavailable.
  }
}

export function OrderNotificationMonitor({
  restaurantId,
  userId,
  onPendingCount,
}: {
  restaurantId: string;
  userId: string;
  onPendingCount: (count: number) => void;
}) {
  const [notification, setNotification] = useState<OrderNotificationSummary['newOrders'][number] | null>(null);
  const cursorRef = useRef<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const saved = readState(userId, restaurantId);
    if (saved) {
      cursorRef.current = saved.cursor;
      seenRef.current = new Set(saved.seenOrderIds);
    } else {
      // Establish the baseline before the first request. Existing pending
      // orders are shown in the badge but are not treated as newly arrived.
      cursorRef.current = new Date().toISOString();
    }

    let polling = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (!mountedRef.current || polling) return;
      polling = true;
      try {
        const summary = await ordersApi.notificationSummary(restaurantId, cursorRef.current ?? undefined);
        if (!mountedRef.current) return;

        onPendingCount(summary.pendingCount);
        const unseen = summary.newOrders.filter((order) => !seenRef.current.has(order.id));
        for (const order of summary.newOrders) seenRef.current.add(order.id);

        if (unseen.length > 0) {
          setNotification(unseen[unseen.length - 1]);
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => {
            if (mountedRef.current) setNotification(null);
          }, 7_000);
        }

        cursorRef.current = summary.serverTime;
        writeState(userId, restaurantId, {
          cursor: summary.serverTime,
          seenOrderIds: Array.from(seenRef.current),
        });
      } catch {
        // Keep the last known badge value and retry on the next interval.
      } finally {
        polling = false;
        if (mountedRef.current) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();
    return () => {
      mountedRef.current = false;
      if (timer) clearTimeout(timer);
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [restaurantId, userId, onPendingCount]);

  if (!notification) return null;

  return (
    <div className="fixed inset-x-4 bottom-5 z-50 flex justify-center md:inset-x-auto md:right-6 md:w-[360px]">
      <Link
        href={`/restaurants/${restaurantId}/orders/${notification.id}`}
        onClick={() => setNotification(null)}
        className="w-full rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_20px_50px_-18px_rgba(0,0,0,.35)] ring-1 ring-brand-100 transition hover:-translate-y-0.5"
        aria-label={`Open new order ${notification.orderNumber}`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg" aria-hidden>🔔</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">New Order</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-bold text-ink-900">{notification.orderNumber}</p>
              <p className="shrink-0 text-sm font-bold text-ink-900">₹{notification.total}</p>
            </div>
            <p className="mt-1 text-xs text-ink-400">{notification.itemCount} item{notification.itemCount !== 1 ? 's' : ''} · Tap to open order</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
