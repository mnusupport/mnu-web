'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ordersApi, billingApi, resolveImageUrl, type AdminOrderRecord, type OrderStatus, type RestaurantBillRecord, type BillPaymentMethod } from '@/lib/api';
import { readAutoPrint } from '@/lib/printPrefs';
import { useRestaurantContext } from '../../restaurant-context';
import { PrintPrefs, usePrintBill } from '../../_components/BillPrint';
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
  const [bill, setBill] = useState<RestaurantBillRecord | null>(null);
  const [billLoading, setBillLoading] = useState(true);
  const [billBusy, setBillBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<BillPaymentMethod>('CASH');
  const [billMessage, setBillMessage] = useState<string | null>(null);
  const { print, busy: printBusy, error: printError, portal } = usePrintBill(restaurantId);

  useEffect(() => {
    ordersApi
      .get(restaurantId, orderId)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order.'));
  }, [restaurantId, orderId]);

  useEffect(() => {
    billingApi.forOrder(restaurantId, orderId).then(setBill).catch((err) => setBillMessage(err instanceof Error ? err.message : 'Could not load billing status.')).finally(() => setBillLoading(false));
  }, [restaurantId, orderId]);

  const refreshBill = async () => {
    try { setBill(await billingApi.forOrder(restaurantId, orderId)); } catch (err) { setBillMessage(err instanceof Error ? err.message : 'Could not load billing status.'); }
  };
  // Explicit generate / retry. Safe to repeat: an order only ever has one bill and one invoice number.
  const generateBill = async () => { setBillBusy(true); setBillMessage(null); try { const created = await billingApi.generate(restaurantId, orderId); setBill(created); setOrder((o) => o ? { ...o, bill: { id: created._id, invoiceNumber: created.invoiceNumber, invoiceKind: created.invoiceKind, total: created.total, paymentStatus: created.paymentStatus, paymentMethod: created.payment?.method ?? null, voided: Boolean(created.voidedAt) }, billError: undefined } : o); } catch (err) { setBillMessage(err instanceof Error ? err.message : 'Could not generate bill.'); } finally { setBillBusy(false); } };
  const recordPayment = async () => {
    if (!bill || bill.paymentStatus === 'PAID' || billBusy) return;
    if (!window.confirm(`Confirm that ₹${bill.total.toFixed(2)} was received by ${paymentMethod}?`)) return;
    setBillBusy(true); setBillMessage(null);
    try { const paid = await billingApi.recordPayment(restaurantId, bill._id, paymentMethod); setBill(paid); setOrder((o) => o && o.bill ? { ...o, bill: { ...o.bill, paymentStatus: paid.paymentStatus, paymentMethod: paid.payment?.method ?? null } } : o); }
    catch (err) { setBillMessage(err instanceof Error ? err.message : 'Could not record payment.'); await refreshBill(); }
    finally { setBillBusy(false); }
  };

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
      setBillMessage(updated.billError ?? null);
      if (next === 'READY' || next === 'CANCELLED') await refreshBill();
      // The bill is saved first; printing is only an optional follow-up that opens the browser print dialog.
      if (next === 'READY' && updated.bill && readAutoPrint()) void print(updated.bill.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {portal}
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

          <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-4 sm:p-5" aria-label="Billing">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-ink-400">Bill</p>
                <h3 className="mt-1 text-lg font-bold text-ink-900">{bill ? bill.invoiceNumber : 'No bill yet'}</h3>
                <p className="mt-1 text-sm text-ink-500">{bill ? `Bill total ₹${bill.total.toFixed(2)}${bill.total !== order.total ? ` (order subtotal ₹${order.total}; includes service charge/tax)` : ''}` : order.status === 'READY' || order.status === 'COMPLETED' ? 'The bill was not generated automatically.' : order.status === 'CANCELLED' ? 'Cancelled orders are not billed.' : 'A bill is created automatically when this order is marked Ready.'}</p>
              </div>
              {bill && <span className={`rounded-full px-3 py-1 text-xs font-bold ${bill.voidedAt ? 'bg-red-50 text-red-700' : bill.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{bill.voidedAt ? 'VOID' : bill.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID'}</span>}
            </div>
            {(billMessage || printError) && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700" role="alert">{billMessage || printError}</p>}
            {billLoading ? <p className="mt-3 text-sm text-ink-400">Loading billing status…</p>
              : !bill ? ((order.status === 'READY' || order.status === 'COMPLETED') && <button onClick={generateBill} disabled={billBusy} className="mt-4 min-h-11 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{billBusy ? 'Generating…' : 'Generate bill'}</button>)
              : <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void print(bill._id)} disabled={printBusy} className="min-h-11 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{printBusy ? 'Preparing…' : bill.paymentStatus === 'PAID' || order.status === 'COMPLETED' ? 'Reprint bill' : 'Print bill'}</button>
                  <Link href={`/restaurants/${restaurantId}/billing/${bill._id}`} className="inline-flex min-h-11 items-center rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-800">View bill</Link>
                </div>
                {bill.voidedAt ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">This bill is void because the order was cancelled. Its number stays in the sequence; no payment can be recorded.</p>
                  : bill.paymentStatus === 'UNPAID' ? <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 p-3">
                    <label className="text-xs font-semibold text-ink-500" htmlFor="pay-method">Payment received by</label>
                    <select id="pay-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as BillPaymentMethod)} className="min-h-10 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="OTHER">Other</option></select>
                    <button onClick={recordPayment} disabled={billBusy} className="min-h-10 rounded-lg border border-brand-600 px-4 py-2 text-sm font-bold text-brand-700 disabled:opacity-50">{billBusy ? 'Saving…' : 'Confirm payment received'}</button>
                    <p className="w-full text-xs text-ink-400">The bill stays unpaid until you confirm. For UPI, check the transaction in your payment app first.</p>
                  </div>
                  : bill.payment && <p className="text-sm text-ink-600">Paid by {bill.payment.method} · ₹{bill.payment.amount.toFixed(2)} · {new Date(bill.payment.recordedAt).toLocaleString()}</p>}
                <p className="text-xs text-ink-400">Print opens your browser&apos;s print dialog; the system cannot tell whether paper came out. Reprinting never changes the invoice number, total or payment status.</p>
              </div>}
          </section>
          <div className="mt-3"><PrintPrefs /></div>
        </div>
      )}
    </div>
  );
}
