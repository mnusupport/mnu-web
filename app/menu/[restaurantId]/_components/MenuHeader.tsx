'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CartIcon, ChevronLeftIcon, CloseIcon, SearchIcon } from './icons';
import { StageBackdrop } from './StageBackdrop';

interface MenuHeaderProps {
  restaurantName: string;
  tableNumber: string | null;
  cartHref: string;
  cartCount: number;
  searchOpen: boolean;
  searchQuery: string;
  onSearchOpenChange: (open: boolean) => void;
  onSearchQueryChange: (query: string) => void;
  homeHref?: string;
  logoUrl?: string | null;
  totalItems?: number;
  categoryCount?: number;
}

// Day 28 — the Menu screen opens with an editorial title on the branded
// stage rather than a utility toolbar. Not sticky: the category strip
// below owns the sticky slot, so the sticky chrome stays one bar tall.
export function MenuHeader({ restaurantName, tableNumber, cartHref, cartCount, searchOpen, searchQuery, onSearchOpenChange, onSearchQueryChange, homeHref, totalItems, categoryCount }: MenuHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const round = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition active:scale-90';

  return (
    <header className="relative z-20 overflow-hidden text-white">
      <StageBackdrop />
      <div className="relative mx-auto max-w-5xl px-5 pb-7 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <div className="flex items-center gap-3">
          {homeHref && (
            <Link href={homeHref} aria-label="Back to restaurant home" className={round}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
          )}
          <p className="mnu-kicker min-w-0 flex-1 truncate text-[10px] text-white/55">
            {restaurantName}
          </p>
          <button type="button" onClick={() => onSearchOpenChange(!searchOpen)} aria-label={searchOpen ? 'Close search' : 'Search'} className={round}>
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>
          <Link href={cartHref} aria-label={`Cart, ${cartCount} items`} className={`${round} relative`}>
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-night">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
        </div>

        {searchOpen ? (
          <div className="relative mt-6 animate-fade-slide-up">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search dishes & categories"
              className="w-full rounded-full border border-white/15 bg-white/10 py-4 pl-11 pr-5 text-[15px] text-white outline-none placeholder:text-white/40 focus:border-white/35"
            />
          </div>
        ) : (
          <div className="mt-7 animate-fade-slide-up">
            <h1 className="mnu-display text-[clamp(2.6rem,12vw,3.6rem)] leading-[.92]">The Menu</h1>
            {totalItems ? (
              <p className="mt-3 text-[13px] text-white/55">
                {tableNumber && `Table ${tableNumber} · `}
                {totalItems} dishes across {categoryCount} categories
              </p>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
