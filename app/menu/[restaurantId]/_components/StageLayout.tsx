'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CustomerTheme } from './CustomerTheme';
import { ChevronLeftIcon } from './icons';

interface StageLayoutProps {
  restaurantId: string;
  backHref: string;
  backLabel: string;
  kicker: string;
  title: string;
  /** Right-hand chip in the header, e.g. "Table 4". */
  chip?: string | null;
  children: ReactNode;
  /** Fixed-position content (CTA panels, bottom nav) rendered after the sheet. */
  footer?: ReactNode;
  /** Sheet bottom padding, so fixed footers never cover content. */
  bottomPad?: string;
  maxWidth?: string;
}

// Day 28 — the shared frame for the ordering screens (Cart, Review,
// Confirmation): dark branded stage with an editorial title, warm sheet
// sliding over it — the same language as Home and Menu, so the order
// flow reads as part of one product instead of a separate app.
export function StageLayout({ restaurantId, backHref, backLabel, kicker, title, chip, children, footer, bottomPad = 'pb-40', maxWidth = 'max-w-2xl' }: StageLayoutProps) {
  return (
    <CustomerTheme restaurantId={restaurantId}>
      <header className="relative text-white">
        <div className={`mx-auto ${maxWidth} px-5 pb-9 pt-[calc(env(safe-area-inset-top,0px)+16px)]`}>
          <div className="flex items-center gap-3">
            <Link href={backHref} aria-label={backLabel} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 transition active:scale-90">
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <p className="mnu-kicker flex-1 text-[10px] text-white/55">{kicker}</p>
            {chip && <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-medium text-white/80">{chip}</span>}
          </div>
          <h1 className="mnu-display animate-fade-slide-up mt-7 text-[clamp(2.6rem,12vw,3.4rem)] leading-[.92]">{title}</h1>
        </div>
      </header>
      <main className={`mnu-sheet mx-auto ${maxWidth} min-h-[68svh] px-5 pt-8 ${bottomPad}`}>{children}</main>
      {footer}
    </CustomerTheme>
  );
}
