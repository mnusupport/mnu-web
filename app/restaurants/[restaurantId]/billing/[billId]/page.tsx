'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { billingApi, type RestaurantBillRecord } from '@/lib/api';
import { readPrintFormat, type PrintFormat } from '@/lib/printPrefs';
import { useRestaurantContext } from '../../restaurant-context';
import { BillDocument } from '../../_components/BillDocument';
import { PrintPrefs, usePrintBill } from '../../_components/BillPrint';

export default function BillReceiptPage() {
  useRestaurantContext();
  const { restaurantId, billId } = useParams<{ restaurantId: string; billId: string }>();
  const [bill, setBill] = useState<RestaurantBillRecord | null>(null);
  const [error, setError] = useState('');
  const [format, setFormat] = useState<PrintFormat>('A4');
  const { print, busy, error: printError, portal } = usePrintBill(restaurantId);
  useEffect(() => { setFormat(readPrintFormat()); }, []);
  useEffect(() => { billingApi.get(restaurantId, billId).then(setBill).catch((e) => setError(e instanceof Error ? e.message : 'Could not load bill.')); }, [restaurantId, billId]);

  return (
    <div className="mx-auto max-w-3xl">
      {portal}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/restaurants/${restaurantId}/billing`} className="text-sm font-semibold text-ink-500">← Billing &amp; payments</Link>
        <button onClick={() => bill && void print(bill._id)} disabled={!bill || busy} className="min-h-11 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{busy ? 'Preparing…' : 'Print bill'}</button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-ink-500">Preview:</span>
        {(['A4', 'THERMAL80'] as PrintFormat[]).map((f) => (
          <button key={f} onClick={() => setFormat(f)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${format === f ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'}`}>{f === 'A4' ? 'A4' : '80 mm thermal'}</button>
        ))}
        <span className="text-xs text-ink-400">Printing uses the paper size saved in this device&apos;s print settings below.</span>
      </div>
      <div className="mb-4"><PrintPrefs /></div>
      {(error || printError) && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || printError}</p>}
      {!bill && !error && <p className="p-8 text-sm text-ink-400">Loading bill…</p>}
      {bill && <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white p-4 shadow-sm"><BillDocument bill={bill} format={format} /></div>}
      <p className="mt-3 text-xs text-ink-400">Printing or reprinting shows the saved bill. It never creates a new invoice number and never changes totals or payment status.</p>
    </div>
  );
}
