'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { menuApi, type PublicMenu } from '@/lib/api';

export default function TakeawayQrPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    menuApi.getPublicMenu(restaurantId).then(setMenu).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load restaurant.'));
  }, [restaurantId]);

  if (error) return <main className="flex min-h-screen items-center justify-center px-4"><p className="text-sm text-red-600">{error}</p></main>;
  if (!menu) return <main className="flex min-h-screen items-center justify-center px-4"><p className="text-sm text-ink-400">Loading menu...</p></main>;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-xl text-white">🍴</div>
        <h1 className="text-xl font-bold text-ink-900">{menu.restaurantName}</h1>
        <p className="mt-1 text-sm text-ink-400">Takeaway ordering</p>
        <Link href={`/menu/${restaurantId}/home`} className="mt-6 block w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">View Menu</Link>
      </div>
    </main>
  );
}
