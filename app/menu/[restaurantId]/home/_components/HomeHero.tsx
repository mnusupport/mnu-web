'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/api';
import { CartIcon } from '../../_components/icons';
import { StageBackdrop } from '../../_components/StageBackdrop';
import type { ResolvedBranding } from '../../_components/branding';

interface HomeHeroProps {
  restaurantName: string;
  branding: ResolvedBranding;
  tableNumber: string | null;
  cartHref: string;
  cartCount: number;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Day 28 — a compact, left-aligned brand introduction (~38svh, the sheet
// overlaps its bottom edge, so it occupies well under half the first
// screen). Identity first, then the customer is one thumb-flick from real
// menu content. The ambient layer is the featured dish, blurred and slowly
// parallaxed on scroll — food is present from the very first pixel.
export function HomeHero({ restaurantName, branding, tableNumber, cartHref, cartCount }: HomeHeroProps) {
  const raf = useRef(0);
  const textRef = useRef<HTMLDivElement>(null);
  const logoSrc = resolveImageUrl(branding.logoUrl);
  const initial = restaurantName.trim().charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const progress = Math.min(1, Math.max(0, window.scrollY / 360));
        if (textRef.current) {
          textRef.current.style.transform = `translate3d(0,${progress * -14}px,0)`;
          textRef.current.style.opacity = String(1 - progress * 0.35);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      <StageBackdrop />

      <div className="relative mx-auto flex min-h-[clamp(290px,38svh,370px)] max-w-5xl flex-col px-6 pb-14 pt-[calc(env(safe-area-inset-top,0px)+18px)] sm:px-8">
        <div className="flex items-center gap-3">
          <div className="animate-scale-in flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-white/20 bg-white/10">
            {logoSrc ? <img src={logoSrc} alt={`${restaurantName} logo`} className="h-full w-full object-contain p-1" /> : <span className="mnu-display text-xl text-white">{initial}</span>}
          </div>
          <p className="mnu-kicker min-w-0 flex-1 truncate text-[10px] text-white/60">{greeting()}</p>
          {tableNumber && <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-medium text-white/80">Table {tableNumber}</span>}
          <Link href={cartHref} aria-label={`Cart, ${cartCount} items`} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition active:scale-90">
            <CartIcon className="h-[18px] w-[18px]" />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-night">{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>
        </div>

        <div ref={textRef} className="mt-auto pt-10 will-change-transform">
          <p className="animate-fade-slide-up mnu-kicker flex items-center gap-2.5 text-[10px] text-white/70">
            <span className="h-px w-6 shrink-0 bg-white/50" />
            <span className="truncate">{branding.heroEyebrow}</span>
          </p>
          <h1 className="animate-fade-slide-up mnu-display mt-3 break-words text-[clamp(2.7rem,13vw,4.1rem)] leading-[.9] text-white" style={{ animationDelay: '70ms' }}>
            {restaurantName}
          </h1>
          <p className="animate-fade-slide-up mt-4 max-w-[340px] text-[14px] leading-6 text-white/65" style={{ animationDelay: '140ms' }}>
            {branding.heroTagline}
          </p>
        </div>
      </div>
    </section>
  );
}
