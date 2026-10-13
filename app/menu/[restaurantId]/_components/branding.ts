import type { PublicMenu } from '@/lib/api';

const DEFAULT_PRIMARY = '#B08A55';
const DEFAULT_ACCENT = '#6B7350';
const DEFAULT_BG = '#171514';
const DEFAULT_SURFACE = '#F7F2E9';
const DEFAULT_TEXT = '#171514';
const DEFAULT_MUTED = '#746C63';
const DEFAULT_BUTTON = '#9A7440';
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function safeColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return HEX_COLOR.test(trimmed) ? trimmed : fallback;
}

export interface ResolvedBranding {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundType: 'gradient' | 'solid' | 'image' | 'mesh';
  backgroundColor: string;
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  gradientAngle: number;
  backgroundImageUrl: string | null;
  overlayColor: string;
  overlayOpacity: number;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonColor: string;
  cardStyle: 'glass' | 'solid' | 'soft';
  heroEyebrow: string;
  heroTagline: string;
  hasCustomColor: boolean;
}

// Stage colours are ALWAYS kept deep. A saved bright gradient (salmon,
// orange, lime…) makes white type and food photography look cheap, so any
// stage colour brighter than a dark threshold is blended toward espresso
// until it is dark. Hue is preserved (a restaurant's identity still tints
// the stage) — only the lightness is capped.
function luminance(hex: string): number {
  const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function mixHex(a: string, b: string, t: number): string {
  const expand = (h: string) => (h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h);
  const pa = expand(a), pb = expand(b);
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(pa, i) * (1 - t) + ch(pb, i) * t).toString(16).padStart(2, '0'));
  return `#${out.join('')}`;
}
function deepen(hex: string, maxLum = 0.05): string {
  let out = hex;
  for (let t = 0.15; t <= 0.95 && luminance(out) > maxLum; t += 0.1) out = mixHex(hex, '#0e0b09', t);
  return out;
}

function clampOpacity(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

export function resolveBranding(branding: PublicMenu['branding'] | undefined): ResolvedBranding {
  const primary = safeColor(branding?.primaryColor, DEFAULT_PRIMARY);
  return {
    logoUrl: branding?.logoUrl ?? null,
    primaryColor: primary,
    accentColor: safeColor(branding?.accentColor, DEFAULT_ACCENT),
    backgroundType: branding?.backgroundType === 'solid' || branding?.backgroundType === 'image' || branding?.backgroundType === 'mesh' ? branding.backgroundType : 'gradient',
    backgroundColor: deepen(safeColor(branding?.backgroundColor, DEFAULT_BG)),
    gradientStart: deepen(safeColor(branding?.gradientStart, '#1b1613')),
    gradientMiddle: deepen(safeColor(branding?.gradientMiddle, '#241d18')),
    gradientEnd: deepen(safeColor(branding?.gradientEnd, '#0d0b0a')),
    gradientAngle: typeof branding?.gradientAngle === 'number' ? Math.max(0, Math.min(360, branding.gradientAngle)) : 145,
    backgroundImageUrl: branding?.backgroundImageUrl ?? null,
    overlayColor: safeColor(branding?.overlayColor, '#000000'),
    overlayOpacity: clampOpacity(branding?.overlayOpacity, 0.18),
    surfaceColor: safeColor(branding?.surfaceColor, DEFAULT_SURFACE),
    textColor: safeColor(branding?.textColor, DEFAULT_TEXT),
    mutedTextColor: safeColor(branding?.mutedTextColor, DEFAULT_MUTED),
    buttonColor: safeColor(branding?.buttonColor, DEFAULT_BUTTON),
    cardStyle: branding?.cardStyle === 'solid' || branding?.cardStyle === 'soft' ? branding.cardStyle : 'glass',
    heroEyebrow: branding?.heroEyebrow?.trim() || 'A TABLE WORTH REMEMBERING',
    heroTagline: branding?.heroTagline?.trim() || 'Take your time. Discover something delicious.',
    hasCustomColor: primary !== DEFAULT_PRIMARY,
  };
}


export function getBrandBackground(branding: ResolvedBranding): string {
  if (branding.backgroundType === 'solid') return branding.backgroundColor;
  if (branding.backgroundType === 'image' && branding.backgroundImageUrl) {
    return `linear-gradient(color-mix(in srgb, ${branding.overlayColor} ${Math.round(branding.overlayOpacity * 100)}%, transparent), color-mix(in srgb, ${branding.overlayColor} ${Math.round(branding.overlayOpacity * 100)}%, transparent)), url(${branding.backgroundImageUrl}) center / cover`;
  }
  if (branding.backgroundType === 'mesh') {
    return `radial-gradient(circle at 18% 20%, ${branding.gradientStart} 0%, transparent 42%), radial-gradient(circle at 84% 14%, ${branding.gradientMiddle} 0%, transparent 38%), radial-gradient(circle at 55% 90%, ${branding.gradientEnd} 0%, ${branding.backgroundColor} 62%)`;
  }
  return `linear-gradient(${branding.gradientAngle}deg, ${branding.gradientStart} 0%, ${branding.gradientMiddle} 48%, ${branding.gradientEnd} 100%)`;
}

export function getBrandCssVars(branding: ResolvedBranding): Record<string, string> {
  return {
    '--color-canvas': 'transparent',
    '--color-canvas-deep': `color-mix(in srgb, ${branding.surfaceColor} 78%, ${branding.backgroundColor})`,
    '--color-surface': branding.surfaceColor,
    '--color-surface-muted': `color-mix(in srgb, ${branding.surfaceColor} 88%, ${branding.backgroundColor})`,
    '--color-carbon-900': branding.textColor,
    '--color-carbon-700': `color-mix(in srgb, ${branding.textColor} 82%, ${branding.mutedTextColor})`,
    '--color-carbon-400': branding.mutedTextColor,
    '--color-hairline': `color-mix(in srgb, ${branding.textColor} 12%, transparent)`,
    '--color-terracotta-500': branding.buttonColor,
    '--color-terracotta-600': branding.buttonColor,
    '--mnu-hero-text': '#FFFFFF',
    '--mnu-hero-muted': 'rgba(255,255,255,.68)',
    '--mnu-surface-text': branding.textColor,
    '--mnu-surface-muted': branding.mutedTextColor,
  };
}
