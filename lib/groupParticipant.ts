'use client';

const keyFor = (restaurantId: string) => `mnu_group_participant:${restaurantId}`;

export function getGroupParticipantId(restaurantId: string): string {
  if (typeof window === 'undefined') return 'server-participant';
  try {
    const existing = localStorage.getItem(keyFor(restaurantId));
    if (existing) return existing;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(keyFor(restaurantId), id);
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
