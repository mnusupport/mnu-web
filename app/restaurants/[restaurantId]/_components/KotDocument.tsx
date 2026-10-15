'use client';
import type { AdminOrderRecord } from '@/lib/api';
import type { PrintFormat } from '@/lib/printPrefs';

// Kitchen-facing times use the restaurant's local time, like bills.
const stamp = (iso: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(iso));

/**
 * Kitchen Order Ticket. A preparation ticket only: NO prices, tax, totals, invoice number or payment status.
 * The order model currently stores no variants, add-ons or special instructions, so none can be printed;
 * when the model gains them, render them under each line here (see `.kot-for` for the pattern).
 */
export function KotDocument({ order, format, printedAt }: { order: AdminOrderRecord; format: PrintFormat; printedAt?: Date }) {
  const takeaway = order.orderType === 'TAKEAWAY';
  const totalQty = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <article className="kot" data-format={format} aria-label="Kitchen order ticket">
      <h1 className="kot-title">KITCHEN ORDER TICKET</h1>
      <p className="kot-type">{takeaway ? 'TAKEAWAY' : `DINE-IN · TABLE ${order.tableNumber ?? '—'}`}</p>
      <div className="kot-meta">
        <div><span>Order</span><strong className="kot-big">{order.orderNumber}</strong></div>
        <div><span>Placed</span><strong>{stamp(order.createdAt)}</strong></div>
        {order.groupCode && <div><span>Group order</span><strong>{order.groupCode}</strong></div>}
        {order.groupCode && order.groupMembers?.length > 0 && <div><span>Diners</span><strong>{order.groupMembers.map((m) => m.name).join(', ')}</strong></div>}
      </div>
      <ul className="kot-lines">
        {order.items.map((item, i) => (
          <li key={`${item.name}-${i}`}>
            <span className="kot-qty">{item.quantity}×</span>
            <span className="kot-name">{item.name}{item.addedByName ? <span className="kot-for">for {item.addedByName}</span> : null}</span>
          </li>
        ))}
      </ul>
      <p className="kot-foot">{order.items.length} item{order.items.length === 1 ? '' : 's'} · {totalQty} qty{printedAt ? ` · printed ${new Intl.DateTimeFormat('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(printedAt)}` : ''}</p>
    </article>
  );
}
