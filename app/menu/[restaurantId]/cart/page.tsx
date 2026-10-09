'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { CartIcon } from '../_components/icons';
import { CustomerBottomNav } from '../_components/CustomerBottomNav';
import { ItemImage } from '../_components/ItemImage';
import { GroupOrderBanner } from '../_components/GroupOrderBanner';
import { StageLayout } from '../_components/StageLayout';

// Day 28 — Cart as the calm middle of the ordering flow. Lines are
// image-led rows (no card boxes), quantity changes animate the line total,
// removal collapses the line out, and a single floating summary panel owns
// the primary CTA. All behaviour (localStorage cart, table gating,
// group banner, Review route) is unchanged.
export default function CartPage() {
  const params = useParams<{ restaurantId: string }>();
  const searchParams = useSearchParams();
  const { restaurantId } = params;
  const tableNumber = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const qs = new URLSearchParams();
  if (tableNumber) qs.set('table', tableNumber);
  if (tableId) qs.set('tableId', tableId);
  const contextQuery = qs.toString() ? `?${qs.toString()}` : '';
  const menuHref = `/menu/${restaurantId}${contextQuery}`;
  const homeHref = `/menu/${restaurantId}/home${contextQuery}`;
  const { items, setQuantity, removeItem, count, subtotal } = useCart(restaurantId);

  // Ids currently animating out; the real removal happens after the
  // collapse so the list never jumps.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const leave = (itemId: string) => {
    setLeaving((prev) => new Set(prev).add(itemId));
    timers.current.push(
      setTimeout(() => {
        removeItem(itemId);
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 300),
    );
  };

  const nav = (
    <CustomerBottomNav restaurantId={restaurantId} homeHref={homeHref} menuHref={menuHref} cartHref={`/menu/${restaurantId}/cart${contextQuery}`} ordersHref={`/menu/${restaurantId}/orders${contextQuery}`} active="cart" cartCount={count} cartSubtotal={subtotal} />
  );

  const summary = items.length > 0 && (
    <div className="fixed inset-x-0 bottom-[86px] z-30 px-3">
      <div className="mx-auto max-w-md rounded-[30px] bg-white p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,.55)]">
        <div className="flex items-end justify-between px-4 pb-2 pt-2.5">
          <div>
            <p className="text-[12px] font-medium text-[#8b8579]">Total</p>
            <p className="text-[11px] text-[#8b8579]">
              {count} item{count === 1 ? '' : 's'}
            </p>
          </div>
          <p key={subtotal} className="mnu-display animate-number text-[1.9rem] leading-none tabular-nums text-night">₹{subtotal}</p>
        </div>
        {tableId || items.length > 0 ? (
          <Link href={`/menu/${restaurantId}/review${contextQuery}`} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-night text-[15px] font-semibold text-white transition active:scale-[.985]">
            Review order <span aria-hidden>→</span>
          </Link>
        ) : (
          <div className="rounded-full bg-[#f0ece4] px-4 py-4 text-center text-[13px] font-medium text-[#8b8579]">Review your order to continue</div>
        )}
      </div>
    </div>
  );

  return (
    <StageLayout
      restaurantId={restaurantId}
      backHref={menuHref}
      backLabel="Back to menu"
      kicker="Almost there"
      title="Your order"
      chip={tableNumber ? `Table ${tableNumber}` : null}
      bottomPad={items.length ? 'pb-72' : 'pb-40'}
      footer={
        <>
          {summary}
          {nav}
        </>
      }
    >
      {items.length === 0 ? (
        <div className="flex min-h-[46vh] animate-fade-slide-up flex-col items-center justify-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--mnu-card)] shadow-[0_24px_40px_-24px_rgba(0,0,0,.5)] ring-1 ring-[var(--mnu-line)]">
            <CartIcon className="h-8 w-8 text-carbon-400" />
          </div>
          <h2 className="mnu-display mt-7 text-[2rem] leading-none text-carbon-900">Nothing yet</h2>
          <p className="mt-3 max-w-[260px] text-[14px] leading-6 text-carbon-400">Add a dish you fancy and it will wait for you here.</p>
          <Link href={menuHref} className="mt-7 flex h-[52px] items-center rounded-full bg-night px-7 text-[14px] font-semibold text-white transition active:scale-95">
            Explore the menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            {items.map((item, i) => (
              <article
                key={item.itemId}
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms`, maxHeight: 220 }}
                className={`animate-fade-slide-up flex items-center gap-4 border-b border-[var(--mnu-line)] py-5 first:pt-0 last:border-b-0 ${leaving.has(item.itemId) ? 'mnu-leaving' : ''}`}
              >
                <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[26px] bg-[var(--mnu-card)] shadow-[0_16px_28px_-18px_rgba(0,0,0,.5)]">
                  <ItemImage imageUrl={item.imageUrl ?? null} seed={item.itemId || item.name} alt={item.name} className="h-full w-full" iconClassName="text-3xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-carbon-900">{item.name}</h3>
                    <button type="button" onClick={() => leave(item.itemId)} aria-label={`Remove ${item.name}`} className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-carbon-400 transition active:scale-90">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-0.5 text-[12px] text-carbon-400">₹{item.price} each</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full bg-night p-1 text-white">
                      <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => (item.quantity <= 1 ? leave(item.itemId) : setQuantity(item.itemId, item.quantity - 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-lg transition active:scale-90">
                        −
                      </button>
                      <span key={item.quantity} className="min-w-6 animate-scale-in text-center text-[15px] font-semibold tabular-nums">{item.quantity}</span>
                      <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => setQuantity(item.itemId, item.quantity + 1)} className="flex h-10 w-10 items-center justify-center rounded-full text-lg transition active:scale-90">
                        +
                      </button>
                    </div>
                    <span key={item.price * item.quantity} className="animate-number text-[16px] font-semibold tabular-nums text-carbon-900">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Link href={menuHref} className="flex h-[52px] items-center justify-center rounded-full border border-[var(--mnu-line)] text-[14px] font-medium text-carbon-900 transition active:scale-[.99]">
            + Add something else
          </Link>

          <GroupOrderBanner restaurantId={restaurantId} contextQuery={contextQuery} />
        </div>
      )}
    </StageLayout>
  );
}
