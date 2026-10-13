'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { getCustomerNameError, getPhoneError } from '@/lib/customerRecognition';
import { useCustomerRecognition } from '@/lib/useCustomerRecognition';

export interface GroupParticipantIdentityValue {
  name: string;
  maskedPhone: string | null;
  recognized: boolean;
}

interface Props {
  onChange: (value: GroupParticipantIdentityValue | null) => void;
}

const card = 'rounded-[26px] border border-[var(--mnu-line)] bg-white p-5 shadow-soft';
const label = 'text-xs font-semibold uppercase tracking-[.12em] text-carbon-400';
const input = 'mt-2 h-12 w-full rounded-card border border-hairline bg-surface px-4 text-[15px] text-carbon-900 outline-none focus:border-carbon-900';
const primary = 'flex h-12 w-full items-center justify-center rounded-full bg-night text-[14px] font-semibold text-white transition active:scale-[.985] disabled:opacity-60';
const subtle = 'mt-3 block w-full text-center text-[13px] font-medium text-carbon-400 underline underline-offset-4';

export function GroupParticipantIdentity({ onChange }: Props) {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  if (!restaurantId) return null;
  return <GroupParticipantIdentityInner restaurantId={restaurantId} onChange={onChange} />;
}

function GroupParticipantIdentityInner({ restaurantId, onChange }: Props & { restaurantId: string }) {
  const rec = useCustomerRecognition(restaurantId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognized = rec.phase === 'recognized' && !!rec.customer?.name && getCustomerNameError(rec.customer.name) === null;
  const currentName = recognized ? rec.customer!.name!.trim() : name.trim();

  useEffect(() => {
    if (recognized) {
      onChange({ name: currentName, maskedPhone: rec.customer?.maskedPhone ?? null, recognized: true });
    } else if (rec.phase === 'nameOnly' && !getCustomerNameError(currentName)) {
      onChange({ name: currentName, maskedPhone: null, recognized: false });
    } else {
      onChange(null);
    }
  }, [recognized, currentName, rec.customer?.maskedPhone, rec.phase, onChange]);

  if (rec.phase === 'checking') {
    return <div className={card} aria-busy="true"><p className={label}>Your identity</p><div className="mnu-shimmer-light mt-3 h-12 rounded-full" /><p className={subtle}>Checking your restaurant recognition…</p></div>;
  }

  if (rec.phase === 'ask') {
    return (
      <div className={card}>
        <p className={label}>Your identity</p>
        <h2 className="mt-1 text-base font-semibold text-carbon-900">Identify yourself for this group</h2>
        <div className="mt-4 space-y-2">
          <button type="button" onClick={rec.chooseReturning} className={primary}>I&apos;ve ordered here before</button>
          <button type="button" onClick={rec.chooseNew} className="flex h-12 w-full items-center justify-center rounded-full border border-[var(--mnu-line)] text-[14px] font-semibold text-carbon-900">I&apos;m new here</button>
        </div>
        <button type="button" onClick={rec.useNameOnly} className={subtle}>Continue with just my name</button>
      </div>
    );
  }

  if (rec.phase === 'returning') {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      const e1 = getPhoneError(phone);
      setError(e1);
      if (!e1) void rec.submitReturning(phone.trim());
    };
    return (
      <form onSubmit={submit} className={card} noValidate>
        <p className={label}>Your identity</p>
        <label className="mt-3 block text-sm font-medium text-carbon-900" htmlFor="group-phone">Phone number</label>
        <input id="group-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} className={input} placeholder="Phone number" />
        {error && <p role="alert" className="mt-2 text-[13px] text-red-600">{error}</p>}
        {rec.message && <p className="mt-3 text-[13px] text-carbon-500">{rec.message}</p>}
        <button type="submit" disabled={rec.busy} className={`${primary} mt-4`}>{rec.busy ? 'Checking…' : 'Identify me'}</button>
        <button type="button" onClick={rec.backToAsk} className={subtle}>Back</button>
      </form>
    );
  }

  if (rec.phase === 'new') {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      const e1 = getCustomerNameError(name) ?? getPhoneError(phone);
      setError(e1);
      if (!e1) void rec.submitNew(name.trim(), phone.trim());
    };
    return (
      <form onSubmit={submit} className={card} noValidate>
        <p className={label}>Your identity</p>
        <label className="mt-3 block text-sm font-medium text-carbon-900" htmlFor="group-name">Your name</label>
        <input id="group-name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className={input} placeholder="Your name" />
        <label className="mt-4 block text-sm font-medium text-carbon-900" htmlFor="group-phone-new">Phone number</label>
        <input id="group-phone-new" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} className={input} placeholder="Phone number" />
        {error && <p role="alert" className="mt-2 text-[13px] text-red-600">{error}</p>}
        {rec.message && <p className="mt-3 text-[13px] text-carbon-500">{rec.message}</p>}
        <button type="submit" disabled={rec.busy} className={`${primary} mt-4`}>{rec.busy ? 'Saving…' : 'Identify me'}</button>
        <button type="button" onClick={rec.backToAsk} className={subtle}>Back</button>
        <button type="button" onClick={rec.useNameOnly} className={subtle}>Continue with just my name</button>
      </form>
    );
  }

  if (rec.phase === 'welcome' && rec.customer) {
    return (
      <div className={card}>
        <p className={label}>Your identity</p>
        <p className="mt-1 text-base font-semibold text-carbon-900">{rec.customer.name ?? 'Customer identified'}</p>
        <p className="text-sm text-carbon-400">{rec.customer.maskedPhone}</p>
        <p className="mt-2 text-[13px] font-medium text-carbon-500">Customer identified</p>
        <button type="button" onClick={rec.confirmWelcome} className={`${primary} mt-4`}>Continue</button>
      </div>
    );
  }

  if (rec.phase === 'recognized' && rec.customer) {
    return (
      <div className={card}>
        <p className={label}>Your identity</p>
        <p className="mt-1 text-base font-semibold text-carbon-900">{rec.customer.name ?? currentName}</p>
        <p className="text-sm text-carbon-400">{rec.customer.maskedPhone}</p>
        <p className="mt-2 text-[13px] font-medium text-carbon-500">Customer identified</p>
        <button type="button" onClick={rec.changeCustomer} className={subtle}>Change customer</button>
      </div>
    );
  }

  return (
    <div className={card}>
      <p className={label}>Your identity</p>
      <label className="mt-3 block text-sm font-medium text-carbon-900" htmlFor="group-name-fallback">Your name</label>
      <input id="group-name-fallback" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className={input} placeholder="Enter your name" />
      {error && <p role="alert" className="mt-2 text-[13px] text-red-600">{error}</p>}
      {rec.message && <p className="mt-3 text-[13px] text-carbon-500">{rec.message}</p>}
      <p className="mt-3 text-xs text-carbon-400">Phone not provided. You can still join and order with your name.</p>
    </div>
  );
}
