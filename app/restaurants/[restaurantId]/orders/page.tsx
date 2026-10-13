'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ordersApi, billingApi, ACTIVE_ORDER_STATUSES, resolveImageUrl, type AdminOrderRecord, type OrderStatus } from '@/lib/api';
import { useRestaurantContext } from '../restaurant-context';
import { StatusBadge } from './_components/StatusBadge';
import { readAutoPrint } from '@/lib/printPrefs';
import { PrintPrefs, usePrintBill } from '../_components/BillPrint';

type Filter = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ACTIVE', label: 'Active' }, { key: 'COMPLETED', label: 'Completed' }, { key: 'CANCELLED', label: 'Cancelled' }, { key: 'ALL', label: 'All orders' },
];
function matchesFilter(status: OrderStatus, filter: Filter) { if (filter === 'ALL') return true; if (filter === 'ACTIVE') return (ACTIVE_ORDER_STATUSES as OrderStatus[]).includes(status); return status === filter; }

export default function RestaurantOrdersPage() {
  useRestaurantContext();
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const [orders, setOrders] = useState<AdminOrderRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { print, busy: printBusy, error: printError, portal } = usePrintBill(restaurantId);

  const nextAction: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
    NEW: { status: 'PREPARING', label: 'Accept & Start Preparing' },
    CONFIRMED: { status: 'PREPARING', label: 'Start Preparing' },
    PREPARING: { status: 'READY', label: 'Mark Ready' },
    READY: { status: 'COMPLETED', label: 'Complete Order' },
  };

  const advanceOrder = async (order: AdminOrderRecord) => {
    const action = nextAction[order.status];
    if (!action || updatingOrderId) return;
    setError(null);
    setUpdatingOrderId(order.id);
    try {
      const updated = await ordersApi.updateStatus(restaurantId, order.id, action.status);
      setOrders((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? [updated]);
      // Ready: the bill is saved by the server. If it could not be created (e.g. incomplete billing settings) say so
      // clearly — the order still moved on, and the bill can be retried below or from the order page.
      if (updated.billError) setError(`${updated.orderNumber} is Ready, but its bill was not generated: ${updated.billError}`);
      else if (action.status === 'READY' && updated.bill && readAutoPrint()) void print(updated.bill.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const generateFor = async (order: AdminOrderRecord) => {
    if (updatingOrderId) return;
    setError(null); setUpdatingOrderId(order.id);
    try {
      const bill = await billingApi.generate(restaurantId, order.id);
      const summary = { id: bill._id, invoiceNumber: bill.invoiceNumber, invoiceKind: bill.invoiceKind, total: bill.total, paymentStatus: bill.paymentStatus, paymentMethod: bill.payment?.method ?? null, voided: Boolean(bill.voidedAt) };
      setOrders((current) => current?.map((item) => item.id === order.id ? { ...item, bill: summary } : item) ?? current);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not generate the bill.'); }
    finally { setUpdatingOrderId(null); }
  };

  useEffect(() => { ordersApi.list(restaurantId).then(setOrders).catch((err) => setError(err instanceof Error ? err.message : 'We could not load orders.')); }, [restaurantId]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ACTIVE: 0, COMPLETED: 0, CANCELLED: 0, ALL: orders?.length ?? 0 };
    for (const o of orders ?? []) { if ((ACTIVE_ORDER_STATUSES as OrderStatus[]).includes(o.status)) c.ACTIVE += 1; else if (o.status === 'COMPLETED') c.COMPLETED += 1; else if (o.status === 'CANCELLED') c.CANCELLED += 1; }
    return c;
  }, [orders]);
  const filtered = (orders ?? []).filter((o) => matchesFilter(o.status, filter));

  return (
    <div>
      <div className="mnu-admin-pagehead">
        <div><p className="mnu-admin-eyebrow">Service desk</p><h2 className="mnu-admin-page-title">Orders</h2><p className="mnu-admin-page-subtitle">Monitor incoming tickets and keep the floor moving.</p></div>
        <div className="mnu-admin-order-summary"><strong>{counts.ACTIVE}</strong> active right now</div>
      </div>

      <div className="mb-3"><PrintPrefs /></div>

      <div className="mnu-admin-order-tabs" role="tablist" aria-label="Order filters">
        {FILTERS.map((f) => <button key={f.key} onClick={() => setFilter(f.key)} className={`mnu-admin-order-tab ${filter === f.key ? 'is-active' : ''}`} role="tab" aria-selected={filter === f.key}>{f.label}<span>{counts[f.key]}</span></button>)}
      </div>

      {portal}
      {(error || printError) && <div className="mnu-admin-alert" role="alert">{error || printError}</div>}
      {!orders && !error && <div className="mnu-admin-panel p-8 text-center text-xs text-ink-400">Loading live orders…</div>}

      {orders && filtered.length === 0 && <div className="mnu-admin-empty mt-4"><div className="mnu-admin-empty-mark"><ReceiptIcon /></div><p className="mnu-admin-empty-title">No {filter === 'ALL' ? '' : filter.toLowerCase()} orders</p><p className="mnu-admin-empty-text">{filter === 'ACTIVE' ? 'Orders placed from customer tables or takeaway will appear here.' : 'There is nothing in this view yet.'}</p></div>}

      {orders && filtered.length > 0 && <div className="mnu-admin-order-list">
        {filtered.map((order) => (
          <article key={order.id} className="mnu-admin-order-card">
            <Link href={`/restaurants/${restaurantId}/orders/${order.id}`} className="block text-inherit no-underline">
            <div className="mnu-admin-order-card-top">
              <div className="min-w-0"><div className="flex items-center gap-2"><span className="mnu-admin-order-number">{order.orderNumber}</span><span className={`mnu-admin-type-badge ${order.orderType === 'TAKEAWAY' ? 'takeaway' : 'dinein'}`}>{order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine-in'}</span>{order.groupCode && <span className="mnu-admin-group-badge">Group</span>}</div><p className="mnu-admin-order-meta">{order.orderType === 'TAKEAWAY' ? 'Restaurant takeaway' : `Table ${order.tableNumber ?? '—'}`} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p className="mnu-admin-order-meta">Customer · {order.customer?.name ?? order.customerName ?? 'Guest'} · {order.customer?.mobileNumber ? order.customer.mobileNumber : order.customerPhoneMasked ? order.customerPhoneMasked : 'Phone not provided'}</p>{order.groupCode && order.groupMembers?.length > 0 && <p className="mnu-admin-order-meta">Group · {order.groupMembers.map((m) => `${m.name} (${m.phoneMasked ?? 'no phone'})`).join(' · ')}</p>}</div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mnu-admin-order-items">
              {order.items.slice(0, 4).map((item, index) => <div key={`${order.id}-${index}`} className="mnu-admin-order-item"><div className="mnu-admin-order-thumb">{item.imageUrl ? <img src={resolveImageUrl(item.imageUrl) ?? ''} alt="" /> : <div className="mnu-admin-thumb-fallback"><PlateIcon /></div>}</div><div className="min-w-0"><p>{item.name}</p><span>×{item.quantity} · ₹{item.lineTotal}</span></div></div>)}
              {order.items.length > 4 && <span className="mnu-admin-more-items">+{order.items.length - 4} more</span>}
            </div>
            <div className="mnu-admin-order-card-bottom"><span>{order.items.length} line item{order.items.length !== 1 ? 's' : ''}</span><strong>₹{order.total}</strong><span className="mnu-admin-view-order">View details <ArrowIcon /></span></div>
            </Link>
            {(order.status === 'READY' || order.status === 'COMPLETED') && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2">
              {order.bill ? <>
                <span className="text-xs text-ink-600"><strong>{order.bill.invoiceNumber}</strong> · ₹{order.bill.total.toFixed(2)} · <span className={order.bill.paymentStatus === 'PAID' ? 'font-bold text-green-700' : 'font-bold text-amber-700'}>{order.bill.paymentStatus === 'PAID' ? `Paid (${order.bill.paymentMethod ?? '—'})` : 'Unpaid'}</span></span>
                <button type="button" onClick={() => void print(order.bill!.id)} disabled={printBusy} className="min-h-10 rounded-lg border border-brand-600 bg-white px-4 py-2 text-xs font-bold text-brand-700 disabled:opacity-50">{order.status === 'COMPLETED' || order.bill.paymentStatus === 'PAID' ? 'Reprint bill' : 'Print bill'}</button>
              </> : <>
                <span className="text-xs text-amber-700">Bill not generated yet</span>
                <button type="button" onClick={() => void generateFor(order)} disabled={updatingOrderId !== null} className="min-h-10 rounded-lg border border-brand-600 bg-white px-4 py-2 text-xs font-bold text-brand-700 disabled:opacity-50">Generate bill</button>
              </>}
            </div>}
            {nextAction[order.status] && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
              <span className="text-xs text-ink-400">Next: {nextAction[order.status]?.label}</span>
              <button type="button" onClick={() => void advanceOrder(order)} disabled={updatingOrderId !== null} className="min-h-10 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">{updatingOrderId === order.id ? 'Updating…' : nextAction[order.status]?.label}</button>
            </div>}
          </article>
        ))}
      </div>}
    </div>
  );
}
function ReceiptIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8v-17Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>}
function PlateIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="7"/><path d="M5 12h14"/></svg>}
function ArrowIcon(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>}
