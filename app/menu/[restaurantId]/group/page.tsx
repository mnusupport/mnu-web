'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { groupOrdersApi } from '@/lib/api';
import { getGroupParticipantId } from '@/lib/groupParticipant';
import { getActiveGroupCode, setActiveGroupCode } from '@/lib/groupOrder';
import { GroupShell } from './_components/GroupShell';

// Group ordering entry point: Create or Join.
export default function GroupEntryPage() {
  const params = useParams<{ restaurantId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { restaurantId } = params;

  const tableNumber = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const contextQuery = (() => {
    const qs = new URLSearchParams();
    if (tableNumber) qs.set('table', tableNumber);
    if (tableId) qs.set('tableId', tableId);
    const str = qs.toString();
    return str ? `?${str}` : '';
  })();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getActiveGroupCode(restaurantId);
    if (existing) router.replace(`/menu/${restaurantId}/group/${existing}${contextQuery}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleCreate = async () => {
    if (!tableId) {
      setError('Scan the table QR code to start a group order.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const group = await groupOrdersApi.create(restaurantId, tableId, getGroupParticipantId(restaurantId));
      setActiveGroupCode(restaurantId, group.groupCode);
      router.push(`/menu/${restaurantId}/group/${group.groupCode}${contextQuery}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the group.');
      setCreating(false);
    }
  };

  const backHref = `/menu/${restaurantId}/home${contextQuery}`;

  return (
    <GroupShell
      title="Group Order"
      subtitle={tableNumber ? `Table ${tableNumber}` : null}
      backHref={backHref}
      bottomPadding="pb-12"
    >
      <div className="mnu-group-intro rounded-[28px] border border-[var(--mnu-line)] bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-night text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19.5c.5-3 2.2-4.5 4.5-4.5s4 1.5 4.5 4.5M13 16c.6-.9 1.5-1.4 2.9-1.4 2.1 0 3.4 1.2 3.8 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          </div>
          <p className="mnu-kicker text-[10px] text-carbon-400">One table · one order</p>
        </div>
        <h2 className="mt-5 text-[1.55rem] font-semibold leading-tight text-carbon-900">
          Order together at this table
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-carbon-400">
          Start a group and share the code with everyone at your table. Each person adds their own
          items from their own phone, and you all see one combined order.
        </p>
      </div>

      <>
        <div className="mt-4 space-y-3">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="mnu-primary-btn w-full disabled:opacity-50"
          >
            {creating ? 'Creating group…' : 'Create Group'}
          </button>

          <Link
            href={`/menu/${restaurantId}/group/join${contextQuery}`}
            className="mnu-secondary-btn block w-full"
          >
            Join Group
          </Link>

          <Link
            href={`/menu/${restaurantId}${contextQuery}`}
            className="block pt-1 text-center text-sm font-semibold text-carbon-400"
          >
            Order on my own instead
          </Link>
        </div>
      </>
    </GroupShell>
  );
}
