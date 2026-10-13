'use client';

import { useState } from 'react';
import { resolveImageUrl } from '@/lib/api';
import { foodVisual } from './foodVisual';

interface ItemImageProps {
  imageUrl: string | null;
  seed: string;
  alt: string;
  className: string;
  iconClassName?: string;
  // Day 21 soft-UI treatment. `contain` + drop-shadow is what makes a
  // transparent-background food PNG read as a cut-out floating on the
  // card rather than a photo pasted into a box. Opt-in per call site,
  // NOT the default: applied to a normal opaque photo it would letterbox
  // it and shadow its rectangular edges, which looks worse than plain
  // object-cover. Callers pass this only where the presentation suits it.
  float?: boolean;
  // Day 28 — `dark` gives image-less dishes a deep, brand-tinted fallback
  // so white type laid over the image (lead / arch cards) stays legible.
  dark?: boolean;
}

// One shared component for every place a menu item's image appears
// (menu grid, item detail, Home carousels) — so "real photo if present,
// otherwise the deterministic icon placeholder" is defined once. Falls
// back to the icon not just when `imageUrl` is null, but also if a real
// URL fails to actually load (broken file, deleted upload, etc.) —
// tracked via local state since a plain `onError` handler can't swap in
// different JSX on its own.
export function ItemImage({
  imageUrl,
  seed,
  alt,
  className,
  iconClassName = 'text-3xl',
  float = false,
  dark = false,
}: ItemImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const resolved = resolveImageUrl(imageUrl);
  const { icon, tone } = foodVisual(seed);

  if (resolved && !failed) {
    return (
      // overflow-visible only in float mode, and only here — a blanket
      // overflow-visible would let images escape scroll containers and
      // sticky headers elsewhere.
      <div className={`${float ? 'overflow-visible' : 'overflow-hidden'} ${className}`}>
        {/* Plain <img>, not next/image: this project has no configured
            image loader/remote pattern for the API's own origin, and at
            this stage (single small image per item, local-disk storage)
            next/image's optimization pipeline isn't worth the config
            surface — see docs/PROGRESS.md for this decision. */}
        <img
          ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }}
          src={resolved}
          alt={alt}
          loading="lazy"
          className={`transition-[opacity,transform] duration-700 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${
            float
              ? 'h-full w-full scale-110 object-contain drop-food'
              : 'h-full w-full object-cover'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  if (dark) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: 'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--mnu-accent, #E07A5F) 38%, #1b1613), #15110f 72%)' }}
        aria-hidden="true"
      >
        <span className={`${iconClassName} opacity-80`}>{icon}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${tone} ${className}`} aria-hidden="true">
      <span className={iconClassName}>{icon}</span>
    </div>
  );
}
