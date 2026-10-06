// Day 28 — "add to cart" feedback. A small brand-coloured dot leaves the
// tapped button, arcs to the cart target in the bottom navigation and
// makes it pulse. Pure Web Animations API (no library), removed from the
// DOM on finish, skipped entirely for reduced-motion users or when no
// cart target is on screen (e.g. the item page before its own cart chip
// is visible). Never throws — it is decoration, not behaviour.
export function flyToCart(from: Element | null | undefined) {
  try {
    if (typeof document === 'undefined' || !from) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]')).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const target = targets[targets.length - 1];
    if (!target) return;

    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const startX = a.left + a.width / 2;
    const startY = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - startX;
    const dy = b.top + b.height / 2 - startY;
    const color = getComputedStyle(from).getPropertyValue('--mnu-accent').trim() || '#E07A5F';

    const dot = document.createElement('span');
    Object.assign(dot.style, {
      position: 'fixed',
      left: `${startX - 9}px`,
      top: `${startY - 9}px`,
      width: '18px',
      height: '18px',
      borderRadius: '999px',
      background: color,
      boxShadow: '0 6px 18px rgba(0,0,0,.35)',
      pointerEvents: 'none',
      zIndex: '90',
    } as CSSStyleDeclaration);
    document.body.appendChild(dot);

    const anim = dot.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(.85)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0.5 },
      ],
      { duration: 620, easing: 'cubic-bezier(.5,0,.2,1)' },
    );
    anim.onfinish = () => {
      dot.remove();
      target.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.28)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' },
      );
    };
    anim.oncancel = () => dot.remove();
  } catch {
    /* decorative only */
  }
}
