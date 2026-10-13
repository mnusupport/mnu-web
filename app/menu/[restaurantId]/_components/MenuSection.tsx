'use client';

import { DishRow, LeadDishCard, PortraitDishCard, type DishData } from './DishCards';
import { Reveal } from './Reveal';

export interface MenuSectionCategory {
  id: string;
  name: string;
  items: (DishData & { isFeatured: boolean })[];
}

interface MenuSectionProps {
  category: MenuSectionCategory;
  index: number;
  hrefFor: (itemId: string) => string;
  labelFor: (item: { id: string; isFeatured: boolean }) => string | null;
  popularIds?: Set<string>;
  quantityFor: (itemId: string) => number;
  onAdd: (item: DishData) => void;
  onSetQuantity: (itemId: string, quantity: number) => void;
}

export function MenuSection({ category, index, hrefFor, labelFor, popularIds = new Set(), quantityFor, onAdd, onSetQuantity }: MenuSectionProps) {
  const items = category.items;
  const ordered = [...items].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(!!b.imageUrl) - Number(!!a.imageUrl));
  const spreadB = index % 2 === 1 && items.length >= 3;
  const leadCount = spreadB ? Math.min(5, items.length) : 1;
  const leaders = ordered.slice(0, leadCount);
  const rows = items.filter((i) => !leaders.some((l) => l.id === i.id));

  const card = (item: (typeof items)[number]) => {
    const primary = labelFor(item);
    const labels = [
      ...(item.isFeatured ? ['Signature'] : []),
      ...(popularIds.has(item.id) ? ['Popular'] : []),
    ].slice(0, 2);
    if (!labels.length && primary) labels.push(primary);
    return { item, href: hrefFor(item.id), label: null, labels, quantity: quantityFor(item.id), onAdd: () => onAdd(item), onIncrease: () => onSetQuantity(item.id, quantityFor(item.id) + 1), onDecrease: () => onSetQuantity(item.id, quantityFor(item.id) - 1) };
  };

  return (
    <section id={`category-${category.id}`} className="scroll-mt-14">
      <Reveal className="flex items-end justify-between gap-4 px-5">
        <div className="min-w-0">
          <p className="mnu-kicker text-[10px] text-carbon-400">{String(index + 1).padStart(2, '0')}</p>
          <h2 className="mnu-display mt-1 break-words text-[2rem] leading-[1] text-carbon-900">{category.name}</h2>
        </div>
        <p className="shrink-0 pb-1 text-[12px] text-carbon-400">{items.length} {items.length === 1 ? 'dish' : 'dishes'}</p>
      </Reveal>

      {spreadB ? (
        <Reveal className="mt-6" delay={80}><div className="no-scrollbar mnu-snap-x -mb-4 flex gap-5 overflow-x-auto px-5 pb-10">{leaders.map((item) => <PortraitDishCard key={item.id} {...card(item)} />)}</div></Reveal>
      ) : (
        <Reveal className="mt-6 px-5" delay={80}><LeadDishCard {...card(leaders[0])} /></Reveal>
      )}

      {rows.length > 0 && <div className="px-5 pt-1">{rows.map((item, i) => <Reveal key={item.id} delay={Math.min(i, 4) * 40}><DishRow {...card(item)} /></Reveal>)}</div>}
    </section>
  );
}
