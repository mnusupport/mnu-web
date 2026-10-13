'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/api';
import { Reveal } from '../../_components/Reveal';

export interface CategoryGridItem {
  id: string;
  name: string;
  itemCount: number;
  /** A real photo from one of the category's dishes, if any has one. */
  imageUrl?: string | null;
}
interface CategoryGridProps {
  categories: CategoryGridItem[];
  hrefFor: (categoryId: string) => string;
}

const VISIBLE = 4;

// Day 28 (rev.) — categories are an index, not another row of cards, so
// they no longer compete with the dish rails. A quiet numbered list with
// a small real-photo thumbnail; only the first four show, the rest fold
// away behind "Show all" (animated height, inert while collapsed).
export function CategoryGrid({ categories, hrefFor }: CategoryGridProps) {
  const [open, setOpen] = useState(false);
  if (!categories.length) return null;
  const head = categories.slice(0, VISIBLE);
  const tail = categories.slice(VISIBLE);

  const row = (category: CategoryGridItem, i: number) => {
    const src = resolveImageUrl(category.imageUrl);
    return (
      <Link
        key={category.id}
        href={hrefFor(category.id)}
        className="group flex items-center gap-4 border-b border-[var(--mnu-line)] py-3.5 transition active:opacity-70"
      >
        <span className="w-6 shrink-0 text-[11px] font-medium tabular-nums text-carbon-400">{String(i + 1).padStart(2, '0')}</span>
        <span className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[18px] bg-night">
          {src ? (
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="mnu-display flex h-full w-full items-center justify-center text-xl text-white/60">{category.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mnu-display block truncate text-[1.2rem] leading-tight text-carbon-900">{category.name}</span>
          <span className="mt-0.5 block text-[12px] text-carbon-400">
            {category.itemCount} {category.itemCount === 1 ? 'dish' : 'dishes'}
          </span>
        </span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-carbon-400 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    );
  };

  return (
    <Reveal className="px-5">
      <p className="mnu-kicker text-[10px] text-carbon-400">Explore</p>
      <h2 className="mnu-display mt-1.5 text-[1.85rem] leading-none text-carbon-900">Categories</h2>

      <div className="mt-3">
        {head.map((c, i) => row(c, i))}
        {tail.length > 0 && (
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden" inert={!open}>
              {tail.map((c, i) => row(c, i + VISIBLE))}
            </div>
          </div>
        )}
      </div>

      {tail.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-4 flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-medium text-carbon-900 ring-1 ring-[var(--mnu-line)] transition active:scale-95"
        >
          {open ? 'Show less' : `Show all ${categories.length}`}
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </Reveal>
  );
}
