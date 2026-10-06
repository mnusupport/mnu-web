import Link from 'next/link';
import { SearchIcon } from '../../_components/icons';

interface HomeHeaderProps {
  searchHref: string;
  ordersHref: string;
  categoryCount: number;
  itemCount: number;
}

// Day 31 — keeps the existing quiet search surface while giving returning
// customers a direct, low-friction route to their restaurant-scoped orders.
export function HomeHeader({ searchHref, ordersHref, categoryCount, itemCount }: HomeHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={searchHref}
        className="flex h-[58px] min-w-0 flex-1 items-center gap-3 rounded-full bg-[var(--mnu-card)] pl-5 pr-2 shadow-[0_16px_36px_-20px_rgba(0,0,0,.45)] ring-1 ring-[var(--mnu-line)] transition active:scale-[.99]"
      >
        <SearchIcon className="h-[18px] w-[18px] shrink-0 text-carbon-400" />
        <span className="min-w-0 flex-1 truncate text-[14px] text-carbon-400">Search {itemCount} dishes</span>
        <span className="shrink-0 rounded-full bg-night px-3.5 py-2 text-[11px] font-medium text-white">{categoryCount} categories</span>
      </Link>
      <Link
        href={ordersHref}
        className="flex h-[58px] shrink-0 items-center justify-center rounded-full bg-night px-4 text-[12px] font-semibold text-white shadow-[0_16px_36px_-20px_rgba(0,0,0,.5)] transition active:scale-[.97]"
      >
        Orders
      </Link>
    </div>
  );
}
