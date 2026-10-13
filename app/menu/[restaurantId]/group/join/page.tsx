'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { groupOrdersApi } from '@/lib/api';
import { getGroupParticipantId } from '@/lib/groupParticipant';
import { setActiveGroupCode } from '@/lib/groupOrder';
import { GroupShell } from '../_components/GroupShell';
import { GroupParticipantIdentity, type GroupParticipantIdentityValue } from '../_components/GroupParticipantIdentity';

const CODE_LENGTH = 5;

export default function JoinGroupPage() {
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

  const [code, setCode] = useState(() => searchParams.get('code')?.toUpperCase() ?? '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<GroupParticipantIdentityValue | null>(null);
  const handleIdentityChange = useCallback((value: GroupParticipantIdentityValue | null) => setIdentity(value), []);


  const handleJoin = async () => {
    if (!identity?.name) {
      setError('Identify yourself before joining the group.');
      return;
    }
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== CODE_LENGTH) {
      setError(`Group codes are ${CODE_LENGTH} characters.`);
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const group = await groupOrdersApi.join(restaurantId, normalized, getGroupParticipantId(restaurantId), identity.name, identity.maskedPhone);
      setActiveGroupCode(restaurantId, group.groupCode);
      router.push(`/menu/${restaurantId}/group/${group.groupCode}${contextQuery}`);
    } catch (err) {
      // The server deliberately returns the same message for "wrong
      // code" and "code belongs to another restaurant" — see
      // GroupOrdersService.findGroupOrThrow. Surfaced verbatim rather
      // than reworded, so the two stay indistinguishable client-side too.
      setError(err instanceof Error ? err.message : 'Could not join that group.');
      setJoining(false);
    }
  };

  return (
    <GroupShell
      title="Join Group"
      subtitle={tableNumber ? `Table ${tableNumber}` : null}
      backHref={`/menu/${restaurantId}/group${contextQuery}`}
      bottomPadding="pb-12"
    >
      <div className="mb-4">
        <GroupParticipantIdentity onChange={handleIdentityChange} />
      </div>

      <>
        <div className="rounded-[28px] border border-[var(--mnu-line)] bg-white p-6 shadow-soft">
          <h2 className="text-base font-bold text-carbon-900">Enter the group code</h2>
          <p className="mt-1 text-sm text-carbon-400">
            Ask whoever started the group at your table for their {CODE_LENGTH}-character code.
          </p>

          <input
            value={code}
            onChange={(e) => {
              // Uppercase + strip anything outside the code alphabet as
              // the customer types — the codes are generated without
              // ambiguous characters (no 0/O/1/I/L), so accepting them
              // here would only ever produce a confusing failure.
              setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, CODE_LENGTH));
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
            placeholder="ABC42"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            aria-label="Group code"
            className="mnu-code-input mt-4 w-full"
          />

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || code.length !== CODE_LENGTH || !identity?.name}
            className="mnu-primary-btn mt-4 w-full disabled:opacity-40"
          >
            {joining ? 'Joining…' : 'Join Group'}
          </button>
        </div>
      </>
    </GroupShell>
  );
}
