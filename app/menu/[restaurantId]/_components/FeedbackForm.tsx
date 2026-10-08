'use client';

import { useState } from 'react';
import {
  feedbackApi,
  type FeedbackDecisionHelp,
  type FeedbackFindingEase,
} from '@/lib/api';

interface FeedbackFormProps {
  restaurantId: string;
  orderId: string;
  orderNumber: string;
}

const findingOptions: { value: FeedbackFindingEase; label: string }[] = [
  { value: 'EASY', label: 'Very easily' },
  { value: 'MOSTLY', label: 'Mostly' },
  { value: 'SEARCHED', label: 'I had to search' },
  { value: 'COULD_NOT_FIND', label: "I couldn't find it" },
];

const decisionOptions: { value: FeedbackDecisionHelp; label: string }[] = [
  { value: 'YES', label: 'Definitely' },
  { value: 'A_LITTLE', label: 'A little' },
  { value: 'NOT_REALLY', label: 'Not really' },
  { value: 'KNEW', label: 'I already knew' },
];

export function FeedbackForm({ restaurantId, orderId, orderNumber }: FeedbackFormProps) {
  const [visible, setVisible] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [findingEase, setFindingEase] = useState<FeedbackFindingEase | undefined>();
  const [decisionHelp, setDecisionHelp] = useState<FeedbackDecisionHelp | undefined>();
  const [friction, setFriction] = useState('');
  const [improvement, setImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const skip = () => {
    if (submitting) return;
    setVisible(false);
  };

  const submit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await feedbackApi.submit(restaurantId, {
        orderId,
        rating,
        ...(findingEase ? { findingEase } : {}),
        ...(decisionHelp ? { decisionHelp } : {}),
        ...(friction.trim() ? { friction: friction.trim() } : {}),
        ...(improvement.trim() ? { improvement: improvement.trim() } : {}),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  if (submitted) {
    return (
      <section className="mt-7 rounded-[28px] border border-[var(--mnu-line)] bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-500/10 text-success-700">✓</div>
          <div>
            <p className="text-[15px] font-semibold text-carbon-900">Thanks — that helps.</p>
            <p className="mt-1 text-[13px] leading-6 text-carbon-400">Your feedback on the menu experience has been saved.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-7 rounded-[28px] border border-[var(--mnu-line)] bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mnu-kicker text-[9px] text-carbon-400">Optional · about 30 seconds</p>
          <h2 className="mt-2 text-[1.1rem] font-semibold leading-tight text-carbon-900">Help us make the menu better</h2>
          <p className="mt-1.5 text-[13px] leading-6 text-carbon-400">A few quick answers about your ordering experience — not the food or service.</p>
        </div>
        <button type="button" onClick={skip} className="shrink-0 pt-1 text-xs font-semibold text-carbon-400 hover:text-carbon-900">Skip</button>
      </div>

      <div className="mt-5">
        <p className="text-[13px] font-semibold text-carbon-900">How was your experience using this digital menu?</p>
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Menu experience rating">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = rating === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRating(value)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition ${active ? 'border-night bg-night text-white' : 'border-[var(--mnu-line)] bg-white text-carbon-700 hover:border-carbon-300'}`}
              >
                {value}
              </button>
            );
          })}
        </div>
        {!rating && <p className="mt-2 text-[11px] text-carbon-400">Choose 1–5 stars before sending. Everything else is optional.</p>}
      </div>

      <ChoiceQuestion
        className="mt-6"
        question="Did you find what you were looking for easily?"
        value={findingEase}
        options={findingOptions}
        onChange={setFindingEase}
      />

      <ChoiceQuestion
        className="mt-6"
        question="Did the menu help you decide what to order?"
        value={decisionHelp}
        options={decisionOptions}
        onChange={setDecisionHelp}
      />

      <label className="mt-6 block">
        <span className="text-[13px] font-semibold text-carbon-900">Was anything confusing or frustrating?</span>
        <textarea value={friction} onChange={(e) => setFriction(e.target.value.slice(0, 600))} rows={3} placeholder="Tell us what got in the way…" className="mt-2 w-full resize-none rounded-2xl border border-[var(--mnu-line)] bg-[var(--mnu-card)] px-4 py-3 text-[13px] text-carbon-900 outline-none placeholder:text-carbon-300 focus:border-carbon-300" />
      </label>

      <label className="mt-5 block">
        <span className="text-[13px] font-semibold text-carbon-900">If you could change ONE thing about this menu, what would it be?</span>
        <textarea value={improvement} onChange={(e) => setImprovement(e.target.value.slice(0, 600))} rows={3} placeholder="For example: photos, categories, descriptions, customization, ordering…" className="mt-2 w-full resize-none rounded-2xl border border-[var(--mnu-line)] bg-[var(--mnu-card)] px-4 py-3 text-[13px] text-carbon-900 outline-none placeholder:text-carbon-300 focus:border-carbon-300" />
      </label>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-[12px] text-red-600" role="alert">{error}</p>}

      <button type="button" onClick={submit} disabled={!rating || submitting} className="mt-4 w-full rounded-full bg-night px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-40">
        {submitting ? 'Saving feedback…' : `Send feedback for ${orderNumber}`}
      </button>
      <button type="button" onClick={skip} disabled={submitting} className="mt-2 w-full py-2 text-xs font-semibold text-carbon-400 disabled:opacity-50">Maybe later</button>
    </section>
  );
}

function ChoiceQuestion<T extends string>({
  className,
  question,
  value,
  options,
  onChange,
}: {
  className?: string;
  question: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={className}>
      <p className="text-[13px] font-semibold text-carbon-900">{question}</p>
      <div className="mt-2.5 grid gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left text-[12px] font-semibold transition ${active ? 'border-night bg-night text-white' : 'border-[var(--mnu-line)] bg-white text-carbon-700 hover:border-carbon-300'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
