// "Mr.wiserr" as live text in the brand's script face (Pacifico, loaded in
// app/layout.tsx as --font-brand). Used where the PNG logo would be too heavy
// or the background is dark: the tone switches the main letters between navy
// (light backgrounds) and white (dark backgrounds). The dot stays teal, like
// the logo. Size it with className (e.g. "text-2xl") or the parent font-size.
export function BrandWordmark({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) {
  return (
    <span className={`mw-wordmark ${tone === 'dark' ? 'mw-wordmark-dark' : ''} ${className}`} aria-label="Mr.wiserr">
      <span aria-hidden>
        Mr<span className="mw-dot">.</span>wiserr
      </span>
    </span>
  );
}
