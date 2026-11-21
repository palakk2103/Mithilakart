import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Loader2, RotateCcw, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services/api';

const TABS = [
  { key: 'mithilakart', label: 'Mithilakart' },
  { key: 'quick_shop', label: 'Quick Shop' },
  { key: 'mithilak', label: 'Mithilak' },
  { key: 'groceries_fresh', label: 'Fresh & Groceries' },
];

const PAGES = [
  { key: 'cart', label: 'Cart' },
  { key: 'summary', label: 'Order Summary' },
  { key: 'payment', label: 'Payment' },
];

const SECTION_LABELS = {
  cart: { tabSwitcher: 'Other-carts switcher', banner: 'Promo banner carousel', address: 'Delivery address', items: 'Cart items', freeDelivery: 'Free-delivery bar', priceDetails: 'Price details (phones)', rails: 'Product rails' },
  summary: { address: 'Delivery address', freeDelivery: 'Free-delivery bar', items: 'Cart items', coupon: 'Apply coupon', actions: 'Tip & Vouchers cards', bill: 'Order details (bill)', policy: 'Return & cancellation box', trust: 'Trust block', terms: 'Terms line' },
  payment: { coupons: 'Coupons & offers', methods: 'Payment methods', orderSummary: 'Order summary + bill', note: 'Footer note' },
};
// Sections whose heading text can be renamed.
const TITLED = new Set(['items', 'priceDetails', 'coupon', 'bill', 'coupons', 'methods', 'orderSummary']);

const COLOR_FIELDS = [
  ['headerBg', 'Header background', 'Follows the tab colour'],
  ['headerText', 'Header text & icons', 'White'],
  ['pageBg', 'Page background', 'Soft tint of the tab colour'],
  ['cardBg', 'Card background', 'White'],
  ['cardBorder', 'Card border', 'Light grey'],
  ['headingColor', 'Headings', 'Dark blue'],
  ['textColor', 'Body text', 'Slate'],
  ['accent', 'Buttons & highlights', 'Follows the tab colour'],
];
const NUMBER_FIELDS = [
  ['cardRadius', 'Card corner radius', 0, 32],
  ['buttonRadius', 'Button corner radius', 0, 999],
  ['pagePaddingX', 'Page side padding', 0, 32],
  ['sectionGap', 'Gap between sections', 0, 32],
  ['cardPadding', 'Card inner padding', 0, 32],
  ['rowPaddingY', 'Row spacing in lists', 0, 24],
];
const SECTION_NUMBERS = [['padding', 'Padding', 40], ['radius', 'Radius', 40], ['marginTop', 'Margin top', 64], ['marginBottom', 'Margin bottom', 64]];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const clone = (v) => JSON.parse(JSON.stringify(v));

const card = 'rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.12)]';
const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200';

/** Saved value over the server defaults, with every known section present. */
function complete(defaults, saved) {
  const d = clone(defaults);
  const s = saved && typeof saved === 'object' ? saved : {};
  const out = { global: { ...d.global, ...(s.global || {}) }, tabs: clone(s.tabs || {}), pages: {} };
  Object.keys(d.pages).forEach((page) => {
    const known = d.pages[page].sections.map((x) => x.key);
    const have = Array.isArray(s.pages?.[page]?.sections) ? s.pages[page].sections.filter((x) => known.includes(x.key)) : [];
    const missing = known.filter((k) => !have.some((x) => x.key === k)).map((key) => ({ key, enabled: true, style: {} }));
    out.pages[page] = { sections: [...have.map((x) => ({ key: x.key, enabled: x.enabled !== false, style: { ...(x.style || {}) } })), ...missing] };
  });
  return out;
}

/** Colour control: swatch + hex + clear (empty = follow the theme). */
const ColourField = ({ label, hint, value, onChange, inherited }) => {
  const valid = !value || HEX.test(value);
  return (
    <div className="flex items-center gap-3">
      <input type="color" aria-label={label} value={HEX.test(value || '') && value.length === 7 ? value : (inherited && HEX.test(inherited) && inherited.length === 7 ? inherited : '#ffffff')} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-bold text-slate-800">{label}</span>
        <span className="block text-[11px] text-slate-500">{value ? 'Custom' : `Default: ${hint}`}</span>
      </span>
      <input value={value || ''} placeholder="auto" onChange={(e) => onChange(e.target.value.trim())} aria-label={`${label} hex`} className={`w-24 rounded-lg border px-2 py-1.5 font-mono text-xs ${valid ? 'border-slate-200' : 'border-red-400 bg-red-50'}`} />
      <button type="button" aria-label={`Reset ${label}`} disabled={!value} onClick={() => onChange('')} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><X size={14} /></button>
    </div>
  );
};

const NumberField = ({ label, min, max, value, onChange, inherited }) => (
  <label className="block">
    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
    <input type="number" min={min} max={max} value={value ?? ''} placeholder={inherited !== undefined ? String(inherited) : ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} className={`${field} mt-1`} />
  </label>
);

/** Phone mock drawn with the same CSS variables the storefront uses. */
const Preview = ({ tokens, sections, page, labels }) => {
  const px = (n) => `${n}px`;
  const vars = {
    '--cd-gap': px(tokens.sectionGap), '--cd-pad': px(tokens.cardPadding), '--cd-radius': px(tokens.cardRadius), '--cd-btn-radius': px(tokens.buttonRadius),
    '--cd-shadow': tokens.cardShadow ? '0 1px 2px rgb(15 23 42 / 0.06)' : 'none',
    ...(tokens.cardBg ? { '--cd-card-bg': tokens.cardBg } : {}), ...(tokens.cardBorder ? { '--cd-card-border': tokens.cardBorder } : {}),
    ...(tokens.headingColor ? { '--cd-heading': tokens.headingColor } : {}), ...(tokens.textColor ? { '--cd-text': tokens.textColor } : {}),
  };
  const accent = tokens.accent || '#65B842';
  return (
    <div className="mx-auto w-[260px] overflow-hidden rounded-[28px] border-[6px] border-slate-800 bg-white shadow-xl" aria-label="Preview">
      <div className="h-[520px] overflow-y-auto" style={{ ...vars, background: tokens.pageBg || '#F6F8F3', color: tokens.textColor || undefined }}>
        <div className="flex h-10 items-center justify-center text-[12px] font-bold" style={{ background: tokens.headerBg || accent, color: tokens.headerText || '#fff' }}>{PAGES.find((p) => p.key === page)?.label}</div>
        <div className="flex flex-col" style={{ gap: 'var(--cd-gap)', padding: `8px ${px(tokens.pagePaddingX)}` }}>
          {sections.filter((s) => s.enabled).map((s) => (
            <div key={s.key} style={{ marginTop: s.style.marginTop, marginBottom: s.style.marginBottom, '--cd-card-bg': s.style.bg || undefined, '--cd-card-border': s.style.border || undefined, '--cd-radius': s.style.radius != null ? px(s.style.radius) : undefined, '--cd-pad': s.style.padding != null ? px(s.style.padding) : undefined }}>
              <div className="cd-card">
                <p className="cd-heading text-[11px] font-bold">{s.style.title || labels[s.key]}</p>
                <div className="mt-1.5 space-y-1"><div className="h-1.5 w-4/5 rounded bg-slate-200" /><div className="h-1.5 w-3/5 rounded bg-slate-200" /></div>
              </div>
            </div>
          ))}
          <div className="flex h-8 items-center justify-center text-[11px] font-bold text-white cd-btn" style={{ background: accent }}>Proceed →</div>
        </div>
      </div>
    </div>
  );
};

const CartDesign = () => {
  const [defaults, setDefaults] = useState(null);
  const [design, setDesign] = useState(null);
  const [scope, setScope] = useState('all'); // 'all' | tab key
  const [page, setPage] = useState('cart');
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await settingsApi.getAll();
      if (cancelled) return;
      if (err || !data?.defaults?.cartDesign) setError(err || 'Could not load the design settings');
      else {
        setDefaults(data.defaults.cartDesign);
        setDesign(complete(data.defaults.cartDesign, data.settings?.cartDesign));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const layer = scope === 'all' ? design?.global : design?.tabs?.[scope] || {};
  const effective = useMemo(() => (design ? { ...design.global, ...(scope === 'all' ? {} : design.tabs?.[scope] || {}) } : null), [design, scope]);

  const setToken = (key, value) => setDesign((d) => {
    const next = clone(d);
    if (scope === 'all') next.global[key] = value;
    else {
      next.tabs[scope] = next.tabs[scope] || {};
      if (value === '' || value === undefined) delete next.tabs[scope][key]; else next.tabs[scope][key] = value;
      if (!Object.keys(next.tabs[scope]).length) delete next.tabs[scope];
    }
    return next;
  });

  const setSections = (fn) => setDesign((d) => { const next = clone(d); next.pages[page].sections = fn(next.pages[page].sections); return next; });
  const move = (i, dir) => setSections((list) => { const j = i + dir; if (j < 0 || j >= list.length) return list; [list[i], list[j]] = [list[j], list[i]]; return list; });
  const patchSection = (key, patch) => setSections((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const patchStyle = (key, k, v) => setSections((list) => list.map((s) => {
    if (s.key !== key) return s;
    const style = { ...s.style };
    if (v === '' || v === undefined || v === null) delete style[k]; else style[k] = v;
    return { ...s, style };
  }));

  const bad = () => {
    if (!design) return '';
    const colours = [design.global, ...Object.values(design.tabs)].flatMap((t) => COLOR_FIELDS.map(([k]) => t[k]));
    const sectionColours = Object.values(design.pages).flatMap((p) => p.sections.flatMap((s) => [s.style.bg, s.style.border]));
    return [...colours, ...sectionColours].some((c) => c && !HEX.test(c)) ? 'Fix the highlighted colours (use #RRGGBB) before saving.' : '';
  };

  const save = async () => {
    const problem = bad();
    if (problem) { toast.error(problem); return; }
    setSaving(true);
    const payload = clone(design);
    // Numbers typed as '' fall back to the defaults.
    NUMBER_FIELDS.forEach(([k]) => { if (payload.global[k] === '' || payload.global[k] == null) payload.global[k] = defaults.global[k]; });
    const { error: err } = await settingsApi.update({ cartDesign: payload });
    setSaving(false);
    if (err) toast.error(err); else toast.success('Saved — the cart pages update for customers within a minute');
  };

  const reset = () => {
    if (!window.confirm('Reset the design of all cart pages to the standard look?')) return;
    setDesign(complete(defaults, null));
    toast('Reset — press Save to apply');
  };

  if (loading) return <div className="flex items-center gap-2 p-10 text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading…</div>;
  if (error) return <div className="m-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>;

  const sections = design.pages[page].sections;
  const labels = SECTION_LABELS[page];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cart Pages Design</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Colours, spacing, section order and visibility for the Cart, Order Summary and Payment pages. Empty colours follow each tab&apos;s own theme.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><RotateCcw size={14} /> Reset</button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Style tokens */}
          <section className={card}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Style</h2>
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Apply to">
                {[{ key: 'all', label: 'All tabs' }, ...TABS].map((t) => (
                  <button key={t.key} type="button" role="tab" aria-selected={scope === t.key} onClick={() => setScope(t.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${scope === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.label}</button>
                ))}
              </div>
            </div>
            {scope !== 'all' && <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Only the values you set here apply to {TABS.find((t) => t.key === scope)?.label}; everything left empty uses &quot;All tabs&quot;.</p>}
            <div className="grid gap-3 md:grid-cols-2">
              {COLOR_FIELDS.map(([k, label, hint]) => (
                <ColourField key={k} label={label} hint={hint} value={layer?.[k] || ''} inherited={scope !== 'all' ? design.global[k] : ''} onChange={(v) => setToken(k, v)} />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {NUMBER_FIELDS.map(([k, label, min, max]) => (
                <NumberField key={k} label={`${label} (px)`} min={min} max={max} value={layer?.[k]} inherited={scope !== 'all' ? design.global[k] : undefined} onChange={(v) => setToken(k, v)} />
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={effective.cardShadow !== false} onChange={(e) => setToken('cardShadow', e.target.checked)} /> Soft shadow under cards
            </label>
          </section>

          {/* Sections */}
          <section className={card}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Sections</h2>
              <div className="flex gap-1.5" role="tablist" aria-label="Page">
                {PAGES.map((p) => (
                  <button key={p.key} type="button" role="tab" aria-selected={page === p.key} onClick={() => { setPage(p.key); setOpen(null); }} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${page === p.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{p.label}</button>
                ))}
              </div>
            </div>
            <p className="mb-3 text-xs text-slate-500">Order, show/hide and per-section style apply to every tab. Use the arrows to reorder.</p>
            <ul className="space-y-2">
              {sections.map((s, i) => {
                const isOpen = open === s.key;
                return (
                  <li key={s.key} className={`rounded-2xl border ${s.enabled ? 'border-slate-200 bg-slate-50/60' : 'border-dashed border-slate-200 bg-white opacity-70'}`}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <input type="checkbox" aria-label={`Show ${labels[s.key]}`} className="h-4 w-4 accent-blue-600" checked={s.enabled} onChange={(e) => patchSection(s.key, { enabled: e.target.checked })} />
                      <span className="flex-1 text-sm font-bold text-slate-800">{labels[s.key]}{s.style.title ? <span className="ml-2 text-xs font-medium text-slate-500">“{s.style.title}”</span> : null}</span>
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button type="button" aria-label="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)} className="rounded-lg border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowDown size={14} /></button>
                      <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.key)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-white">Style <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} /></button>
                    </div>
                    {isOpen && (
                      <div className="space-y-4 border-t border-slate-200 px-3 py-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <ColourField label="Section background" hint="Card background" value={s.style.bg || ''} onChange={(v) => patchStyle(s.key, 'bg', v)} />
                          <ColourField label="Section border" hint="Card border" value={s.style.border || ''} onChange={(v) => patchStyle(s.key, 'border', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {SECTION_NUMBERS.map(([k, label, max]) => (
                            <NumberField key={k} label={`${label} (px)`} min={0} max={max} value={s.style[k]} onChange={(v) => patchStyle(s.key, k, v)} />
                          ))}
                        </div>
                        {TITLED.has(s.key) && (
                          <label className="block">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Heading text (leave empty for the default)</span>
                            <input maxLength={60} value={s.style.title || ''} onChange={(e) => patchStyle(s.key, 'title', e.target.value)} className={`${field} mt-1`} />
                          </label>
                        )}
                        <p className="text-[11px] text-slate-500">Empty fields use the Style settings above.</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className={card}>
            <h2 className="mb-3 text-center text-sm font-extrabold text-slate-900">Preview — {PAGES.find((p) => p.key === page)?.label}</h2>
            <Preview tokens={effective} sections={sections} page={page} labels={labels} />
            <p className="mt-3 text-center text-[11px] text-slate-500">Shows {scope === 'all' ? 'the "All tabs" style' : TABS.find((t) => t.key === scope)?.label}. Real content replaces the grey bars.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartDesign;
