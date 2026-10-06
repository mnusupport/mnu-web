import type { OrderStatus } from '@/lib/api';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'NEW', label: 'Order placed' },
  { status: 'CONFIRMED', label: 'Accepted' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'READY', label: 'Ready' },
  { status: 'COMPLETED', label: 'Completed' },
];

const INDEX: Record<OrderStatus, number> = {
  NEW: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  COMPLETED: 4,
  CANCELLED: -1,
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="text-[11px] font-bold uppercase tracking-[.16em]">Order cancelled</p>
        <p className="mt-1 text-[14px] leading-6">This order is no longer being prepared.</p>
      </div>
    );
  }

  const current = INDEX[status] ?? -1;
  if (current < 0) {
    return (
      <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="text-[11px] font-bold uppercase tracking-[.16em]">Order status</p>
        <p className="mt-1 text-[14px] leading-6">We received an unexpected status. Please try again shortly.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] bg-night p-5 text-white shadow-[0_22px_45px_-24px_rgba(0,0,0,.65)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Current status</p>
          <p className="mt-1 text-[20px] font-semibold">{STEPS[current].label}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold">{status}</span>
      </div>

      <ol className="mt-6 space-y-0">
        {STEPS.map((step, index) => {
          const done = index <= current;
          const currentStep = index === current;
          return (
            <li key={step.status} className="flex min-h-[48px] gap-3">
              <div className="flex w-5 flex-col items-center">
                <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${done ? 'border-white bg-white text-night' : 'border-white/20 text-white/30'}`}>
                  {done ? '✓' : ''}
                </span>
                {index < STEPS.length - 1 && <span className={`mt-1 h-full w-px ${index < current ? 'bg-white/70' : 'bg-white/10'}`} />}
              </div>
              <div className="pb-4">
                <p className={`text-[13px] font-semibold ${currentStep ? 'text-white' : done ? 'text-white/75' : 'text-white/35'}`}>{step.label}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
