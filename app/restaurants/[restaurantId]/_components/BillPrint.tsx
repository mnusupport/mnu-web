'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { billingApi, type AdminOrderRecord, type RestaurantBillRecord } from '@/lib/api';
import { readAutoPrint, readPrintFormat, writeAutoPrint, writePrintFormat, type PrintFormat } from '@/lib/printPrefs';
import { BillDocument } from './BillDocument';
import { KotDocument } from './KotDocument';

type PrintJob = { kind: 'BILL'; bill: RestaurantBillRecord; format: PrintFormat } | { kind: 'KOT'; order: AdminOrderRecord; format: PrintFormat; printedAt: Date };

// Renders the bill into its own root on <body> and opens the browser print dialog. Print CSS (globals.css) hides
// everything else, so the staff member prints from wherever they are (order board, order detail, bill page).
// This only OPENS the dialog; a browser cannot tell us whether paper actually came out, so the UI never claims it did.
function BillPrintPortal({ job, onDone }: { job: PrintJob | null; onDone: () => void }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    const el = document.createElement('div'); el.id = 'bill-print-root'; document.body.appendChild(el); setRoot(el);
    return () => { el.remove(); };
  }, []);
  useEffect(() => {
    if (!root || !job) return;
    const style = document.createElement('style'); style.id = 'bill-page-style';
    style.textContent = job.format === 'THERMAL80' ? '@page{size:80mm auto;margin:2mm}' : '@page{size:A4;margin:12mm}';
    document.head.appendChild(style);
    const finish = () => done.current();
    window.addEventListener('afterprint', finish, { once: true });
    const start = window.setTimeout(() => window.print(), 200);
    const failsafe = window.setTimeout(finish, 120_000); // some mobile browsers never fire afterprint
    return () => { clearTimeout(start); clearTimeout(failsafe); window.removeEventListener('afterprint', finish); style.remove(); };
  }, [root, job]);
  return root && job ? createPortal(job.kind === 'KOT' ? <KotDocument order={job.order} format={job.format} printedAt={job.printedAt} /> : <BillDocument bill={job.bill} format={job.format} />, root) : null;
}

export function usePrintBill(restaurantId: string): { print: (source: string | RestaurantBillRecord) => Promise<void>; printKot: (order: AdminOrderRecord) => void; busy: boolean; error: string | null; portal: ReactNode } {
  const [job, setJob] = useState<PrintJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const print = useCallback(async (source: string | RestaurantBillRecord) => {
    if (jobRef.current) return;
    setError(null); setBusy(true);
    try {
      // Always print the SAVED bill from the server (never a recomputed one); reprinting never creates or edits a bill.
      const bill = typeof source === 'string' ? await billingApi.get(restaurantId, source) : source;
      setJob({ kind: 'BILL', bill, format: readPrintFormat() });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the bill to print.'); } finally { setBusy(false); }
  }, [restaurantId]);
  // One print job at a time: while a dialog is open (or opening) further clicks, rerenders and retries are ignored,
  // so a KOT can never be sent twice by a double tap. Printing only READS the order; it makes no API call, creates
  // no order/bill and never touches payment state, so a failed print cannot affect an accepted order.
  const jobRef = useRef<PrintJob | null>(null);
  jobRef.current = job;
  const printKot = useCallback((order: AdminOrderRecord) => {
    if (jobRef.current) return;
    setError(null);
    setJob({ kind: 'KOT', order, format: readPrintFormat(), printedAt: new Date() });
  }, []);
  const portal = <BillPrintPortal job={job} onDone={() => setJob(null)} />;
  return { print, printKot, busy, error, portal };
}

/** Per-device print settings: paper size and whether to open the print dialog as soon as an order is marked Ready. */
export function PrintPrefs() {
  const [format, setFormat] = useState<PrintFormat>('A4');
  const [auto, setAuto] = useState(false);
  useEffect(() => { setFormat(readPrintFormat()); setAuto(readAutoPrint()); }, []);
  return (
    <details className="rounded-xl border border-ink-100 bg-white p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-ink-700">Bill printing settings (this device)</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-ink-500">Paper
          <select value={format} onChange={(e) => { const v = e.target.value as PrintFormat; setFormat(v); writePrintFormat(v); }} className="mt-1 block w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900">
            <option value="A4">A4 sheet</option><option value="THERMAL80">80 mm thermal roll</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-xs font-semibold text-ink-500">
          <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); writeAutoPrint(e.target.checked); }} className="mt-0.5 h-4 w-4" />
          <span>Open the print dialog automatically when an order is marked Ready
            <span className="mt-1 block font-normal text-ink-400">Browsers always ask before printing. For one-click printing on a counter PC, start Chrome/Edge with <code>--kiosk-printing</code> and set the receipt printer as default.</span></span>
        </label>
      </div>
    </details>
  );
}
