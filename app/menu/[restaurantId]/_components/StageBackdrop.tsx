'use client';

/**
 * Day 28 (revision) — the ONE premium stage treatment used behind every
 * dark screen (Home hero, Menu header, Cart/Review/Item stage), replacing
 * the earlier per-dish blurred-photo ambient layer.
 *
 * That approach depended on whatever photo a restaurant happened to
 * upload — a small or stylised image, blurred and scaled up, produced
 * visible blotchy artifacts (see feedback on the Ice Cream Parlour photo).
 * This is fully self-contained (no photography dependency): the branded
 * gradient, a soft directional sheen, a fine static grain, and a faint
 * arch watermark (the same shape as the dish "arch" cards, echoing it as
 * a quiet brand mark). It looks the same, reliably, for every restaurant
 * regardless of what photos they've uploaded.
 */
export function StageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-[18%] -top-[22%] h-[70%] w-[85%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.10),transparent)]" />
      <div className="absolute -bottom-[30%] -left-[15%] h-[65%] w-[75%] rounded-full bg-[radial-gradient(closest-side,rgba(0,0,0,.30),transparent)]" />
      <svg className="absolute bottom-0 right-[-8%] h-[86%] w-[62%] opacity-[0.05]" viewBox="0 0 200 260" fill="none" aria-hidden="true">
        <path d="M4 260V100C4 47.5 47.5 4 100 4s96 43.5 96 96v160" stroke="white" strokeWidth="7" />
      </svg>
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\\\")",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/45" />
    </div>
  );
}
