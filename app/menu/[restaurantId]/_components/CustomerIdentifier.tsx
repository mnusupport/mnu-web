'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getCustomerNameError, getPhoneError } from '@/lib/customerRecognition';
import type { CustomerRecognitionState } from '@/lib/useCustomerRecognition';

const card = 'mt-1 rounded-card border border-hairline bg-surface p-5';
const label = 'text-xs font-semibold uppercase tracking-[.12em] text-carbon-400';
const input = 'mt-2 h-12 w-full rounded-card border border-hairline bg-surface px-4 text-[15px] text-carbon-900 outline-none focus:border-carbon-900';
const primary = 'flex h-14 w-full items-center justify-center gap-2 rounded-full bg-night text-[15px] font-semibold text-white transition active:scale-[.985] disabled:opacity-60';
const secondary = 'flex h-12 w-full items-center justify-center rounded-full border border-[var(--mnu-line)] text-[14px] font-semibold text-carbon-900 transition active:scale-[.985]';
const subtle = 'mt-4 block w-full text-center text-[13px] font-medium text-carbon-400 underline underline-offset-4';

interface CustomerIdentifierProps {
  rec: CustomerRecognitionState;
  /** Order name used by the name-only fallback (and by a recognized customer with no usable saved name). */
  name: string;
  onNameChange: (value: string) => void;
  nameError: string | null;
  /** True when the recognized customer already has a name valid for the order. */
  recognizedHasName: boolean;
}

// The only customer UI on the review page. It never blocks ordering: every
// identification step offers "continue with just my name", and any failure ends
// in the plain name field.
export function CustomerIdentifier({ rec, name, onNameChange, nameError, recognizedHasName }: CustomerIdentifierProps) {
  const [phone, setPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const shownError = fieldError ?? null;
  // The typed phone number intentionally survives phase changes (Yes -> not found
  // -> register keeps it); validation messages must not.
  useEffect(() => { setFieldError(null); }, [rec.phase]);
  const notice = rec.message ? (
    <p role="status" className="mt-3 rounded-2xl bg-[var(--mnu-card)] px-4 py-2.5 text-[13px] leading-5 text-carbon-500">{rec.message}</p>
  ) : null;
  const skip = (
    <button type="button" onClick={rec.useNameOnly} className={subtle}>Continue with just my name</button>
  );

  const nameField = (
    <div>
      <label htmlFor="customer-name" className={label}>Your name</label>
      <input
        id="customer-name"
        type="text"
        autoComplete="name"
        maxLength={80}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Enter your name"
        aria-invalid={nameError ? true : undefined}
        aria-describedby={nameError ? 'customer-name-error' : undefined}
        className={input}
      />
      {nameError && <p id="customer-name-error" role="alert" className="mt-2 text-[13px] text-red-600">{nameError}</p>}
    </div>
  );

  if (rec.phase === 'checking') {
    return (
      <div className={card} aria-busy="true">
        <div className="mnu-shimmer-light h-5 w-40 rounded-full" />
        <div className="mnu-shimmer-light mt-3 h-4 w-28 rounded-full" />
        {skip}
      </div>
    );
  }

  if (rec.phase === 'ask') {
    return (
      <div className={card}>
        <p className={label}>Before you order</p>
        <h2 className="mt-1 text-lg font-semibold text-carbon-900">Have you ordered here before?</h2>
        <div className="mt-4 space-y-2.5">
          <button type="button" onClick={rec.chooseReturning} className={primary}>Yes, I&apos;ve ordered before</button>
          <button type="button" onClick={rec.chooseNew} className={secondary}>No, I&apos;m new here</button>
        </div>
        {notice}
        {skip}
      </div>
    );
  }

  if (rec.phase === 'returning') {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      const error = getPhoneError(phone);
      setFieldError(error);
      if (!error) void rec.submitReturning(phone.trim());
    };
    return (
      <form onSubmit={submit} className={card} noValidate>
        <p className={label}>Welcome back</p>
        <label htmlFor="customer-phone" className="mt-3 block text-sm font-medium text-carbon-900">Phone number</label>
        <input
          id="customer-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setFieldError(null); }}
          placeholder="Phone number"
          aria-invalid={shownError ? true : undefined}
          className={input}
        />
        {shownError && <p role="alert" className="mt-2 text-[13px] text-red-600">{shownError}</p>}
        {notice}
        <button type="submit" disabled={rec.busy} className={`${primary} mt-4`}>{rec.busy ? 'Checking…' : 'Continue'}</button>
        <button type="button" onClick={rec.backToAsk} className={subtle}>Back</button>
        {skip}
      </form>
    );
  }

  if (rec.phase === 'new') {
    const phoneValue = phone;
    const submit = (e: FormEvent) => {
      e.preventDefault();
      const error = getCustomerNameError(newName) ?? getPhoneError(phoneValue);
      setFieldError(error);
      if (!error) void rec.submitNew(newName.trim(), phoneValue.trim());
    };
    return (
      <form onSubmit={submit} className={card} noValidate>
        <p className={label}>Almost ready</p>
        <label htmlFor="new-customer-name" className="mt-3 block text-sm font-medium text-carbon-900">Your name</label>
        <input
          id="new-customer-name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setFieldError(null); }}
          placeholder="Your name"
          className={input}
        />
        <label htmlFor="new-customer-phone" className="mt-4 block text-sm font-medium text-carbon-900">Phone number</label>
        <input
          id="new-customer-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={phoneValue}
          onChange={(e) => { setPhone(e.target.value); setFieldError(null); }}
          placeholder="Phone number"
          className={input}
        />
        {shownError && <p role="alert" className="mt-2 text-[13px] text-red-600">{shownError}</p>}
        {notice}
        <button type="submit" disabled={rec.busy} className={`${primary} mt-4`}>{rec.busy ? 'Saving…' : 'Continue'}</button>
        <button type="button" onClick={rec.backToAsk} className={subtle}>Back</button>
        {skip}
      </form>
    );
  }

  if (rec.phase === 'welcome' && rec.customer) {
    return (
      <div className={card}>
        <h2 className="text-lg font-semibold text-carbon-900">{rec.customer.name ? `Welcome back, ${rec.customer.name}` : 'Welcome back'}</h2>
        <p className={`${label} mt-4`}>Ordering as</p>
        <p className="mt-1 text-[15px] font-semibold text-carbon-900">{rec.customer.name ?? 'Returning customer'}</p>
        <p className="text-[14px] tabular-nums text-carbon-400">{rec.customer.maskedPhone}</p>
        <button type="button" onClick={rec.confirmWelcome} className={`${primary} mt-5`}>Continue</button>
      </div>
    );
  }

  if (rec.phase === 'recognized' && rec.customer) {
    const first = rec.customer.name?.split(' ')[0] ?? null;
    return (
      <div className={card}>
        <p className={label}>Customer</p>
        {recognizedHasName ? (
          <p className="mt-1 text-[15px] font-semibold text-carbon-900">{rec.customer.name}</p>
        ) : (
          <div className="mt-2">{nameField}</div>
        )}
        <p className="text-[14px] tabular-nums text-carbon-400">{rec.customer.maskedPhone}</p>
        <p className="mt-2 text-[13px] font-medium text-carbon-500"><span aria-hidden>✓</span> Recognized customer</p>
        <button type="button" onClick={rec.changeCustomer} className={subtle}>
          {first ? `Not ${first}? Change customer` : 'Not you? Change customer'}
        </button>
      </div>
    );
  }

  // nameOnly (and any inconsistent state): the plain Part 1.6 checkout.
  return (
    <div>
      {nameField}
      {notice}
      <button type="button" onClick={rec.backToAsk} className={subtle}>Ordered here before? Find my details</button>
    </div>
  );
}
