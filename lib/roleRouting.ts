import type { AuthUser, Membership } from './api';

// The one place that turns an authenticated identity into a landing page.
// Used by /login and by the legacy /dashboard redirector so the two can never
// disagree.
//
// This is navigation only, never authorization: the role comes from the
// backend (POST /auth/login and GET /auth/me responses), and every protected
// API re-checks it server-side on each request. Tampering with anything the
// browser holds cannot grant access to data.
export type LandingResult =
  | { kind: 'redirect'; href: string }
  | { kind: 'no-restaurant' };

export function resolveLanding(platformRole: AuthUser['platformRole'], memberships: Membership[]): LandingResult {
  if (platformRole === 'SUPER_ADMIN') {
    return { kind: 'redirect', href: '/super-admin/dashboard' };
  }
  if (memberships.length === 0) return { kind: 'no-restaurant' };
  return { kind: 'redirect', href: `/restaurants/${memberships[0].restaurant_id}/dashboard` };
}
