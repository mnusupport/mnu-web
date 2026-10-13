import type { OrderStatus } from './api';

// Remembers, on this device only, which orders a diner placed at each
// restaurant. It powers two customer-menu features without needing a login:
//   1. the "live order" notification above the bottom nav (last order), and
//   2. the Orders tab's list, so past orders show up even if the diner never
//      gave a phone number (server-side history needs a recognition token).
// Only order ids and a "notice dismissed" flag are stored: no names, phones
// or tokens. Every read/write is wrapped, because storage can be blocked
// (private mode) and must never break ordering.
const MAX_REMEMBERED = 20;

interface StoredOrders {
  ids: string[]; // newest first
  dismissed: string[]; // finished orders whose notification was closed
}

const key = (restaurantId: string) => `mnu_orders_${restaurantId}`;

function read(restaurantId: string): StoredOrders {
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (!raw) return { ids: [], dismissed: [] };
    const parsed = JSON.parse(raw) as Partial<StoredOrders>;
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((v) => typeof v === 'string') : [],
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed.filter((v) => typeof v === 'string') : [],
    };
  } catch {
    return { ids: [], dismissed: [] };
  }
}

function write(restaurantId: string, value: StoredOrders) {
  try {
    localStorage.setItem(key(restaurantId), JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('mnu-orders-changed', { detail: restaurantId }));
  } catch {
    /* storage unavailable: the feature simply stays off */
  }
}

export function rememberOrder(restaurantId: string, orderId: string) {
  if (typeof window === 'undefined' || !orderId) return;
  const current = read(restaurantId);
  const ids = [orderId, ...current.ids.filter((id) => id !== orderId)].slice(0, MAX_REMEMBERED);
  write(restaurantId, { ids, dismissed: current.dismissed.filter((id) => ids.includes(id)) });
}

export function getRememberedOrderIds(restaurantId: string): string[] {
  if (typeof window === 'undefined') return [];
  return read(restaurantId).ids;
}

export function isOrderNoticeDismissed(restaurantId: string, orderId: string): boolean {
  if (typeof window === 'undefined') return false;
  return read(restaurantId).dismissed.includes(orderId);
}

export function dismissOrderNotice(restaurantId: string, orderId: string) {
  if (typeof window === 'undefined') return;
  const current = read(restaurantId);
  if (current.dismissed.includes(orderId)) return;
  write(restaurantId, { ...current, dismissed: [...current.dismissed, orderId] });
}

export const FINAL_ORDER_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED'];
export const isFinalStatus = (status: OrderStatus) => FINAL_ORDER_STATUSES.includes(status);

// Plain-language names for diners (the raw enum values are internal).
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Order placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export type LiveOrderPhase = 'active' | 'ready' | 'completed' | 'cancelled';

export function phaseOf(status: OrderStatus): LiveOrderPhase {
  if (status === 'READY') return 'ready';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  return 'active';
}
