'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { flyToCart } from '@/lib/flyToCart';

interface QuantityControlProps {
  label: string;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  // 'round' — a single circular + that becomes a compact stepper
  // 'pill'  — a labelled "Add" pill that becomes a compact stepper
  variant?: 'pill' | 'round';
  // Sits on top of photography → light control; otherwise a dark one.
  onImage?: boolean;
}

function Plus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function Minus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// Day 28: one control, one behaviour everywhere (menu rows, lead cards,
// arch cards, Home rails). Tapping Add launches a dot that flies to the
// cart in the bottom navigation, then the button settles into a stepper
// — that is the customer's confirmation, no toast needed.
export function QuantityControl({ label, quantity, onAdd, onIncrease, onDecrease, variant = 'pill', onImage = false }: QuantityControlProps) {
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tone = onImage ? 'bg-white text-night' : 'bg-night text-white';
  const shadow = 'shadow-[0_6px_16px_-6px_rgba(0,0,0,.5)]';

  const pulse = () => {
    setJustAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustAdded(false), 420);
  };

  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    flyToCart(e.currentTarget);
    onAdd();
    pulse();
  };

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        aria-label={`Add ${label} to cart`}
        className={
          variant === 'round'
            ? `relative flex h-9 w-9 items-center justify-center rounded-full ${tone} ${shadow} transition active:scale-90 before:absolute before:-inset-1.5 before:content-['']`
            : `flex min-h-[40px] items-center gap-1.5 rounded-full px-5 text-[13px] font-semibold ${tone} ${shadow} transition active:scale-95`
        }
      >
        <Plus />
        {variant === 'pill' && 'Add'}
      </button>
    );
  }

  return (
    <div className={`flex items-center rounded-full p-0.5 ${tone} ${shadow} ${justAdded ? 'animate-pop' : ''}`}>
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Decrease ${label} quantity`}
        className="relative flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 before:absolute before:-inset-1 before:content-['']"
      >
        <Minus />
      </button>
      <span key={quantity} aria-live="polite" className="min-w-5 animate-scale-in text-center text-[14px] font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={(e) => {
          flyToCart(e.currentTarget);
          onIncrease();
          pulse();
        }}
        aria-label={`Increase ${label} quantity`}
        className="relative flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 before:absolute before:-inset-1 before:content-['']"
      >
        <Plus />
      </button>
    </div>
  );
}
