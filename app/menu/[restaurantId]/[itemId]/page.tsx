'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { menuApi, type PublicMenu } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { CartIcon, ChevronLeftIcon } from '../_components/icons';
import { ItemImage } from '../_components/ItemImage';
import { PortraitDishCard } from '../_components/DishCards';
import { Reveal } from '../_components/Reveal';
import { flyToCart } from '@/lib/flyToCart';
import { MenuErrorState, MenuSkeleton } from '../_components/MenuStates';
import { CustomerTheme } from '../_components/CustomerTheme';

type FoundItem = PublicMenu['categories'][number]['items'][number];

// Deliberately reuses menuApi.getPublicMenu() rather than adding a new
// "get single item" endpoint — the full public menu is already small
// (one restaurant's available items) and this avoids a second API
// surface. If the item isn't in the response, it's either nonexistent or
// currently unavailable — the public endpoint already excludes
// unavailable items entirely, so both cases collapse into the same
// "not found" state, which is exactly right: an unavailable item should
// look no different from one that doesn't exist, and definitely can't
// be added to a cart.
//
// Day 24 rewrite: this used to be a rounded, margined image sitting
// inside the page like every other card. Now the photo bleeds full-width
// to the top edge (a real "product detail" composition, not a card
// stretched fullscreen) and the add-to-cart action is a sticky bottom
// bar within thumb reach, rather than an inline button at the bottom of
// whatever the description's length happens to push it to.
export default function MenuItemDetailPage() {
  const params = useParams<{ restaurantId: string; itemId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { restaurantId, itemId } = params;
  const tableNumber = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const contextQuery = (() => {
    const qs = new URLSearchParams();
    if (tableNumber) qs.set('table', tableNumber);
    if (tableId) qs.set('tableId', tableId);
    const str = qs.toString();
    return str ? `?${str}` : '';
  })();
  const backHref = `/menu/${restaurantId}${contextQuery}`;
  const cartHref = `/menu/${restaurantId}/cart${contextQuery}`;

  const [menu, setMenu] = useState<PublicMenu | null>(() => menuApi.peekPublicMenu(restaurantId));
  const [error, setError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const redirect = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { items: cartItems, addItem, setQuantity: setCartQuantity, count } = useCart(restaurantId);

  useEffect(() => {
    setError(null);
    menuApi
      .getPublicMenu(restaurantId)
      .then(setMenu)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load menu.'));
  }, [restaurantId, loadKey]);

  // Gentle parallax on the hero photograph. rAF-throttled, transform only.
  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const y = Math.min(window.scrollY, 520);
        if (heroRef.current) heroRef.current.style.transform = `translate3d(0,${y * 0.35}px,0) scale(${1 + y / 2600})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
      if (redirect.current) clearTimeout(redirect.current);
    };
  }, []);

  // A different dish (via "pairs well") resets the stepper and scroll.
  useEffect(() => {
    setQuantity(1);
    setAdded(false);
    window.scrollTo({ top: 0 });
  }, [itemId]);

  if (error) {
    return <MenuErrorState message={error} onRetry={() => setLoadKey((k) => k + 1)} />;
  }

  if (!menu) {
    return <MenuSkeleton />;
  }

  const category = menu.categories.find((c) => c.items.some((i) => i.id === itemId));
  const item: FoundItem | undefined = category?.items.find((i) => i.id === itemId);

  if (!item) {
    return (
      <CustomerTheme restaurantId={restaurantId}>
        <main className="flex min-h-screen items-center justify-center px-5">
          <div className="mnu-sheet w-full max-w-sm rounded-[32px] p-8 text-center">
            <h1 className="mnu-display text-2xl text-carbon-900">Not available</h1>
            <p className="mt-2 text-[14px] text-carbon-400">This dish isn&apos;t on the menu right now.</p>
            <Link href={backHref} className="mt-6 inline-flex h-12 items-center rounded-full bg-night px-6 text-[14px] font-semibold text-white">
              Back to menu
            </Link>
          </div>
        </main>
      </CustomerTheme>
    );
  }

  const pairs = (category?.items ?? []).filter((i) => i.id !== item.id).slice(0, 6);
  const quantityFor = (id: string) => cartItems.find((i) => i.itemId === id)?.quantity ?? 0;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (added) return;
    flyToCart(e.currentTarget);
    addItem({ itemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl }, quantity);
    setAdded(true);
    redirect.current = setTimeout(() => router.push(backHref), 750);
  };

  const round = 'flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition active:scale-90';

  return (
    <CustomerTheme restaurantId={restaurantId} className="relative">
      <div className="relative mx-auto max-w-2xl">
        {/* Hero photograph — fixed-height stage; the sheet slides over it. */}
        <div className="relative h-[58svh] min-h-[380px] w-full overflow-hidden sm:h-[520px]">
          <div ref={heroRef} className="absolute inset-0 will-change-transform">
            <ItemImage imageUrl={item.imageUrl} seed={item.id || item.name} alt={item.name} dark className="animate-image-reveal h-full w-full" iconClassName="text-[7rem]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
            <Link href={backHref} aria-label="Back to menu" className={round}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <Link href={cartHref} aria-label={`Cart, ${count} items`} className={`${round} relative`} data-cart-target="">
              <CartIcon className="h-[18px] w-[18px]" />
              {count > 0 && <span key={count} className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-night">{count > 99 ? '99+' : count}</span>}
            </Link>
          </div>
        </div>

        <main className="mnu-sheet -mt-12 px-6 pb-44 pt-9">
          <div className="animate-fade-slide-up">
            {item.isFeatured && (
              <p className="mnu-kicker mb-3 flex items-center gap-2 text-[10px]" style={{ color: 'var(--mnu-accent)' }}>
                <span className="h-px w-5" style={{ background: 'var(--mnu-accent)' }} />
                Signature
              </p>
            )}
            <div className="flex items-start justify-between gap-5">
              <h1 className="mnu-display break-words text-[clamp(2rem,9vw,2.6rem)] leading-[.98] text-carbon-900">{item.name}</h1>
              <p className="pt-1.5 text-[1.3rem] font-semibold tabular-nums text-carbon-900">₹{item.price}</p>
            </div>
            {item.description && <p className="mt-5 max-w-xl text-[15px] leading-7 text-carbon-400">{item.description}</p>}
            {category && <p className="mt-6 text-[12px] text-carbon-400">From <span className="font-medium text-carbon-900">{category.name}</span></p>}
          </div>

          <div className="mt-9 flex items-center justify-between rounded-full bg-[var(--mnu-card)] p-2 pl-6 ring-1 ring-[var(--mnu-line)]">
            <span className="text-[14px] font-medium text-carbon-900">Quantity</span>
            <div className="flex items-center rounded-full bg-night p-1 text-white">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-xl transition active:scale-90">−</button>
              <span key={quantity} className="min-w-8 animate-scale-in text-center text-[16px] font-semibold tabular-nums">{quantity}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => q + 1)} className="flex h-11 w-11 items-center justify-center rounded-full text-xl transition active:scale-90">+</button>
            </div>
          </div>

          {pairs.length > 0 && (
            <Reveal className="-mx-6 mt-12">
              <div className="px-6">
                <p className="mnu-kicker text-[10px] text-carbon-400">Also in {category?.name}</p>
                <h2 className="mnu-display mt-1.5 text-[1.6rem] leading-none text-carbon-900">Pairs well</h2>
              </div>
              <div className="no-scrollbar mnu-snap-x -mb-4 mt-5 flex gap-4 overflow-x-auto px-6 pb-10">
                {pairs.map((p) => (
                  <PortraitDishCard
                    key={p.id}
                    size="sm"
                    item={p}
                    href={`/menu/${restaurantId}/${p.id}${contextQuery}`}
                    quantity={quantityFor(p.id)}
                    onAdd={() => addItem({ itemId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl }, 1)}
                    onIncrease={() => setCartQuantity(p.id, quantityFor(p.id) + 1)}
                    onDecrease={() => setCartQuantity(p.id, quantityFor(p.id) - 1)}
                  />
                ))}
              </div>
            </Reveal>
          )}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-md rounded-full bg-white p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,.6)]">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={added}
              className={`flex h-14 w-full items-center justify-between rounded-full px-6 text-[15px] font-semibold text-white transition-all duration-300 active:scale-[.985] ${added ? 'bg-[#2f6f4e]' : 'bg-night'}`}
            >
              {added ? (
                <span className="mx-auto flex items-center gap-2 animate-scale-in">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mnu-draw" /></svg>
                  Added to your order
                </span>
              ) : (
                <>
                  <span>Add to order</span>
                  <span key={item.price * quantity} className="animate-number tabular-nums">₹{item.price * quantity}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </CustomerTheme>
  );
}
