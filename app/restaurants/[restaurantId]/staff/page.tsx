'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { restaurantApi, type RestaurantStaffRecord } from '@/lib/api';
import { useRestaurantContext } from '../restaurant-context';

export default function RestaurantStaffPage() {
  const params = useParams<{ restaurantId: string }>();
  const { membership } = useRestaurantContext();
  const [staff, setStaff] = useState<RestaurantStaffRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restaurantApi.listStaff(params.restaurantId).then(setStaff).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load staff.'));
  }, [params.restaurantId]);

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-xl font-bold text-ink-900">Staff</h2>
      <p className="mt-1 text-sm text-ink-400">People with access to {membership.restaurant_name}.</p>
      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {!staff && !error && <p className="mt-6 text-sm text-ink-400">Loading staff...</p>}
      {staff && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          {staff.map((member) => (
            <div key={member.id} className="flex flex-col gap-2 border-b border-ink-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink-900">{member.name}</p>
                <p className="text-xs text-ink-400">{member.email ?? 'No email available'}</p>
              </div>
              <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">{member.role}</span>
            </div>
          ))}
          {staff.length === 0 && <div className="p-8 text-center text-sm text-ink-400">No staff memberships found.</div>}
        </div>
      )}
    </div>
  );
}
