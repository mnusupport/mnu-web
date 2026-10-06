'use client';
import Link from 'next/link';
import { ItemImage } from '../../_components/ItemImage';
import { QuantityControl } from '../../_components/QuantityControl';
import { PortraitDishCard } from '../../_components/DishCards';

export interface HomeItemCardData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface HomeItemCardProps {
  item: HomeItemCardData;
  href: string;
  quantity: number;
  badge?: string;
  /** arch: tall MnU arch · ranked: numbered square · wide: horizontal row card */
  variant?: 'arch' | 'ranked' | 'wide';
  rank?: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

// Day 28 — three rail presentations so Home's rails don't all look alike:
// Signature = arches, Most ordered = numbered squares, New = wide rows.
export function HomeItemCard({ item, href, quantity, badge, variant = 'arch', rank, onAdd, onIncrease, onDecrease }: HomeItemCardProps) {
  if (variant === 'arch') {
    return <PortraitDishCard item={item} href={href} quantity={quantity} label={badge} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} />;
  }

  if (variant === 'ranked') {
    return (
      <article className="group w-[176px] shrink-0">
        <Link href={href} className="relative block aspect-square overflow-hidden rounded-[32px] shadow-[0_22px_36px_-24px_rgba(0,0,0,.6)]">
          <ItemImage imageUrl={item.imageUrl} seed={item.id || item.name} alt={item.name} dark className="h-full w-full [&_img]:transition-transform [&_img]:duration-700 sm:group-hover:[&_img]:scale-105" iconClassName="text-5xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {rank && <span className="mnu-display absolute bottom-2 left-4 text-[3rem] leading-none text-white/90">{rank}</span>}
        </Link>
        <Link href={href} className="mt-4 block px-1">
          <h3 className="mnu-display line-clamp-2 text-[1.02rem] leading-[1.1] text-carbon-900">{item.name}</h3>
        </Link>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[14px] font-semibold tabular-nums text-carbon-400">₹{item.price}</p>
          <QuantityControl label={item.name} quantity={quantity} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} variant="round" />
        </div>
      </article>
    );
  }

  return (
    <article className="flex w-[320px] max-w-[86vw] shrink-0 items-center gap-4 rounded-[30px] bg-[var(--mnu-card)] p-3 pr-4 shadow-[0_18px_32px_-24px_rgba(0,0,0,.45)]">
      <Link href={href} className="block h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[22px]">
        <ItemImage imageUrl={item.imageUrl} seed={item.id || item.name} alt={item.name} className="h-full w-full" iconClassName="text-4xl" />
      </Link>
      <div className="min-w-0 flex-1">
        {badge && (
          <span className="mnu-kicker mb-1 block text-[9px]" style={{ color: 'var(--mnu-accent)' }}>
            {badge}
          </span>
        )}
        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-carbon-900">{item.name}</h3>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[14px] font-semibold tabular-nums text-carbon-400">₹{item.price}</p>
          <QuantityControl label={item.name} quantity={quantity} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} variant="round" />
        </div>
      </div>
    </article>
  );
}
