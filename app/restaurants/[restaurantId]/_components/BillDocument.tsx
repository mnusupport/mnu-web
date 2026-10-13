'use client';
import type { RestaurantBillRecord } from '@/lib/api';
import type { PrintFormat } from '@/lib/printPrefs';

const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
// Bills are issued in the restaurant's local time regardless of the viewing device's timezone.
const stamp = (iso: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
const METHOD: Record<string, string> = { CASH: 'Cash', UPI: 'UPI', CARD: 'Card', OTHER: 'Other' };
type Part = { ratePercent: number; amount: number };

/** Renders ONLY saved bill data. Used for the on-screen view and for printing (A4 or 80 mm thermal). */
export function BillDocument({ bill, format }: { bill: RestaurantBillRecord; format: PrintFormat }) {
  const r = (bill.restaurantSnapshot ?? {}) as Record<string, unknown>;
  const o = (bill.orderSnapshot ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  const address = [r.addressLine, r.city, r.state, r.pinCode, r.country].map(str).filter(Boolean).join(', ');
  const contact = [r.contactPhone, r.contactEmail].map(str).filter(Boolean).join(' · ');
  const tb = (bill.taxBreakdown ?? {}) as { mode?: string; cgst?: Part; sgst?: Part };
  const isTax = bill.invoiceKind === 'TAX_INVOICE';
  const service = String(o.orderType) === 'TAKEAWAY' ? 'Takeaway' : `Table ${str(o.tableNumber) || '—'}`;
  const voided = Boolean(bill.voidedAt);
  const customer = str(o.customerName);
  return (
    <article className="bd" data-format={format} aria-label="Bill">
      {voided && <div className="bd-void">VOID · order cancelled</div>}
      <header className="bd-head">
        {str(r.logoUrl) && format === 'A4' && <img src={str(r.logoUrl)} alt="" className="bd-logo" />}
        <h1>{str(r.displayName) || 'Restaurant'}</h1>
        {str(r.legalBusinessName) && <p>{str(r.legalBusinessName)}</p>}
        {address && <p>{address}</p>}
        {contact && <p>{contact}</p>}
        {str(r.gstin) && <p><strong>GSTIN: {str(r.gstin)}</strong></p>}
        <p className="bd-kind">{isTax ? 'Tax Invoice' : 'Receipt'}</p>
      </header>
      <div className="bd-meta">
        <div><span>{isTax ? 'Invoice no.' : 'Bill no.'}</span><strong>{bill.invoiceNumber}</strong></div>
        <div><span>Date &amp; time</span><strong>{stamp(bill.issuedAt)}</strong></div>
        <div><span>Order</span><strong>{bill.orderNumber}</strong></div>
        <div><span>Service</span><strong>{service}</strong></div>
        {customer && <div><span>Customer</span><strong>{customer}</strong></div>}
      </div>
      <table className="bd-items">
        <thead><tr><th>Item</th><th className="n">Qty</th>{format === 'A4' && <th className="n">Rate</th>}<th className="n">Amount</th></tr></thead>
        <tbody>
          {bill.items.map((i, n) => (
            <tr key={`${i.name}-${n}`}>
              <td>{i.name}{format !== 'A4' && i.quantity > 1 ? <small> @ {money(i.unitPrice)}</small> : null}</td>
              <td className="n">{i.quantity}</td>
              {format === 'A4' && <td className="n">{money(i.unitPrice)}</td>}
              <td className="n">{money(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bd-totals">
        <div><span>Subtotal</span><span>{money(bill.subtotal)}</span></div>
        {bill.discountAmount > 0 && <div><span>Discount</span><span>−{money(bill.discountAmount)}</span></div>}
        {bill.serviceChargeAmount > 0 && <div><span>Service charge</span><span>{money(bill.serviceChargeAmount)}</span></div>}
        {bill.taxAmount > 0 && <>
          <div><span>Taxable amount</span><span>{money(bill.taxableAmount)}</span></div>
          {tb.cgst && tb.sgst
            ? <><div><span>CGST ({tb.cgst.ratePercent}%)</span><span>{money(tb.cgst.amount)}</span></div><div><span>SGST ({tb.sgst.ratePercent}%)</span><span>{money(tb.sgst.amount)}</span></div></>
            : <div><span>Tax ({bill.taxRatePercent}%)</span><span>{money(bill.taxAmount)}</span></div>}
          <div className="bd-note"><span>Prices {tb.mode === 'INCLUSIVE' ? 'include' : 'exclude'} tax</span></div>
        </>}
        <div className="bd-grand"><span>Total</span><span>{money(bill.total)}</span></div>
      </div>
      <div className="bd-pay">
        <div><span>Payment status</span><strong>{voided ? 'VOID' : bill.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID'}</strong></div>
        {bill.payment && <>
          <div><span>Method</span><strong>{METHOD[bill.payment.method] ?? bill.payment.method}</strong></div>
          <div><span>Received</span><strong>{money(bill.payment.amount)}</strong></div>
          <div><span>Paid at</span><strong>{stamp(bill.payment.recordedAt)}</strong></div>
        </>}
      </div>
      <footer className="bd-foot"><p>{str(r.receiptFooter) || 'Thank you for visiting!'}</p></footer>
    </article>
  );
}
