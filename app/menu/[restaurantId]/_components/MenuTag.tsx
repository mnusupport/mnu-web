'use client';

interface MenuTagProps {
  label: string;
}

const TAG_STYLES: Record<string, { icon: string; background: string; foreground: string; border: string }> = {
  popular: { icon: '↗', background: '#F7E0D8', foreground: '#A94F39', border: '#EBC2B7' },
  'most ordered': { icon: '★', background: '#24211D', foreground: '#FFFDF7', border: '#24211D' },
  recommended: { icon: '✦', background: '#E7ECD9', foreground: '#445626', border: '#C8D1AF' },
  new: { icon: 'NEW', background: '#F9F5EB', foreground: '#556B2F', border: '#D9DEC8' },
  signature: { icon: '✦', background: '#FFF8F4', foreground: '#A94F39', border: '#EBC2B7' },
};

export function MenuTag({ label }: MenuTagProps) {
  const key = label.trim().toLowerCase();
  const style = TAG_STYLES[key] ?? { icon: '•', background: '#F9F5EB', foreground: '#24211D', border: '#DDD6C9' };
  const wordIcon = style.icon === 'NEW';

  return (
    <span
      className="mnu-tag inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.13em]"
      style={{ background: style.background, color: style.foreground, borderColor: style.border }}
    >
      {!wordIcon && <span aria-hidden="true" className="text-[10px] leading-none">{style.icon}</span>}
      <span className="truncate">{label}</span>
    </span>
  );
}
