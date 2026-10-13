'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { menuApi, type PublicMenu } from '@/lib/api';
import { getBrandBackground, getBrandCssVars, resolveBranding } from './branding';

export function CustomerTheme({ restaurantId, children, className = '' }: { restaurantId: string; children: ReactNode; className?: string }) {
  const [menu, setMenu] = useState<PublicMenu | null>(() => menuApi.peekPublicMenu(restaurantId));
  useEffect(() => { menuApi.getPublicMenu(restaurantId).then(setMenu).catch(() => setMenu(null)); }, [restaurantId]);
  const branding = resolveBranding(menu?.branding);
  return (
    <div className={`mnu-customer min-h-screen ${className}`} data-card-style={branding.cardStyle} style={{ background: getBrandBackground(branding), ...getBrandCssVars(branding) }}>
      {children}
    </div>
  );
}
