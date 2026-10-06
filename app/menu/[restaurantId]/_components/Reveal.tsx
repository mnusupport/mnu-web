'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger in ms. */
  delay?: number;
}

// Scroll-based reveal: content fades/rises once when it first enters the
// viewport. One IntersectionObserver per element, disconnected after the
// first hit so nothing keeps running while the customer scrolls.
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`mnu-reveal ${className}`} style={{ '--mnu-d': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
