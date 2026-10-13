'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { billingApi, type RestaurantBillRecord } from '@/lib/api';
import { useRestaurantContext } from '../restaurant-context';

const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
export default function BillingPage() {
  useRestaurantContext();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [items, setItems] = useState<RestaurantBillRecord[]>([]); const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); const [method, setMethod] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [page, setPage] = useState(1); const [pages, setPages] = useState(1); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const latest = useRef(0);
  const load = useCallback(() => { const mine = ++latest.current; setLoading(true); setError(''); billingApi.list(restaurantId, { search, status, method, from, to, page, limit: 20 }).then(r => { if (mine !== latest.current) return; setItems(r.items); setPages(r.totalPages); setTotal(r.total); }).catch(e => { if (mine === latest.current) setError(e instanceof Error ? e.message : 'Could not load bills.'); }).finally(() => { if (mine === latest.current) setLoading(false); }); }, [restaurantId, search, status, method, from, to, page]);
  useEffect(() => { load(); }, [load]);
  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-ink-400">Finance</p><h1 className="mt-1 text-3xl font-bold text-ink-900">Billing & payments</h1><p className="mt-1 text-sm text-ink-500">Issued bills and manually recorded payments.</p></div><div className="rounded-xl bg-white px-4 py-3 text-sm"><span className="text-ink-400">Bills found</span><strong className="ml-3 text-ink-900">{total}</strong></div></div>
    <div className="grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <input aria-label="Search bill or order" className="rounded-xl border border-ink-200 px-3 py-2 text-sm" placeholder="Bill or order number" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} />
      <select aria-label="Payment status" className="rounded-xl border border-ink-200 px-3 py-2 text-sm" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="VOID">Void</option></select>
      <select aria-label="Payment method" className="rounded-xl border border-ink-200 px-3 py-2 text-sm" value={method} onChange={e=>{setMethod(e.target.value);setPage(1)}}><option value="">All methods</option><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="OTHER">Other</option></select>
      <input aria-label="From date" type="date" className="rounded-xl border border-ink-200 px-3 py-2 text-sm" value={from} onChange={e=>{setFrom(e.target.value);setPage(1)}} />
      <input aria-label="To date" type="date" className="rounded-xl border border-ink-200 px-3 py-2 text-sm" value={to} onChange={e=>{setTo(e.target.value);setPage(1)}} />
    </div>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {loading ? <p className="p-8 text-sm text-ink-400">Loading bills…</p> : items.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-ink-900">No bills found</p><p className="mt-1 text-sm text-ink-400">Generate a bill from an order to see it here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-4">Bill / order</th><th className="p-4">Issued</th><th className="p-4">Order type</th><th className="p-4">Total</th><th className="p-4">Payment</th><th className="p-4">Method</th><th className="p-4">Action</th></tr></thead><tbody>{items.map(b=><tr key={b._id} className="border-t border-ink-100"><td className="p-4"><strong className="block text-ink-900">{b.invoiceNumber}</strong><span className="text-xs text-ink-400">{b.orderNumber}</span></td><td className="p-4 text-ink-500">{new Date(b.issuedAt).toLocaleString()}</td><td className="p-4">{String(b.orderSnapshot?.orderType)==='TAKEAWAY'?'Takeaway':`Table ${String(b.orderSnapshot?.tableNumber ?? '—')}`}</td><td className="p-4 font-semibold">{money(b.total)}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.voidedAt?'bg-red-50 text-red-700':b.paymentStatus==='PAID'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{b.voidedAt?'VOID':b.paymentStatus}</span></td><td className="p-4">{b.payment?.method ?? '—'}</td><td className="p-4"><Link className="font-semibold text-brand-600 hover:underline" href={`/restaurants/${restaurantId}/billing/${b._id}`}>Open / print</Link></td></tr>)}</tbody></table></div>}
    </div>
    <div className="flex items-center justify-between text-sm text-ink-500"><span>Page {page} of {Math.max(1,pages)}</span><div className="flex gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-ink-200 px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-ink-200 px-3 py-2 disabled:opacity-40">Next</button></div></div>
  </div>;
}
