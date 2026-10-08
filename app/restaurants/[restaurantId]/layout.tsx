'use client';

import { useEffect, useState } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, platformAdminApi, type AuthUser, type Membership } from '@/lib/api';
import { RestaurantContext } from './restaurant-context';
import { OrderNotificationMonitor } from './_components/OrderNotificationMonitor';

const NAV_ITEMS = [
  { href: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: 'orders', label: 'Orders', icon: IconReceipt },
  { href: 'menu', label: 'Menu', icon: IconMenu },
  { href: 'tables', label: 'Tables', icon: IconTable },
  { href: 'customers', label: 'Customers', icon: IconCustomers },
  { href: 'analytics', label: 'Analytics', icon: IconChart },
  { href: 'settings', label: 'Settings', icon: IconSettings },
] as const;

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [superAdminRestaurant, setSuperAdminRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('mnu_token')) { router.push('/'); return; }
    authApi.me().then(async (res) => {
      setUser(res.user); setMemberships(res.memberships);
      if (res.platformRole === 'SUPER_ADMIN') {
        const selected = await platformAdminApi.getRestaurant(restaurantId);
        setSuperAdminRestaurant(selected);
      }
    }).catch((err) => {
      if (err instanceof Error && err.message.includes('Super Admin')) { setError(err.message); return; }
      localStorage.removeItem('mnu_token'); router.push('/');
    }).finally(() => setLoading(false));
  }, [router, restaurantId]);

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  const membership = memberships.find((m) => m.restaurant_id === restaurantId) ??
    (user?.platformRole === 'SUPER_ADMIN' && superAdminRestaurant ? {
      restaurant_id: superAdminRestaurant.id, restaurant_name: superAdminRestaurant.name, role: 'SUPER_ADMIN' as const,
    } : null);
  const isSuperAdmin = user?.platformRole === 'SUPER_ADMIN';

  const handleLogout = () => {
    authApi.logout().finally(() => { localStorage.removeItem('mnu_token'); router.push('/'); });
  };

  if (loading) return <AdminLoading />;
  if (error) return <div className="mnu-admin-state"><div className="mnu-admin-state-icon">!</div><p>{error}</p></div>;
  if (!user || !membership) return (
    <div className="mnu-admin-state">
      <div className="mnu-admin-state-icon">!</div>
      <p>You don&apos;t have access to this restaurant.</p>
      <Link href="/dashboard" className="mnu-admin-link">Back to your dashboard</Link>
    </div>
  );

  return (
    <RestaurantContext.Provider value={{ user, membership, memberships, pendingOrderCount }}>
      <div className="mnu-admin min-h-screen">
        <div className={`mnu-admin-mobilebar ${isSuperAdmin ? 'mnu-admin-mobilebar-super' : ''}`}>
          <button onClick={() => setMobileNavOpen((v) => !v)} aria-label="Toggle navigation" className="mnu-admin-icon-button"><IconMenuToggle /></button>
          <div className="min-w-0">
            <p className="mnu-admin-mobile-eyebrow">Restaurant workspace</p>
            <span className="mnu-admin-mobile-title">{membership.restaurant_name}</span>
          </div>
          <div className="mnu-admin-avatar">{initials(user.name)}</div>
        </div>

        <Sidebar restaurantId={restaurantId} pathname={pathname} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} isSuperAdmin={isSuperAdmin} pendingOrderCount={pendingOrderCount} restaurantName={membership.restaurant_name} />

        <div className="mnu-admin-shell">
          {isSuperAdmin && (
            <div className="mnu-admin-superbar">
              <span><strong>Super Admin</strong> · Managing {membership.restaurant_name}</span>
              <Link href="/super-admin/restaurants">Exit to Super Admin</Link>
            </div>
          )}
          <Header user={user} membership={membership} memberships={memberships} restaurantId={restaurantId} onLogout={handleLogout} isSuperAdmin={isSuperAdmin} />
          <main className="mnu-admin-main">{children}</main>
          <OrderNotificationMonitor restaurantId={restaurantId} userId={user.id} onPendingCount={setPendingOrderCount} />
        </div>
      </div>
    </RestaurantContext.Provider>
  );
}

function AdminLoading() {
  return <div className="mnu-admin mnu-admin-state"><div className="mnu-admin-loading-mark"><span /></div><p>Loading restaurant workspace…</p></div>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'M';
}

function Sidebar({ restaurantId, pathname, open, onClose, isSuperAdmin, pendingOrderCount, restaurantName }: {
  restaurantId: string; pathname: string; open: boolean; onClose: () => void; isSuperAdmin: boolean; pendingOrderCount: number; restaurantName: string;
}) {
  return (
    <>
      {open && <div className="mnu-admin-drawer-backdrop" aria-hidden onClick={onClose} />}
      <aside className={`mnu-admin-sidebar ${open ? 'is-open' : ''}`}>
        <div className="mnu-admin-brand">
          <div className="mnu-admin-brand-mark"><IconFork /></div>
          <div className="min-w-0">
            <p className="mnu-admin-brand-name">MnU</p>
            <p className="mnu-admin-brand-sub">Restaurant OS</p>
          </div>
        </div>

        <div className="mnu-admin-restaurant-context">
          <span className="mnu-admin-context-label">Workspace</span>
          <span className="mnu-admin-context-name" title={restaurantName}>{restaurantName}</span>
        </div>

        <p className="mnu-admin-nav-label">Manage</p>
        <nav className="mnu-admin-nav" aria-label="Restaurant navigation">
          {NAV_ITEMS.map((item) => {
            const href = `/restaurants/${restaurantId}/${item.href}`;
            const isActive = pathname.startsWith(href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={href} className={`mnu-admin-nav-item ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>
                <Icon active={isActive} />
                <span>{item.label}</span>
                {item.href === 'orders' && pendingOrderCount > 0 && <span className="mnu-admin-count" aria-label={`${pendingOrderCount} pending orders`}>{pendingOrderCount > 99 ? '99+' : pendingOrderCount}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mnu-admin-sidebar-footer">
          <Link href={isSuperAdmin ? '/super-admin/restaurants' : '/dashboard'} className="mnu-admin-backlink">
            <IconArrowLeft /> {isSuperAdmin ? 'Super Admin' : 'All restaurants'}
          </Link>
        </div>
      </aside>
    </>
  );
}

function Header({ user, membership, memberships, restaurantId, onLogout, isSuperAdmin }: {
  user: AuthUser; membership: Membership; memberships: Membership[]; restaurantId: string; onLogout: () => void; isSuperAdmin: boolean;
}) {
  const router = useRouter();
  return (
    <header className="mnu-admin-header">
      <div className="min-w-0">
        {isSuperAdmin && <p className="mnu-admin-header-eyebrow">Super Admin · Managing restaurant</p>}
        <div className="mnu-admin-header-row">
          <h1>{membership.restaurant_name}</h1>
          <span className="mnu-admin-role">{membership.role.replaceAll('_', ' ')}</span>
        </div>
        {memberships.length > 1 && (
          <select value={restaurantId} onChange={(e) => router.push(`/restaurants/${e.target.value}/dashboard`)} className="mnu-admin-switcher" aria-label="Switch restaurant">
            {memberships.map((m) => <option key={m.restaurant_id} value={m.restaurant_id}>{m.restaurant_name}</option>)}
          </select>
        )}
      </div>
      <div className="mnu-admin-user-area">
        <div className="mnu-admin-user-avatar">{initials(user.name)}</div>
        <div className="hidden lg:block">
          <p className="mnu-admin-user-name">{user.name}</p>
          <p className="mnu-admin-user-email">{user.email}</p>
        </div>
        <button onClick={onLogout} className="mnu-admin-logout"><IconLogout /> <span className="hidden sm:inline">Logout</span></button>
      </div>
    </header>
  );
}

function iconProps(active?: boolean) { return { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: active ? 2.15 : 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'shrink-0' }; }
function IconDashboard({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h7v7h-7z"/></svg>; }
function IconReceipt({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8v-17Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>; }
function IconMenu({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><path d="M4 6h16M4 12h10M4 18h16"/><path d="M17 10v8M14 15h6"/></svg>; }
function IconTable({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><path d="M3 5h18v5H3zM6 10v9M18 10v9M3 19h18"/></svg>; }
function IconCustomers({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M17 11a2.5 2.5 0 1 0 0-5M16 14c2.5.4 4.5 2.2 4.5 5"/></svg>; }
function IconChart({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6M20 16V3"/></svg>; }
function IconSettings({ active }: { active?: boolean }) { return <svg {...iconProps(active)}><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1 1.8 1.4-2 3.4-2.2-.8a8.2 8.2 0 0 1-1.7 1L15 22h-4l-.4-2.3a8.2 8.2 0 0 1-1.7-1l-2.2.8-2-3.4L6.5 15a8.1 8.1 0 0 1 0-2l-1.8-1.4 2-3.4 2.2.8a8.2 8.2 0 0 1 1.7-1L11 6h4l.4 2.3a8.2 8.2 0 0 1 1.7 1l2.2-.8 2 3.4L19.5 13a8.1 8.1 0 0 1-.1 2Z"/></svg>; }
function IconFork() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 3v7M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c2 2 3 5 0 8"/></svg>; }
function IconArrowLeft() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>; }
function IconLogout() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/></svg>; }
function IconMenuToggle() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>; }
