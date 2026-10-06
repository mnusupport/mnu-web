'use client';

import { useEffect, useRef } from 'react';

interface Category { id: string; name: string }

export function CategoryTabs({ categories, activeId, onSelect }: { categories: Category[]; activeId: string | null; onSelect: (id: string | null) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const chips = useRef<Map<string, HTMLButtonElement>>(new Map());
  const underline = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = scroller.current;
    const chip = chips.current.get(activeId ?? '__all');
    if (!el || !chip) return;
    el.scrollTo({ left: Math.max(0, chip.offsetLeft - (el.clientWidth - chip.clientWidth) / 2), behavior: 'smooth' });
    if (underline.current) {
      underline.current.style.width = `${Math.max(22, chip.clientWidth - 20)}px`;
      underline.current.style.transform = `translateX(${chip.offsetLeft + 10}px)`;
    }
  }, [activeId]);

  const chipClass = (on: boolean) => `relative shrink-0 px-3 py-3 text-[12px] font-semibold transition-colors duration-250 active:scale-[.98] ${on ? 'text-carbon-900' : 'text-carbon-400'}`;

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--mnu-line)] bg-[var(--color-surface)]/96 backdrop-blur-xl">
      <div ref={scroller} className="no-scrollbar relative mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        <button type="button" ref={(el) => { if (el) chips.current.set('__all', el); }} onClick={() => onSelect(null)} className={chipClass(activeId === null)}>All</button>
        {categories.map((c) => <button key={c.id} type="button" ref={(el) => { if (el) chips.current.set(c.id, el); }} onClick={() => onSelect(c.id)} className={chipClass(activeId === c.id)}>{c.name}</button>)}
        <span ref={underline} className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-[var(--mnu-accent,#E07A5F)] transition-[transform,width] duration-300 ease-out" />
      </div>
    </div>
  );
}
