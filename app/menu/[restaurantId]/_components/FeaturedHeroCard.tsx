'use client';

import Link from 'next/link';
import { ItemImage } from './ItemImage';
import { QuantityControl } from './QuantityControl';
import type { DishData } from './DishCards';

interface FeaturedHeroCardProps {
  item: DishData;
  href: string;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  kicker?: string;
}

// Chef's pick — deliberately bare: the photograph, the dish name, and one
// small add control. No frame, no panel, no border, no description; the
// image does the selling and tapping it opens the full dish.
export function FeaturedHeroCard({ item, href, quantity, onAdd, onIncrease, onDecrease, kicker = 'Chef’s pick' }: FeaturedHeroCardProps) {
  return (
    <div className="group relative aspect-[4/4.5] overflow-hidden rounded-[32px] shadow-[0_30px_60px_-28px_rgba(0,0,0,.65)] sm:aspect-[16/9]">
      <Link href={href} aria-label={item.name} className="absolute inset-0 block">
        <ItemImage
          imageUrl={item.imageUrl}
          seed={item.id || item.name}
          alt={item.name}
          dark
          className="h-full w-full [&_img]:transition-transform [&_img]:duration-[1400ms] sm:group-hover:[&_img]:scale-105"
          iconClassName="text-8xl"
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
        <span className="mnu-kicker absolute left-5 top-5 flex items-center gap-2 text-[10px] text-white/90">
          <span className="h-px w-5 bg-white/60" />
          {kicker}
        </span>
      </Link>
      <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
        <Link href={href} className="pointer-events-auto min-w-0">
          <h2 className="mnu-display text-[1.9rem] leading-[1.02]">{item.name}</h2>
        </Link>
        <span className="pointer-events-auto shrink-0">
          <QuantityControl label={item.name} quantity={quantity} onAdd={onAdd} onIncrease={onIncrease} onDecrease={onDecrease} variant="round" onImage />
        </span>
      </div>
    </div>
  );
}
