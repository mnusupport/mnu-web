'use client';

import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/api';

// Staff-side status timeline. Replaces the old row of "Mark as ..." buttons:
// the order's progress is shown as a vertical timeline and staff advance it by
// tapping the next step on the timeline itself. Only steps that
// ORDER_STATUS_TRANSITIONS allows from the current status are tappable, so the
// UI can never send a transition the API would reject.
const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'NEW', label: 'Order placed', hint: 'Waiting for the kitchen' },
  { status: 'CONFIRMED', label: 'Confirmed', hint: 'Accepted by staff' },
  { status: 'PREPARING', label: 'Preparing', hint: 'Being cooked' },
  { status: 'READY', label: 'Ready', hint: 'Ready to serve / pick up' },
  { status: 'COMPLETED', label: 'Completed', hint: 'Served and closed' },
];

const INDEX: Record<OrderStatus, number> = { NEW: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, COMPLETED: 4, CANCELLED: -1 };

export function OrderStatusStepper({ status, updating, onChange }: {
  status: OrderStatus;
  updating: OrderStatus | null;
  onChange: (next: OrderStatus) => void;
}) {
  if (status === 'CANCELLED') {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="text-[11px] font-bold uppercase tracking-[.14em]">Order cancelled</p>
        <p className="mt-1 text-sm">This order is closed and can&apos;t be changed further.</p>
      </div>
    );
  }

  const current = INDEX[status];
  const allowed = ORDER_STATUS_TRANSITIONS[status];
  const busy = updating !== null;
  const canCancel = allowed.includes('CANCELLED');

  return (
    <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-ink-400">Order progress</p>
      <ol className="mt-3">
        {STEPS.map((step, index) => {
          const done = index < current;
          const isCurrent = index === current;
          const next = allowed.includes(step.status);
          const saving = updating === step.status;
          const last = index === STEPS.length - 1;

          const marker = (
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                done || (isCurrent && status === 'COMPLETED')
                  ? 'border-green-500 bg-green-500 text-white'
                  : isCurrent
                    ? 'border-brand-500 bg-brand-500 text-white ring-4 ring-brand-50'
                    : next
                      ? 'border-brand-500 bg-white text-brand-500'
                      : 'border-ink-200 bg-white text-ink-200'
              }`}
            >
              {done || (isCurrent && status === 'COMPLETED') ? '✓' : saving ? '…' : index + 1}
            </span>
          );

          const text = (
            <span className="min-w-0 text-left">
              <span className={`block text-sm font-semibold ${isCurrent ? 'text-ink-900' : done ? 'text-ink-700' : next ? 'text-ink-900' : 'text-ink-200'}`}>
                {step.label}
                {isCurrent && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-600">Current</span>}
              </span>
              <span className="block text-xs text-ink-400">
                {saving ? 'Saving…' : next ? `Tap to mark as ${step.label}` : step.hint}
              </span>
            </span>
          );

          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                {marker}
                {!last && <span className={`my-1 w-0.5 flex-1 ${index < current ? 'bg-green-400' : 'bg-ink-100'}`} style={{ minHeight: 22 }} />}
              </div>
              {next ? (
                <button
                  type="button"
                  onClick={() => onChange(step.status)}
                  disabled={busy}
                  className="-mt-1 mb-2 flex-1 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2 text-left transition hover:bg-brand-50 disabled:opacity-50"
                  aria-label={`Mark order as ${step.label}`}
                >
                  {text}
                </button>
              ) : (
                <div className="-mt-0.5 mb-3 flex-1 px-3 py-1">{text}</div>
              )}
            </li>
          );
        })}
      </ol>

      {canCancel && (
        <button
          type="button"
          onClick={() => { if (window.confirm('Cancel this order? This can\'t be undone.')) onChange('CANCELLED'); }}
          disabled={busy}
          className="mt-1 text-xs font-semibold text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {updating === 'CANCELLED' ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </div>
  );
}
