'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChevronLeftIcon } from '../../_components/icons';
import { CustomerTheme } from '../../_components/CustomerTheme';

export function GroupShell({ title, subtitle, backHref, children, bottomPadding = 'pb-28' }: { title: string; subtitle?: string | null; backHref: string; children: ReactNode; bottomPadding?: string }) {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return (
    <CustomerTheme restaurantId={restaurantId} className="mnu-group-screen min-h-screen">
      <header className="relative overflow-hidden bg-night text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(224,122,95,.22),transparent_38%)]" />
        <div className="relative mx-auto max-w-2xl px-5 pb-9 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
          <div className="flex items-center gap-3">
            <Link href={backHref} aria-label="Go back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/8 transition active:scale-90">
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="mnu-kicker text-[9px] text-white/45">Shared table experience</p>
              {subtitle && <p className="mt-1 text-[11px] text-white/55">{subtitle}</p>}
            </div>
          </div>
          <h1 className="mnu-display mt-7 text-[clamp(2.4rem,11vw,3.4rem)] leading-[.92]">{title}</h1>
          <p className="mt-3 max-w-[300px] text-[13px] leading-5 text-white/55">Build one table order together, from every phone.</p>
        </div>
      </header>
      <main className={`mnu-sheet mx-auto max-w-2xl px-5 pt-7 ${bottomPadding}`}>{children}</main>
    </CustomerTheme>
  );
}
