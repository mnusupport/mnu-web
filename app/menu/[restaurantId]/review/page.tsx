'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { menuApi, ordersApi, type OrderConfirmation, type PublicMenu } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { rememberOrder } from '@/lib/myOrders';
import { getActiveGroupCode } from '@/lib/groupOrder';
import { getCustomerNameError, getRecognitionToken } from '@/lib/customerRecognition';
import { useCustomerRecognition } from '@/lib/useCustomerRecognition';
import { CustomerIdentifier } from '../_components/CustomerIdentifier';
import { ItemImage } from '../_components/ItemImage';
import { StageLayout } from '../_components/StageLayout';
import { FeedbackForm } from '../_components/FeedbackForm';

export default function OrderReviewPage() {
  const params = useParams<{ restaurantId: string }>();
  const searchParams = useSearchParams();
  const { restaurantId } = params;
  const tableNumber = searchParams.get('table');
  const tableId = searchParams.get('tableId');
  const orderType = tableId ? 'DINE_IN' : 'TAKEAWAY';
  const contextQuery = (() => {
    const qs = new URLSearchParams();
    if (tableNumber) qs.set('table', tableNumber);
    if (tableId) qs.set('tableId', tableId);
    const str = qs.toString();
    return str ? `?${str}` : '';
  })();

  const { items, subtotal, clearCart } = useCart(restaurantId);
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [activeGroupCode, setActiveGroupCodeState] = useState<string | null>(null);
  const [groupChecked, setGroupChecked] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  // Optional convenience: remembers the customer for this restaurant on this
  // browser. It only ever supplies the same `customerName` the name-only
  // checkout sends; the order request is identical either way.
  const rec = useCustomerRecognition(restaurantId);
  const recognizedHasName = rec.phase === 'recognized' && !!rec.customer?.name && getCustomerNameError(rec.customer.name) === null;
  const canOrder = rec.phase === 'recognized' || rec.phase === 'nameOnly';

  const getIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      idempotencyKeyRef.current = random;
    }
    return idempotencyKeyRef.current;
  };

  useEffect(() => {
    setActiveGroupCodeState(getActiveGroupCode(restaurantId));
    setGroupChecked(true);
  }, [restaurantId]);

  useEffect(() => {
    menuApi.getPublicMenu(restaurantId)
      .then(setMenu)
      .catch((err) => setMenuError(err instanceof Error ? err.message : 'Failed to load restaurant.'));
  }, [restaurantId]);

  const placeOrder = async () => {
    if (submitting) return;
    setOrderError(null);
    const name = (recognizedHasName ? (rec.customer?.name ?? '') : customerName).trim().replace(/\s+/g, ' ');
    const invalidName = getCustomerNameError(name);
    if (invalidName) { setNameError(invalidName); return; }
    setNameError(null);
    setSubmitting(true);
    try {
      const result = await ordersApi.create(
        restaurantId,
        tableId ?? undefined,
        orderType,
        items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
        getIdempotencyKey(),
        name,
        rec.customer?.maskedPhone ?? null,
        getRecognitionToken(restaurantId),
      );
      rememberOrder(restaurantId, result.id);
      clearCart();
      setConfirmation(result);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const menuHref = `/menu/${restaurantId}${contextQuery}`;
  const cartHref = `/menu/${restaurantId}/cart${contextQuery}`;
  const chip = tableNumber ? `Table ${tableNumber}` : 'Takeaway';
  const primaryBtn = 'flex h-14 w-full items-center justify-center gap-2 rounded-full bg-night text-[15px] font-semibold text-white transition active:scale-[.985] disabled:opacity-60';
  const notice = (title: string, body: string, action?: { href: string; label: string }) => (
    <StageLayout restaurantId={restaurantId} backHref={cartHref} backLabel="Back to cart" kicker="Your order" title={title} chip={chip} bottomPad="pb-24">
      <div className="animate-fade-slide-up">
        <p className="text-[15px] leading-7 text-carbon-400">{body}</p>
        {action && <Link href={action.href} className={`${primaryBtn} mt-8`}>{action.label}</Link>}
      </div>
    </StageLayout>
  );

  if (confirmation) {
    return (
      <StageLayout restaurantId={restaurantId} backHref={menuHref} backLabel="Back to menu" kicker="Order placed" title="Thank you" chip={chip} bottomPad="pb-24">
        <div className="text-center">
          <div className="mnu-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-night text-white shadow-[0_24px_50px_-18px_rgba(0,0,0,.6)]">
            <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mnu-draw" /></svg>
          </div>
          <p className="mt-7 text-[15px] leading-7 text-carbon-400">The kitchen at <span className="font-medium text-carbon-900">{confirmation.restaurant.name}</span> has your order and is on it.</p>
        </div>
        <dl className="mt-9 animate-fade-slide-up divide-y divide-[var(--mnu-line)] text-[14px]" style={{ animationDelay: '160ms' }}>
          <div className="flex justify-between py-4"><dt className="text-carbon-400">Order</dt><dd className="font-semibold text-carbon-900">{confirmation.orderNumber}</dd></div>
          <div className="flex justify-between py-4"><dt className="text-carbon-400">Table</dt><dd className="font-semibold text-carbon-900">{confirmation.table?.tableNumber ?? 'Takeaway'}</dd></div>
          <div className="flex justify-between py-4"><dt className="text-carbon-400">Status</dt><dd className="font-semibold text-carbon-900">{confirmation.status}</dd></div>
          <div className="flex items-baseline justify-between py-5"><dt className="text-carbon-400">Total</dt><dd className="mnu-display text-[2rem] leading-none tabular-nums text-carbon-900">₹{confirmation.total}</dd></div>
        </dl>
        <Link href={`/menu/${restaurantId}/orders/${confirmation.id}${contextQuery}`} className={`${primaryBtn} mt-6`}>Track order <span aria-hidden>→</span></Link>
        <FeedbackForm restaurantId={restaurantId} orderId={confirmation.id} orderNumber={confirmation.orderNumber} />
        <Link href={menuHref} className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-[var(--mnu-line)] text-[14px] font-semibold text-carbon-900">Back to menu</Link>
      </StageLayout>
    );
  }

  if (groupChecked && activeGroupCode) {
    return notice('Group order', 'Your table sends one order together, so checkout happens in the group — not here.', { href: `/menu/${restaurantId}/group/${activeGroupCode}${contextQuery}`, label: 'Go to group order' });
  }

  if (items.length === 0) return notice('Nothing here', 'Your order is empty.', { href: menuHref, label: 'Browse the menu' });

  if (!menu && !menuError) {
    return <StageLayout restaurantId={restaurantId} backHref={cartHref} backLabel="Back to cart" kicker="Your order" title="Review" chip={chip} bottomPad="pb-24"><div className="space-y-4" aria-busy="true">{[0,1,2].map((i) => <div key={i} className="mnu-shimmer-light h-[88px] rounded-[26px]" />)}</div></StageLayout>;
  }

  return (
    <StageLayout
      restaurantId={restaurantId}
      backHref={cartHref}
      backLabel="Back to cart"
      kicker={menu?.restaurantName ?? 'Your order'}
      title="Review"
      chip={chip}
      bottomPad={canOrder ? 'pb-56' : 'pb-24'}
      footer={
        !canOrder ? undefined : <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-md rounded-[30px] bg-white p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,.55)]">
            {orderError && <p className="mx-2 mb-2 mt-1 rounded-2xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{orderError}</p>}
            <div className="flex items-end justify-between px-4 pb-2 pt-2"><p className="text-[12px] font-medium text-[#8b8579]">Total</p><p className="mnu-display text-[1.9rem] leading-none tabular-nums text-night">₹{subtotal}</p></div>
            <button type="button" onClick={placeOrder} disabled={submitting} className={primaryBtn}>
              {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Placing your order</> : 'Place order'}
            </button>
          </div>
        </div>
      }
    >
      <CustomerIdentifier
        rec={rec}
        name={customerName}
        onNameChange={(value) => { setCustomerName(value); if (nameError) setNameError(null); }}
        nameError={nameError}
        recognizedHasName={recognizedHasName}
      />

      <div className="mt-7">
        {items.map((item, i) => (
          <div key={item.itemId} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} className="animate-fade-slide-up flex items-center gap-4 border-b border-[var(--mnu-line)] py-4 first:pt-0 last:border-b-0">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[20px] bg-[var(--mnu-card)]"><ItemImage imageUrl={item.imageUrl ?? null} seed={item.itemId || item.name} alt={item.name} className="h-full w-full" iconClassName="text-2xl" /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold text-carbon-900">{item.name}</p><p className="mt-0.5 text-[12px] text-carbon-400">₹{item.price} × {item.quantity}</p></div>
            <p className="shrink-0 text-[15px] font-semibold tabular-nums text-carbon-900">₹{item.price * item.quantity}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-[var(--mnu-line)] pt-5 text-[14px]">
        <div className="flex justify-between text-carbon-400"><span>Subtotal</span><span className="tabular-nums">₹{subtotal}</span></div>
        <div className="flex items-baseline justify-between text-carbon-900"><span className="font-medium">Total</span><span className="mnu-display text-[1.6rem] tabular-nums">₹{subtotal}</span></div>
      </div>
    </StageLayout>
  );
}
