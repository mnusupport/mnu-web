import { AlertIcon, PlateIcon } from '../../_components/icons';

// Day 22 (Part 2) — the loading state mirrors the real Home layout
// block-for-block (logo + name, chips, search bar, group banner, hero,
// two rails, category rail, full-menu button) so nothing jumps when the
// real content arrives.
//
// HONEST CONSTRAINT: this cannot use the restaurant's own brand colours.
// Branding arrives in the same `getPublicMenu()` response we're waiting
// on, so at first paint there is nothing restaurant-specific to theme
// with — using a colour here would mean either a second blocking request
// or guessing. It therefore uses the MnU default palette (the documented
// fallback for "no branding available"), and the branded header takes
// over the moment data lands.
export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#171514]" aria-busy="true">
      <div className="mx-auto flex min-h-[clamp(290px,38svh,370px)] max-w-5xl flex-col px-6 pb-14 pt-[calc(env(safe-area-inset-top,0px)+18px)]">
        <div className="flex items-center justify-between">
          <div className="mnu-shimmer h-11 w-11 rounded-[15px]" />
          <div className="mnu-shimmer h-11 w-11 rounded-full" />
        </div>
        <div className="mt-auto pt-10">
          <div className="mnu-shimmer h-2.5 w-24 rounded" />
          <div className="mnu-shimmer mt-4 h-12 w-3/4 max-w-[300px] rounded" />
          <div className="mnu-shimmer mt-4 h-3 w-56 rounded" />
        </div>
      </div>
      <div className="mnu-sheet mx-auto -mt-8 max-w-5xl space-y-10 bg-[#f7f2e9] px-5 pb-32 pt-7">
        <div className="mnu-shimmer-light h-[58px] rounded-full" />
        <div className="mnu-shimmer-light h-[420px] rounded-[36px]" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="mnu-shimmer-light h-[176px] w-[128px] shrink-0 rounded-[30px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-hairline bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-500/10 text-danger-500">
          <AlertIcon />
        </div>
        <p className="text-sm font-semibold text-carbon-900">Couldn&apos;t load this restaurant</p>
        <p className="mt-1 text-sm text-carbon-400">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-terracotta-500 px-5 py-2 text-sm font-semibold text-white active:scale-95"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

export function HomeEmptyState() {
  return (
    <div className="mx-4 mt-6 rounded-card border border-dashed border-hairline bg-surface p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-canvas-deep text-carbon-400">
        <PlateIcon />
      </div>
      <p className="text-sm font-semibold text-carbon-900">Nothing on the menu yet</p>
      <p className="mt-1 text-sm text-carbon-400">Check back shortly — this restaurant hasn&apos;t added any items.</p>
    </div>
  );
}
