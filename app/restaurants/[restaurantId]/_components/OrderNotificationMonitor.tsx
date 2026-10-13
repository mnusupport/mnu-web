'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ordersApi, type OrderNotificationSummary } from '@/lib/api';

const POLL_INTERVAL_MS = 5_000;
type AlertOrder = OrderNotificationSummary['pendingNewOrders'][number];

export function OrderNotificationMonitor({
  restaurantId,
  userId,
  onPendingCount,
}: {
  restaurantId: string;
  userId: string;
  onPendingCount: (count: number) => void;
}) {
  const [pending, setPending] = useState<AlertOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const pendingRef = useRef<AlertOrder[]>([]);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    const audio = audioRef.current;
    if (!audio || !audio.paused) return; // Never stack overlapping chimes.
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browser permission/device failures should not break order monitoring.
    });
  }, [soundEnabled]);

  const enableSound = async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/order-ding.wav');
        audioRef.current.preload = 'auto';
        audioRef.current.volume = 0.85;
      }
      const audio = audioRef.current;
      // This play attempt happens directly in the user's click handler to
      // satisfy browsers that require a gesture before audio playback.
      await audio.play();
      setSoundEnabled(true);
      try { localStorage.setItem(`mrwiserr_order_sound:${userId}:${restaurantId}`, '1'); } catch { /* optional preference */ }
    } catch {
      setSoundEnabled(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    // Audio permission is per page session in browsers; require an explicit click after refresh.
    let timer: ReturnType<typeof setTimeout> | null = null;
    let polling = false;
    let cursor: string | undefined;
    let initialized = false;
    const poll = async () => {
      if (!mountedRef.current || polling) return;
      polling = true;
      try {
        const summary = await ordersApi.notificationSummary(restaurantId, cursor);
        if (!mountedRef.current) return;
        onPendingCount(summary.pendingCount);
        // Current NEW orders are authoritative; statuses handled since last poll disappear independently.
        const next = summary.pendingNewOrders ?? [];
        pendingRef.current = next;
        setPending(next);
        // New arrival is immediately signalled when sound has already been enabled.
        if (initialized && summary.newOrders.some((o) => o.status === 'NEW' && next.some((p) => p.id === o.id))) playChime();
        cursor = summary.serverTime;
        initialized = true;
      } catch {
        // Keep pending IDs through brief disconnections; reconcile from server on reconnect.
      } finally {
        polling = false;
        if (mountedRef.current) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') void poll(); };
    document.addEventListener('visibilitychange', onVisibility);
    void poll();
    return () => {
      mountedRef.current = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [restaurantId, userId, onPendingCount, playChime]);

  useEffect(() => {
    if (soundTimerRef.current) clearInterval(soundTimerRef.current);
    soundTimerRef.current = null;
    if (soundEnabled && pending.length > 0) {
      // One repeating alarm while at least one NEW order remains. Each poll
      // reconciles the independent queue, so accepting one does not silence others.
      playChime();
      soundTimerRef.current = setInterval(() => {
        if (pendingRef.current.length > 0) playChime();
      }, 1_700);
    }
    return () => {
      if (soundTimerRef.current) clearInterval(soundTimerRef.current);
      soundTimerRef.current = null;
    };
  }, [pending, soundEnabled, playChime]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)]">
        {!soundEnabled && <button onClick={enableSound} className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm font-bold text-ink-900 shadow-lg hover:bg-brand-50">Enable Sound Alerts</button>}
      </div>
      {pending.length > 0 && (
        <aside aria-live="assertive" className="fixed inset-x-3 bottom-16 z-50 mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-4 shadow-2xl md:inset-x-auto md:right-5 md:bottom-5 md:w-[390px]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><p className="text-xs font-extrabold uppercase tracking-wider text-red-700">Action required</p><p className="text-sm text-ink-500">{pending.length} new order{pending.length === 1 ? '' : 's'} awaiting acceptance</p></div>
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {pending.map((order) => <Link key={order.id} href={`/restaurants/${restaurantId}/orders/${order.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-300 hover:bg-brand-50">
              <span className="min-w-0"><strong className="block text-sm text-ink-900">{order.orderNumber}</strong><span className="text-xs text-ink-500">{order.itemCount} item{order.itemCount === 1 ? '' : 's'} · Open order</span></span>
              <strong className="shrink-0 text-sm text-ink-900">₹{order.total}</strong>
            </Link>)}
          </div>
          {!soundEnabled && <p className="mt-3 text-xs text-ink-500">Browsers require a click before sound can play. Enable alerts to hear repeating reminders.</p>}
        </aside>
      )}
    </>
  );
}
