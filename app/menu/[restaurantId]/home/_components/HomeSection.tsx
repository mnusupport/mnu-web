import Link from 'next/link';
import { Reveal } from '../../_components/Reveal';

interface HomeSectionProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  seeAllHref?: string;
  children: React.ReactNode;
}

// Day 28 — a titled horizontal discovery rail. Children own their widths;
// the rail adds edge padding, proximity snap, and reveals on scroll.
export function HomeSection({ title, subtitle, kicker = 'Discover', seeAllHref, children }: HomeSectionProps) {
  return (
    <Reveal>
      <div className="flex items-end justify-between gap-4 px-5">
        <div className="min-w-0">
          <p className="mnu-kicker text-[10px] text-carbon-400">{kicker}</p>
          <h2 className="mnu-display mt-1.5 text-[1.85rem] leading-none text-carbon-900">{title}</h2>
          {subtitle && <p className="mt-2 text-[13px] text-carbon-400">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="shrink-0 pb-1 text-[12px] font-medium text-carbon-900 underline decoration-[var(--mnu-line)] underline-offset-4">
            See all
          </Link>
        )}
      </div>
      <div className="no-scrollbar mnu-snap-x -mb-4 mt-5 flex gap-4 overflow-x-auto px-5 pb-10">{children}</div>
    </Reveal>
  );
}
