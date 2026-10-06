'use client';

import Link from 'next/link';
import { ItemImage } from './ItemImage';
import { QuantityControl } from './QuantityControl';
import { MenuTag } from './MenuTag';

export interface DishData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface CardProps {
  item: DishData;
  href: string;
  quantity: number;
  label?: string | null;
  labels?: string[];
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

function Tags({ labels, label }: { labels?: string[]; label?: string | null }) {
  const values = Array.from(new Set([...(labels ?? []), ...(label ? [label] : [])])).filter(Boolean).slice(0, 2);
  if (!values.length) return null;
  return (
    <div className="flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
      {values.map((value) => <MenuTag key={value} label={value} />)}
    </div>
  );
}

export function LeadDishCard({ item, href, quantity, label, labels, onAdd, onIncrease, onDecrease }: CardProps) {
  return (
    <article className="group relative aspect-[4/4.35] overflow-hidden rounded-[30px] bg-night shadow-[0_24px_55px_-28px_rgba(36,33,29,.55)] sm:aspect-[16/10]">
      <Link href={href} aria-label={item.name} className="absolute inset-0 block">
        <ItemImage imageUrl={item.imageUrl} seed={item.id || item.name} alt={item.name} dark className="absolute inset-0 h-full w-full [&_img]:transition-transform [&_img]:duration-[1000ms] sm:group-hover:[&_img]:scale-105" iconClassName="text-7xl" />
        <div className="mnu-scrim absolute inset-0" />
        <span className="absolute left-5 top-5 z-10"><Tags labels={labels} label={label} /></span>
      </Link>
      <div className="pointer-events-none absolute inset-x-5 bottom-4 text-white">
        <Link href={href} className="pointer-events-auto block">
          <h3 className="mnu-display text-[1.7rem] leading-[1.02]">{item.name}</h3>
          {item.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-white/72">{item.description}</p>}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[15px] font-semibold tabular-nums">₹{item.price}</p>
          <span className="pointer-events-auto"><QuantityControl label={item.name} quantity={quantity} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} variant="round" onImage /></span>
        </div>
      </div>
    </article>
  );
}

export function PortraitDishCard({ item, href, quantity, label, labels, onAdd, onIncrease, onDecrease, size = 'lg' }: CardProps & { size?: 'lg' | 'sm' }) {
  return (
    <article className={`group shrink-0 ${size === 'lg' ? 'w-[68%] max-w-[270px] sm:w-[240px]' : 'w-[176px]'}`}>
      <Link href={href} className="mnu-arch relative block aspect-[3/4] overflow-hidden bg-[var(--mnu-card)] ring-1 ring-[var(--mnu-line)]">
        <ItemImage imageUrl={item.imageUrl} seed={item.id || item.name} alt={item.name} className="h-full w-full [&_img]:transition-transform [&_img]:duration-700 sm:group-hover:[&_img]:scale-105" iconClassName={size === 'lg' ? 'text-6xl' : 'text-5xl'} />
        <span className="absolute left-4 top-4 z-10"><Tags labels={labels} label={label} /></span>
      </Link>
      <Link href={href} className="mt-3 block px-0.5">
        <h3 className={`mnu-display line-clamp-2 leading-[1.08] text-carbon-900 ${size === 'lg' ? 'text-[1.2rem]' : 'text-[1.02rem]'}`}>{item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-carbon-400">{item.description}</p>}
      </Link>
      <div className="mt-2.5 flex items-center justify-between px-0.5">
        <p className="text-[14px] font-semibold tabular-nums text-carbon-900">₹{item.price}</p>
        <QuantityControl label={item.name} quantity={quantity} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} variant="round" />
      </div>
    </article>
  );
}

export function DishRow({ item, href, quantity, label, labels, onAdd, onIncrease, onDecrease }: CardProps) {
  return (
    <article className="flex items-start gap-4 border-b border-[var(--mnu-line)] py-5 last:border-b-0">
      <Link href={href} className="block h-[94px] w-[94px] shrink-0 overflow-hidden rounded-[22px] bg-[var(--mnu-card)] ring-1 ring-[var(--mnu-line)]">
        <ItemImage imageUrl={item.imageUrl} seed={item.id || item.name} alt={item.name} className="h-full w-full" iconClassName="text-4xl" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="block">
          <Tags labels={labels} label={label} />
          <h3 className="mt-2 text-[1rem] font-semibold leading-snug text-carbon-900">{item.name}</h3>
          {item.description && <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-carbon-400">{item.description}</p>}
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold tabular-nums text-carbon-900">₹{item.price}</p>
          <QuantityControl label={item.name} quantity={quantity} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} variant="round" />
        </div>
      </div>
    </article>
  );
}
