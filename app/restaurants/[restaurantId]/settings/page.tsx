'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { restaurantApi, type RestaurantBranding } from '@/lib/api';
import { useRestaurantContext } from '../restaurant-context';

const MANAGER_ROLES = new Set(['SUPER_ADMIN', 'RESTAURANT_ADMIN']);
const FALLBACKS = {
  primaryColor: '#E07A5F', accentColor: '#556B2F', backgroundColor: '#171514',
  gradientStart: '#D9785D', gradientMiddle: '#3A2924', gradientEnd: '#0F0F10',
  overlayColor: '#000000', surfaceColor: '#F7F2E9', textColor: '#171514',
  mutedTextColor: '#746C63', buttonColor: '#E07A5F',
};

export default function RestaurantSettingsPage() {
  const { user, membership } = useRestaurantContext();
  const canManage = MANAGER_ROLES.has(membership.role);
  const [branding, setBranding] = useState<RestaurantBranding | null>(null);
  const [form, setForm] = useState<Record<string, string | number | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restaurantApi.getBranding(membership.restaurant_id)
      .then((data) => {
        setBranding(data);
        setForm({ ...data });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load restaurant branding.'))
      .finally(() => setLoading(false));
  }, [membership.restaurant_id]);

  const set = (key: string, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }));
  const color = (key: string, fallback: string) => String(form[key] || fallback);
  const applyPreset = (preset: 'noir' | 'terracotta' | 'olive' | 'cream' | 'espresso') => {
    const presets = {
      noir: { backgroundType:'gradient', backgroundColor:'#101010', gradientStart:'#3B302A', gradientMiddle:'#171412', gradientEnd:'#070707', gradientAngle:145, surfaceColor:'#F7F2E9', textColor:'#171514', mutedTextColor:'#746C63', primaryColor:'#D96F51', accentColor:'#B6A77D', buttonColor:'#171514', overlayColor:'#000000', overlayOpacity:.18, cardStyle:'glass' },
      terracotta: { backgroundType:'gradient', backgroundColor:'#251512', gradientStart:'#C9684F', gradientMiddle:'#60382F', gradientEnd:'#171312', gradientAngle:135, surfaceColor:'#FBF5EC', textColor:'#171514', mutedTextColor:'#776E64', primaryColor:'#D96F51', accentColor:'#8C5545', buttonColor:'#171514', overlayColor:'#000000', overlayOpacity:.14, cardStyle:'glass' },
      olive: { backgroundType:'mesh', backgroundColor:'#182019', gradientStart:'#7E8660', gradientMiddle:'#334438', gradientEnd:'#111713', gradientAngle:150, surfaceColor:'#F6F2E8', textColor:'#171514', mutedTextColor:'#6D7469', primaryColor:'#9A6A4A', accentColor:'#78805C', buttonColor:'#171514', overlayColor:'#000000', overlayOpacity:.12, cardStyle:'glass' },
      cream: { backgroundType:'gradient', backgroundColor:'#D8D0C2', gradientStart:'#E9E2D6', gradientMiddle:'#BFB5A8', gradientEnd:'#756B63', gradientAngle:145, surfaceColor:'#FFFDF8', textColor:'#171514', mutedTextColor:'#7D756D', primaryColor:'#C86B52', accentColor:'#7A6D61', buttonColor:'#171514', overlayColor:'#000000', overlayOpacity:.08, cardStyle:'soft' },
      espresso: { backgroundType:'gradient', backgroundColor:'#17110E', gradientStart:'#5A392A', gradientMiddle:'#291A15', gradientEnd:'#090807', gradientAngle:160, surfaceColor:'#F5EFE4', textColor:'#171514', mutedTextColor:'#756B61', primaryColor:'#B96A4F', accentColor:'#B79B7A', buttonColor:'#171514', overlayColor:'#000000', overlayOpacity:.2, cardStyle:'solid' },
    } as const;
    setForm(current => ({ ...current, ...presets[preset] }));
  };

  const backgroundType = String(form.backgroundType || 'gradient');
  const angle = Number(form.gradientAngle ?? 145);
  const opacity = Number(form.overlayOpacity ?? 0.18);
  const previewBackground = useMemo(() => {
    if (backgroundType === 'solid') return color('backgroundColor', FALLBACKS.backgroundColor);
    if (backgroundType === 'image' && form.backgroundImageUrl) {
      const overlay = color('overlayColor', FALLBACKS.overlayColor);
      return `linear-gradient(color-mix(in srgb, ${overlay} ${Math.round(opacity * 100)}%, transparent), color-mix(in srgb, ${overlay} ${Math.round(opacity * 100)}%, transparent)), url(${String(form.backgroundImageUrl)}) center / cover`;
    }
    if (backgroundType === 'mesh') {
      return `radial-gradient(circle at 15% 20%, ${color('gradientStart', FALLBACKS.gradientStart)} 0%, transparent 40%), radial-gradient(circle at 88% 15%, ${color('gradientMiddle', FALLBACKS.gradientMiddle)} 0%, transparent 38%), radial-gradient(circle at 55% 95%, ${color('gradientEnd', FALLBACKS.gradientEnd)} 0%, ${color('backgroundColor', FALLBACKS.backgroundColor)} 65%)`;
    }
    return `linear-gradient(${angle}deg, ${color('gradientStart', FALLBACKS.gradientStart)} 0%, ${color('gradientMiddle', FALLBACKS.gradientMiddle)} 48%, ${color('gradientEnd', FALLBACKS.gradientEnd)} 100%)`;
  }, [backgroundType, form, angle, opacity]);

  const save = async () => {
    setSaving(true); setMessage(null); setError(null);
    try {
      const payload = {
        logoUrl: String(form.logoUrl || '').trim() || null,
        primaryColor: String(form.primaryColor || '').trim() || null,
        accentColor: String(form.accentColor || '').trim() || null,
        backgroundType: backgroundType as RestaurantBranding['backgroundType'],
        backgroundColor: color('backgroundColor', FALLBACKS.backgroundColor),
        gradientStart: color('gradientStart', FALLBACKS.gradientStart),
        gradientMiddle: color('gradientMiddle', FALLBACKS.gradientMiddle),
        gradientEnd: color('gradientEnd', FALLBACKS.gradientEnd),
        gradientAngle: angle,
        backgroundImageUrl: String(form.backgroundImageUrl || '').trim() || null,
        overlayColor: color('overlayColor', FALLBACKS.overlayColor),
        overlayOpacity: opacity,
        surfaceColor: color('surfaceColor', FALLBACKS.surfaceColor),
        textColor: color('textColor', FALLBACKS.textColor),
        mutedTextColor: color('mutedTextColor', FALLBACKS.mutedTextColor),
        buttonColor: color('buttonColor', FALLBACKS.buttonColor),
        cardStyle: String(form.cardStyle || 'glass') as RestaurantBranding['cardStyle'],
        heroEyebrow: String(form.heroEyebrow || '').trim() || null,
        heroTagline: String(form.heroTagline || '').trim() || null,
      };
      const data = await restaurantApi.updateBranding(membership.restaurant_id, payload);
      setBranding(data); setForm({ ...data });
      setMessage('Customer visual theme saved successfully.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save branding.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Customer experience</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">Visual identity</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-400">Control the restaurant&apos;s complete customer-facing visual language — not just two colours.</p>
        </div>
        <button type="button" onClick={save} disabled={!canManage || loading || saving} className="rounded-2xl bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition active:scale-[.99] disabled:opacity-40">{saving ? 'Saving…' : 'Save theme'}</button>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Panel title="Restaurant identity" hint="This content appears in the premium customer hero.">
            <TextField label="Logo URL" value={String(form.logoUrl || '')} onChange={(v) => set('logoUrl', v)} placeholder="https://…" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Hero eyebrow" value={String(form.heroEyebrow || '')} onChange={(v) => set('heroEyebrow', v)} placeholder="A TABLE WORTH REMEMBERING" maxLength={48} />
              <TextField label="Hero tagline" value={String(form.heroTagline || '')} onChange={(v) => set('heroTagline', v)} placeholder="Take your time. Discover something delicious." maxLength={120} />
            </div>
          </Panel>

          <Panel title="Atmosphere presets" hint="Start from a professionally balanced restaurant mood, then fine-tune every value below.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {([['noir','Noir'],['terracotta','Terracotta'],['olive','Olive'],['cream','Cream'],['espresso','Espresso']] as const).map(([key,label]) => (
                <button key={key} type="button" disabled={!canManage} onClick={() => applyPreset(key)} className="rounded-2xl border border-ink-100 bg-ink-50 px-3 py-3 text-xs font-bold text-ink-800 transition hover:border-ink-300 active:scale-[.98] disabled:opacity-40">{label}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Background studio" hint="Choose how the entire customer experience is staged behind the content.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Background mode" value={backgroundType} onChange={(v) => set('backgroundType', v)} options={[['gradient','Multi-stop gradient'],['mesh','Ambient mesh'],['solid','Solid colour'],['image','Restaurant image']]} />
              <SelectField label="Card treatment" value={String(form.cardStyle || 'glass')} onChange={(v) => set('cardStyle', v)} options={[['glass','Glass / frosted'],['soft','Soft elevated'],['solid','Clean solid']]} />
            </div>

            {backgroundType === 'image' && <TextField label="Background image URL" value={String(form.backgroundImageUrl || '')} onChange={(v) => set('backgroundImageUrl', v)} placeholder="https://…" />}

            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField label="Gradient / base 1" value={color('gradientStart', FALLBACKS.gradientStart)} onChange={(v) => set('gradientStart', v)} />
              <ColorField label="Gradient / base 2" value={color('gradientMiddle', FALLBACKS.gradientMiddle)} onChange={(v) => set('gradientMiddle', v)} />
              <ColorField label="Gradient / base 3" value={color('gradientEnd', FALLBACKS.gradientEnd)} onChange={(v) => set('gradientEnd', v)} />
            </div>

            {backgroundType === 'gradient' && <RangeField label="Gradient angle" value={angle} min={0} max={360} step={1} suffix="°" onChange={(v) => set('gradientAngle', v)} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Solid background" value={color('backgroundColor', FALLBACKS.backgroundColor)} onChange={(v) => set('backgroundColor', v)} />
              <ColorField label="Overlay" value={color('overlayColor', FALLBACKS.overlayColor)} onChange={(v) => set('overlayColor', v)} />
            </div>
            {backgroundType === 'image' && <RangeField label="Image overlay strength" value={opacity} min={0} max={0.8} step={0.01} suffix="" onChange={(v) => set('overlayOpacity', v)} />}
          </Panel>

          <Panel title="Surface & interaction palette" hint="Tune the menu cards, typography and primary action independently from the hero background.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Surface / cards" value={color('surfaceColor', FALLBACKS.surfaceColor)} onChange={(v) => set('surfaceColor', v)} />
              <ColorField label="Primary text" value={color('textColor', FALLBACKS.textColor)} onChange={(v) => set('textColor', v)} />
              <ColorField label="Muted text" value={color('mutedTextColor', FALLBACKS.mutedTextColor)} onChange={(v) => set('mutedTextColor', v)} />
              <ColorField label="Button / action" value={color('buttonColor', FALLBACKS.buttonColor)} onChange={(v) => set('buttonColor', v)} />
              <ColorField label="Brand primary" value={color('primaryColor', FALLBACKS.primaryColor)} onChange={(v) => set('primaryColor', v)} />
              <ColorField label="Brand accent" value={color('accentColor', FALLBACKS.accentColor)} onChange={(v) => set('accentColor', v)} />
            </div>
          </Panel>

          {!canManage && <p className="rounded-2xl bg-cream-100 px-4 py-3 text-xs font-medium text-ink-400">Only restaurant admins can change the customer visual identity.</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {message && <p className="text-sm font-medium text-green-700">{message}</p>}
        </div>

        <aside className="xl:sticky xl:top-5 xl:self-start">
          <div className="overflow-hidden rounded-[36px] border border-ink-100 bg-ink-900 p-3 shadow-2xl">
            <div className="relative min-h-[650px] overflow-hidden rounded-[30px] text-white" style={{ background: previewBackground }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")" }} />
              <div className="relative flex min-h-[650px] flex-col p-5">
                <div className="flex items-center justify-between"><span className="rounded-full border border-white/15 bg-black/15 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.2em]">{String(form.heroEyebrow || 'A TABLE WORTH REMEMBERING')}</span><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/15 text-xs">Bag</span></div>
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 p-2 backdrop-blur-xl">{form.logoUrl ? <img src={String(form.logoUrl)} alt="Logo preview" className="h-full w-full rounded-[20px] object-contain" /> : <span className="font-serif text-5xl">{membership.restaurant_name.charAt(0).toUpperCase()}</span>}</div>
                  <p className="mt-6 text-[9px] uppercase tracking-[.28em] text-white/50">{user.name ? `Good evening, ${user.name}` : 'Welcome'}</p>
                  <h3 className="mt-3 max-w-[310px] font-serif text-5xl leading-[.92]">{membership.restaurant_name}</h3>
                  <p className="mt-5 max-w-[270px] text-sm leading-relaxed text-white/70">{String(form.heroTagline || 'Take your time. Discover something delicious.')}</p>
                  <span className="mt-6 text-[9px] font-semibold uppercase tracking-[.18em] text-white/45">Scroll to explore</span>
                </div>
                <div className="rounded-[24px] border border-white/15 bg-black/20 p-2 backdrop-blur-xl"><div className="rounded-[18px] bg-white px-4 py-4 text-xs font-semibold text-black">⌕ &nbsp; Search dishes & categories</div></div>
              </div>
            </div>
          </div>
          <p className="mt-3 px-2 text-xs leading-relaxed text-ink-400">Live preview. Changes are local until you press Save theme.</p>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm"><h3 className="text-sm font-bold text-ink-900">{title}</h3><p className="mt-1 text-xs text-ink-400">{hint}</p><div className="mt-5 space-y-4">{children}</div></section>;
}
function TextField({ label, value, onChange, placeholder, maxLength }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; maxLength?:number }) { return <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span><input value={value} maxLength={maxLength} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-brand-500" /></label>; }
function SelectField({ label, value, onChange, options }: { label:string; value:string; onChange:(v:string)=>void; options:string[][] }) { return <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none focus:border-brand-500">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>; }
function ColorField({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) { const valid=/^#[0-9a-f]{6}$/i.test(value); return <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span><div className="mt-2 flex gap-2"><input type="color" value={valid?value:'#E07A5F'} onChange={(e)=>onChange(e.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded-xl border border-ink-200 bg-white p-1"/><input value={value} onChange={(e)=>onChange(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-ink-200 px-4 py-3 text-sm uppercase text-ink-900 outline-none focus:border-brand-500" /></div></label>; }
function RangeField({ label, value, min, max, step, suffix, onChange }: { label:string; value:number; min:number; max:number; step:number; suffix:string; onChange:(v:number)=>void }) { return <label className="block"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span><span className="text-xs font-bold text-ink-700">{value}{suffix}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))} className="mt-3 w-full accent-brand-500" /></label>; }
