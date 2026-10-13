import type { OrderStatus } from '@/lib/api';

// Compact 4-step progress strip for order cards: Placed, Accepted, Preparing,
// Ready. A completed order fills all four; cancelled orders show nothing here.
const STEPS: OrderStatus[] = ['NEW', 'CONFIRMED', 'PREPARING', 'READY'];
const LABELS = ['Placed', 'Accepted', 'Preparing', 'Ready'];

export function OrderProgressBar({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return null;
  const reached = status === 'COMPLETED' ? STEPS.length - 1 : STEPS.indexOf(status);
  return (
    <div className="mt-4" aria-hidden="true">
      <div className="flex gap-1.5">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              i < reached ? 'bg-night' : i === reached ? (status === 'COMPLETED' ? 'bg-night' : 'animate-pulse bg-amber-500') : 'bg-[var(--mnu-line)]'
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-carbon-400">
        {LABELS.map((label, i) => (
          <span key={label} className={i === reached ? 'font-semibold text-carbon-900' : ''}>{label}</span>
        ))}
      </div>
    </div>
  );
}
