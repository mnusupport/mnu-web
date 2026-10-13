'use client';

import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/api';

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'NEW', label: 'New order', hint: 'Awaiting staff acceptance' },
  { status: 'CONFIRMED', label: 'Accepted', hint: 'Accepted by staff' },
  { status: 'PREPARING', label: 'Preparing', hint: 'Kitchen is preparing the order' },
  { status: 'READY', label: 'Ready', hint: 'Ready to serve or collect' },
  { status: 'COMPLETED', label: 'Completed', hint: 'Order served and closed' },
];
const INDEX: Record<OrderStatus, number> = { NEW: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, COMPLETED: 4, CANCELLED: -1 };
const NEXT_ACTION: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  NEW: { status: 'PREPARING', label: 'Accept & Start Preparing' },
  CONFIRMED: { status: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { status: 'READY', label: 'Mark Ready' },
  READY: { status: 'COMPLETED', label: 'Complete Order' },
};

export function OrderStatusStepper({ status, updating, onChange }: {
  status: OrderStatus;
  updating: OrderStatus | null;
  onChange: (next: OrderStatus) => void;
}) {
  if (status === 'CANCELLED') return <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">Order cancelled · This order is closed.</div>;
  const allowed = ORDER_STATUS_TRANSITIONS[status];
  const next = NEXT_ACTION[status];
  const busy = updating !== null;
  const canCancel = allowed.includes('CANCELLED');
  const current = INDEX[status];

  return <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-4" aria-label="Order actions">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-wider text-ink-400">Next action</p><p className="mt-1 text-sm font-semibold text-ink-900">{next ? next.label : 'Order complete'}</p></div>
      {next && allowed.includes(next.status) && <button type="button" onClick={() => onChange(next.status)} disabled={busy} className="min-h-11 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50">{updating === next.status ? 'Saving…' : next.label}</button>}
    </div>
    {canCancel && <button type="button" onClick={() => { if (window.confirm('Cancel this order? This action cannot be undone.')) onChange('CANCELLED'); }} disabled={busy} className="mt-3 text-sm font-semibold text-red-600 underline-offset-2 hover:underline disabled:opacity-50">{updating === 'CANCELLED' ? 'Cancelling…' : 'Cancel order'}</button>}
    <details className="mt-4 border-t border-ink-100 pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-ink-500">View order timeline</summary>
      <ol className="mt-3 space-y-3">
        {STEPS.map((step, index) => <li key={step.status} className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${index < current || status === step.status ? 'border-green-500 bg-green-500 text-white' : 'border-ink-200 text-ink-400'}`}>{index < current ? '✓' : index + 1}</span>
          <span><span className={`block text-sm font-semibold ${status === step.status ? 'text-ink-900' : 'text-ink-600'}`}>{step.label}{status === step.status ? ' · Current' : ''}</span><span className="text-xs text-ink-400">{step.hint}</span></span>
        </li>)}
      </ol>
    </details>
  </section>;
}
