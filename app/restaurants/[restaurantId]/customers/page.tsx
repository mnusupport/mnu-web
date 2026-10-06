'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { customersApi, type RestaurantCustomerRecord } from '@/lib/api';
import { useRestaurantContext } from '../restaurant-context';

// Read-only, restaurant-scoped. `customersApi.list()` hits
// GET /restaurants/:id/customers, which OrdersService derives entirely
// from this restaurant's own Order documents (see that method's own
// comment) — never a global customer list filtered client-side, and
// never mock data.
export default function RestaurantCustomersPage() {
  useRestaurantContext();
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;

  const [customers, setCustomers] = useState<RestaurantCustomerRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    setCustomers(null);
    setError(null);
    customersApi
      .list(restaurantId)
      .then(setCustomers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load customers.'));
  }, [restaurantId, loadKey]);

  return (
    <div>
      <div className="mnu-admin-pagehead">
        <div><p className="mnu-admin-eyebrow">Guest relationships</p><h2 className="mnu-admin-page-title">Customers</h2><p className="mnu-admin-page-subtitle">Customers who have ordered from this restaurant.</p></div>
        {customers && <div className="mnu-admin-order-summary"><strong>{customers.length}</strong> customers</div>}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <p>{error}</p>
          <button onClick={() => setLoadKey((k) => k + 1)} className="mt-1 text-xs font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {!customers && !error && <div className="mnu-admin-panel p-8 text-center text-xs text-ink-400">Loading customer records…</div>}

      {customers && customers.length === 0 && (
        <div className="mnu-admin-empty"><div className="mnu-admin-empty-mark"><UsersIcon /></div><p className="mnu-admin-empty-title">No customers yet</p><p className="mnu-admin-empty-text">Once someone places an order from a table at this restaurant, they&apos;ll show up here.</p></div>
      )}

      {customers && customers.length > 0 && (
        <div className="mnu-admin-panel overflow-hidden">
          <div className="mnu-admin-customer-head"><span>Customer</span><span>Contact</span><span>Orders</span><span>Spend</span></div>
          {customers.map((customer) => (
            <Link key={customer.id} href={`/restaurants/${restaurantId}/customers/${customer.id}`} className="mnu-admin-customer-row">
              <div className="flex min-w-0 items-center gap-10"><span className="mnu-admin-customer-avatar">{(customer.name || customer.customerCode || 'C').charAt(0).toUpperCase()}</span><div className="min-w-0"><p>{customer.name || customer.customerCode || 'Customer'}</p><span>{customer.customerCode}</span></div></div>
              <div className="mnu-admin-customer-contact">{[customer.mobileNumber, customer.email].filter(Boolean).join(' · ') || 'No contact details'}</div>
              <div className="mnu-admin-customer-orders">{customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}<small>Last {new Date(customer.lastOrderAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small></div>
              <div className="mnu-admin-customer-spend">₹{customer.totalSpent}<span>View <ArrowIcon /></span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M17 11a2.5 2.5 0 1 0 0-5M16 14c2.5.4 4.5 2.2 4.5 5"/></svg>}
function ArrowIcon(){return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>}
