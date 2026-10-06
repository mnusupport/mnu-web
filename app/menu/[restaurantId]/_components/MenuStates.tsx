'use client';

import { AlertIcon, PlateIcon, SearchIcon } from './icons';

export function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-[#171514]" aria-busy="true">
      <div className="mx-auto max-w-5xl px-5 pb-8 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <div className="flex items-center gap-3">
          <div className="mnu-shimmer h-11 w-11 rounded-full" />
          <div className="mnu-shimmer h-2.5 w-28 flex-1 rounded" />
          <div className="mnu-shimmer h-11 w-11 rounded-full" />
        </div>
        <div className="mnu-shimmer mt-8 h-12 w-56 rounded" />
      </div>
      <div className="mnu-sheet mx-auto max-w-5xl bg-[#f7f2e9] px-5 pb-32 pt-9">
        <div className="mnu-shimmer-light h-8 w-40 rounded" />
        <div className="mnu-shimmer-light mt-6 aspect-[4/4.3] rounded-[32px]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 py-5">
            <div className="flex-1 space-y-2.5">
              <div className="mnu-shimmer-light h-4 w-3/4 rounded" />
              <div className="mnu-shimmer-light h-3 w-full rounded" />
              <div className="mnu-shimmer-light h-4 w-16 rounded" />
            </div>
            <div className="mnu-shimmer-light h-[104px] w-[104px] rounded-[28px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-hairline bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-500/10 text-danger-500">
          <AlertIcon />
        </div>
        <p className="text-sm font-semibold text-carbon-900">Couldn&apos;t load this menu</p>
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

export function EmptyMenuState() {
  return (
    <div className="rounded-card border border-dashed border-hairline bg-surface p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-canvas-deep text-carbon-400">
        <PlateIcon />
      </div>
      <p className="text-sm font-semibold text-carbon-900">Nothing on the menu yet</p>
      <p className="mt-1 text-sm text-carbon-400">Check back shortly — this restaurant hasn&apos;t added any items.</p>
    </div>
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="rounded-card border border-dashed border-hairline bg-surface p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-canvas-deep text-carbon-400">
        <SearchIcon />
      </div>
      <p className="text-sm font-semibold text-carbon-900">No matches for &quot;{query}&quot;</p>
      <p className="mt-1 text-sm text-carbon-400">Try a different dish, drink, or category name.</p>
    </div>
  );
}
