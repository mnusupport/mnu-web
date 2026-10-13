'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CartIcon, HomeNavIcon, MenuNavIcon, OrdersNavIcon } from './icons';
import { useMyOrders, type OrdersIndicator } from '@/lib/myOrders';

export type CustomerNavTab = 'home' | 'menu' | 'cart' | 'orders';

const TABS: CustomerNavTab[] = ['home', 'menu', 'cart', 'orders'];

interface CustomerBottomNavProps {
  restaurantId: string;
  homeHref: string;
  menuHref: string;
  cartHref: string;
  ordersHref: string;
  active: CustomerNavTab;
  cartCount: number;
  cartSubtotal: number;
}

// The one persistent, app-like navigation surface across Home, Menu,
// Cart and Orders ("Home / Menu / Cart / Orders"). A
// single fixed element per page — the cart summary strip and the tab
// bar are rendered together here as one unit, specifically so a page
// never has two competing fixed-bottom pieces (that was the reason Day
// 14 chose header-based nav instead of a bottom bar; today's explicit
// ask for a bottom nav is handled by folding the old standalone
// StickyCartBar into this same fixed block rather than stacking a
// second one on top of it).
//
// Day 21: restyled as a FLOATING dark bar (night #111) with a rounded
// container and a max width, inset from the screen edges on every
// breakpoint (not just desktop). Tabs are 4 across at >=56px touch
// height. The cart strip still rides on top of the same fixed block, so
// there is still exactly ONE fixed bottom element per screen — pages
// reserve bottom padding for its full height.
//
// Orders replaces the old Search tab. Search is still available from the
// search bar on Home and in the Menu page header. The Orders tab shows a
// live indicator: a blinking dot while the latest order is being
// prepared, a blinking green dot when it is ready, and a green check
// once it is completed (cleared when the customer opens Orders).
export function CustomerBottomNav({
  restaurantId,
  homeHref,
  menuHref,
  cartHref,
  ordersHref,
  active,
  cartCount,
  cartSubtotal,
}: CustomerBottomNavProps) {
  // Day 23 (Part 11) — cart badge bumps once whenever the count actually
  // increases (not on every render/navigation), so adding an item is
  // felt in the nav even if the customer isn't looking at the button
  // that added it.
  const [bump, setBump] = useState(false);
  const prevCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 320);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  const { indicator } = useMyOrders(restaurantId);
  const activeIndex = TABS.indexOf(active);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
      <div className="pointer-events-auto mx-auto w-full max-w-md">
        {cartCount > 0 && active !== 'cart' && (
          <Link
            href={cartHref}
            className="mb-2.5 flex animate-fade-slide-up items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-night shadow-[0_18px_44px_-10px_rgba(0,0,0,.55)] transition active:scale-[0.99]"
          >
            <span key={cartCount} className="flex h-11 min-w-11 animate-pop items-center justify-center rounded-full bg-night px-3 text-[14px] font-semibold tabular-nums text-white">
              {cartCount}
            </span>
            <span className="flex-1 text-[14px] font-semibold">View your order</span>
            <span key={cartSubtotal} className="animate-number text-[15px] font-semibold tabular-nums">₹{cartSubtotal}</span>
          </Link>
        )}

        <nav
          aria-label="Customer navigation"
          className="relative grid grid-cols-4 rounded-[30px] border border-white/10 bg-[#141210]/97 px-1.5 py-1.5 shadow-[0_22px_50px_rgba(0,0,0,.45)]"
        >
          {/* Day 23 (Part 11) — one shared pill that slides between tabs
              via a CSS transform transition, instead of each tab simply
              swapping its own background on/off. This is the "smooth
              active-state movement" the task asks for, done with a
              single element rather than animating four independently. */}
          {activeIndex >= 0 && (
            <span
              aria-hidden="true"
              className="absolute inset-y-1.5 left-1.5 w-1/4 rounded-[24px] bg-white/14 transition-transform duration-[380ms] ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
          )}
          <NavTab href={homeHref} label="Home" active={active === 'home'} icon={<HomeNavIcon />} />
          <NavTab href={menuHref} label="Menu" active={active === 'menu'} icon={<MenuNavIcon />} />
          <NavTab
            href={cartHref}
            label="Cart"
            active={active === 'cart'}
            icon={<CartIcon />}
            badge={cartCount > 0 ? cartCount : undefined}
            badgeBump={bump}
          />
          <NavTab
            href={ordersHref}
            label="Orders"
            active={active === 'orders'}
            icon={<OrdersNavIcon />}
            indicator={indicator}
          />
        </nav>
      </div>
    </div>
  );
}

function NavTab({
  href,
  label,
  active,
  icon,
  badge,
  badgeBump,
  indicator = 'none',
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
  badgeBump?: boolean;
  indicator?: OrdersIndicator;
}) {
  const indicatorLabel =
    indicator === 'live' ? 'order in progress' : indicator === 'ready' ? 'order ready' : indicator === 'completed' ? 'order completed' : '';
  return (
    <Link
      href={href}
      aria-label={indicatorLabel ? `${label}, ${indicatorLabel}` : label}
      aria-current={active ? 'page' : undefined}
      className={`relative z-10 flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-soft text-[10px] font-semibold tracking-wide transition-all duration-200 active:scale-90 ${
        active ? 'text-white' : 'text-white/55 active:bg-surface/5'
      }`}
    >
      <span className="relative" data-cart-target={label === 'Cart' ? '' : undefined}>
        {icon}
        {badge !== undefined && (
          <span
            className={`absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#141210] ${
              badgeBump ? 'animate-pop' : ''
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {indicator !== 'none' && (
          <span className="absolute -right-1.5 -top-1 flex h-3 w-3 items-center justify-center" aria-hidden="true">
            {indicator !== 'completed' && (
              <span className={`absolute inline-flex h-full w-full animate-ping-soft rounded-full ${indicator === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            )}
            <span
              className={`relative flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-[#141210] ${
                indicator === 'ready' ? 'animate-blink bg-emerald-400' : indicator === 'live' ? 'animate-blink bg-amber-400' : 'bg-emerald-500 text-[7px] font-bold leading-none text-white'
              }`}
            >
              {indicator === 'completed' ? '✓' : null}
            </span>
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
