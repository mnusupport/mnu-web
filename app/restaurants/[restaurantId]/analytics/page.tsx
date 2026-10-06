'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRestaurantContext } from '../restaurant-context';

export default function RestaurantAnalyticsPage() {
  useRestaurantContext();
  const params = useParams<{ restaurantId: string }>();
  return (
    <div>
      <div className="mnu-admin-pagehead">
        <div><p className="mnu-admin-eyebrow">Business intelligence</p><h2 className="mnu-admin-page-title">Analytics</h2><p className="mnu-admin-page-subtitle">Your live sales and order performance is surfaced on the Dashboard.</p></div>
        <Link href={`/restaurants/${params.restaurantId}/dashboard`} className="mnu-admin-secondary">Open dashboard</Link>
      </div>
      <div className="mnu-admin-analytics-hero">
        <div className="mnu-admin-analytics-mark"><ChartIcon /></div>
        <div><p className="mnu-admin-analytics-kicker">Live performance workspace</p><h3>Keep the operational view close to the numbers.</h3><p>Today&apos;s sales, orders, average order value, active and completed orders, top-selling items, recent orders, and the period trend are all available from the restaurant dashboard.</p></div>
        <Link href={`/restaurants/${params.restaurantId}/dashboard`} className="mnu-admin-primary">View performance <ArrowIcon /></Link>
      </div>
    </div>
  );
}
function ChartIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6M20 16V3"/></svg>}
function ArrowIcon(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>}
