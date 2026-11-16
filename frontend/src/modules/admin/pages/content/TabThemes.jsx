import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Loader2, Palette, RotateCcw, Save, Sparkles, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services/api';
import {
  DEFAULT_TAB_THEMES, FESTIVAL_PRESETS, TAB_KEYS, TAB_LABELS, PRESET_EFFECTS,
  completePalette, contrastWithWhite, singleColourTabs,
} from '../../../../shared/theme/tabThemes';
import { EFFECT_TYPES, EFFECT_TAB_KEYS, normalizeEffects, typeInfo } from '../../../../shared/theme/effects';
import EffectLayer from '../../../../shared/theme/EffectLayer';
import ThemeIcon, { ICON_NAMES, SHAPE_NAMES, ThemeShape } from '../../../../shared/theme/ThemeIcon';
import { HeroCard } from '../../../../shared/components/SeasonalHero';

const ROLES = [
  { key: 'primary', label: 'Main colour', hint: 'Buttons, header, prices' },
  { key: 'dark', label: 'Dark shade', hint: 'Pressed buttons, headings' },
  { key: 'accent', label: 'Accent', hint: 'Header gradient end, highlights' },
  { key: 'light', label: 'Background tint', hint: 'Page and card backgrounds' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
const clone = (v) => JSON.parse(JSON.stringify(v));

const card = 'rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.12)]';
const fieldCls = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200';
const label = 'text-[11px] font-bold uppercase tracking-wider text-slate-500';

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <section className={card}>
      <div className="flex items-center gap-2.5 mb-1">
        {Icon && <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Icon size={16} /></span>}
        <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-500 mb-5 ml-[42px] -mt-0.5">{subtitle}</p>}
      {children}
    </section>
  );
}

function TabPreview({ name, colours }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ background: colours.light }}>
      <div className="px-3 py-2.5 text-white text-xs font-black" style={{ background: `linear-gradient(90deg, ${colours.primary}, ${colours.accent})` }}>{name}</div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm">
          <div>
            <p className="text-[11px] font-bold" style={{ color: colours.dark }}>Masala Chips</p>
            <p className="text-sm font-black" style={{ color: colours.primary }}>₹20</p>
          </div>
          <span className="rounded-lg px-3 py-1.5 text-[11px] font-black text-white" style={{ background: colours.primary }}>ADD</span>
        </div>
        <span className="block rounded-full py-2 text-center text-[11px] font-black text-white" style={{ background: colours.dark }}>Proceed to Checkout</span>
      </div>
    </div>
  );
}

const Toggle = ({ checked, onChange, title, hint }) => (
  <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-left">
    <span className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </span>
    <span className="min-w-0">
      <span className="block text-[13px] font-bold text-slate-800">{title}</span>
      {hint && <span className="block text-[11.5px] text-slate-500">{hint}</span>}
    </span>
  </button>
);

/**
 * Admin: the look of the four customer tabs — colours, an animated seasonal effect, an
 * illustrated festive banner and an announcement pill, with a live phone preview.
 * Publishing takes effect on the customer app's next open / refocus; no deploy needed.
 */
const TabThemes = () => {
  const [tabs, setTabs] = useState(clone(DEFAULT_TAB_THEMES));
  const [preset, setPreset] = useState('default');
  const [effects, setEffects] = useState(normalizeEffects(null));
  const [previewTab, setPreviewTab] = useState('mithilakart');
  const [oneColour, setOneColour] = useState('#F26522');
  const [published, setPublished] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getTabThemes().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data?.tabs) {
        setTabs(Object.fromEntries(TAB_KEYS.map((t) => [t, completePalette(data.tabs[t] || DEFAULT_TAB_THEMES[t], t)])));
        setPreset(data.preset || 'custom');
        setEffects(normalizeEffects(data.effects));
        setPublished(data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const publishedName = useMemo(() => {
    if (!published) return 'Original look';
    const base = FESTIVAL_PRESETS.find((p) => p.id === published.preset)?.name || 'Custom theme';
    return published.effects?.type && published.effects.type !== 'none' ? `${base} + ${typeInfo(published.effects.type).label}` : base;
  }, [published]);

  const applyPreset = (p) => {
    setTabs(clone(p.tabs));
    setPreset(p.id);
    setEffects(normalizeEffects(PRESET_EFFECTS[p.id]));
  };
  const setFx = (patch) => setEffects((prev) => normalizeEffects({ ...prev, ...patch }));
  const setHero = (patch) => setFx({ hero: { ...effects.hero, ...patch } });
  const setBanner = (patch) => setFx({ banner: { ...effects.banner, ...patch } });
  const toggleList = (key, value, max = 6) => {
    const cur = effects[key];
    setFx({ [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value].slice(0, max) });
  };
  // Empty list means "every tab", so the first click turns that one tab OFF.
  const toggleTab = (tab) => {
    const current = effects.tabs.length === 0 ? [...EFFECT_TAB_KEYS] : effects.tabs;
    const next = current.includes(tab) ? current.filter((t) => t !== tab) : [...current, tab];
    setFx({ tabs: next.length === EFFECT_TAB_KEYS.length ? [] : next });
  };

  const setColour = (tab, role, value) => {
    setTabs((prev) => ({ ...prev, [tab]: { ...prev[tab], [role]: value } }));
    setPreset('custom');
  };
  const autoShades = (tab) => {
    setTabs((prev) => ({ ...prev, [tab]: completePalette({ primary: prev[tab].primary }, tab) }));
    setPreset('custom');
  };
  const applyOneColour = () => {
    if (!HEX.test(oneColour)) { toast.error('Enter a colour like #F26522'); return; }
    setTabs(singleColourTabs(oneColour.toUpperCase()));
    setPreset('custom');
  };

  const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

  const invalid = TAB_KEYS.some((t) => ROLES.some((r) => !HEX.test(tabs[t][r.key] || '')));

  const publish = async () => {
    if (invalid) { toast.error('Every colour must be a hex code like #F26522'); return; }
    const fx = effects.type === 'none' ? null : {
      ...effects,
      banner: { ...effects.banner, text: effects.banner.text.trim() },
      hero: { ...effects.hero, headline: effects.hero.headline.trim(), subtext: effects.hero.subtext.trim(), ctaLabel: effects.hero.ctaLabel.trim() },
    };
    if (fx?.startsAt && fx?.endsAt && Date.parse(fx.endsAt) <= Date.parse(fx.startsAt)) { toast.error('The end date must be after the start date'); return; }
    if (fx?.hero.enabled && !fx.hero.headline) { toast.error('Add a headline for the banner, or switch it off'); return; }
    setSaving(true);
    const themes = preset === 'default' && !fx ? null : { preset, tabs, ...(fx ? { effects: fx } : {}) };
    const { error } = await settingsApi.updateTabThemes(themes);
    setSaving(false);
    if (error) { toast.error(error); return; }
    setPublished(themes);
    toast.success(themes ? 'Theme published to the customer app' : 'Original look restored');
  };

  const restore = async () => {
    applyPreset(FESTIVAL_PRESETS[0]);
    setSaving(true);
    const { error } = await settingsApi.updateTabThemes(null);
    setSaving(false);
    if (error) { toast.error(error); return; }
    setPublished(null);
    toast.success('Original look restored');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-500 gap-2"><Loader2 className="animate-spin" size={18} /> Loading themes…</div>;
  }

  const previewColours = completePalette(tabs[previewTab], previewTab);
  const showHero = effects.type !== 'none' && effects.hero.enabled && effects.hero.headline.trim();

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Palette size={18} /></span>
            App Theme, Seasons &amp; Festivals
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">Live now: <span className="font-bold text-slate-800">{publishedName}</span>. Customers see changes the next time they open or return to the app.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={restore} disabled={saving || !published}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            <RotateCcw size={15} /> Restore original
          </button>
          <button type="button" onClick={publish} disabled={saving || invalid}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Publish theme
          </button>
        </div>
      </div>

      {/* Quick start */}
      <Section title="Quick start" subtitle="Pick a ready-made look — colours, animation and festive banner together. Everything stays editable below." icon={Sparkles}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FESTIVAL_PRESETS.map((p) => {
            const on = preset === p.id;
            return (
              <button key={p.id} type="button" onClick={() => applyPreset(p)} aria-pressed={on}
                className={`group relative rounded-2xl border p-3 text-left transition-all ${on ? 'border-slate-900 ring-2 ring-slate-900/10 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}`}>
                {on && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center"><Check size={12} strokeWidth={3} /></span>}
                <div className="flex h-10 rounded-xl overflow-hidden mb-2.5">
                  {TAB_KEYS.map((t) => <span key={t} className="flex-1" style={{ background: p.tabs[t].primary }} title={TAB_LABELS[t]} />)}
                </div>
                <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800 leading-tight"><ThemeIcon name={p.icon} size={15} className="flex-shrink-0 text-slate-500" /> {p.name}</p>
              </button>
            );
          })}
        </div>
        {preset === 'custom' && <p className="mt-3 text-xs font-semibold text-slate-500">Custom — your own colours.</p>}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <p className="text-[13px] font-bold text-slate-800">One colour for the whole app</p>
            <p className="text-[11.5px] text-slate-500">Choose a single colour and every tab gets matching shades.</p>
          </div>
          <input type="color" aria-label="One colour for every tab" value={HEX.test(oneColour) ? oneColour : '#F26522'} onChange={(e) => setOneColour(e.target.value.toUpperCase())} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
          <input value={oneColour} onChange={(e) => setOneColour(e.target.value.trim())} aria-label="One colour hex" className={`w-28 rounded-xl border px-3 py-2.5 font-mono text-sm uppercase ${HEX.test(oneColour) ? 'border-slate-200' : 'border-red-400 bg-red-50'}`} />
          <button type="button" onClick={applyOneColour} className="h-10 rounded-xl bg-white border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-slate-100">Apply to all tabs</button>
        </div>
      </Section>

      {/* Effects + hero */}
      <Section title="Seasonal effects & festive banner" subtitle="Animation, an illustrated banner for the home screen, and an announcement pill. Schedule it for any season or event." icon={Sparkles}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-7">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" role="radiogroup" aria-label="Effect">
              {EFFECT_TYPES.map((t) => {
                const on = effects.type === t.id;
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => setFx({ type: t.id })}
                    className={`rounded-2xl border p-3 text-left transition-all ${on ? 'border-slate-900 ring-2 ring-slate-900/10 bg-slate-50' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${on ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><ThemeIcon name={t.icon} size={19} /></span>
                    <span className="block text-[12.5px] font-bold text-slate-800">{t.label}</span>
                    <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">{t.hint}</span>
                  </button>
                );
              })}
            </div>

            {effects.type !== 'none' && (
              <>
                <div className="grid gap-5 sm:grid-cols-3">
                  {[['intensity', 'Amount'], ['speed', 'Speed'], ['size', 'Size']].map(([key, name]) => (
                    <label key={key} className="block">
                      <span className="flex justify-between text-xs font-bold text-slate-700"><span>{name}</span><span className="text-slate-400">{effects[key]} / 5</span></span>
                      <input type="range" min="1" max="5" step="1" value={effects[key]} onChange={(e) => setFx({ [key]: Number(e.target.value) })} className="mt-2 w-full accent-slate-900" />
                    </label>
                  ))}
                </div>

                <div>
                  <p className={label}>Show on these tabs</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EFFECT_TAB_KEYS.map((t) => {
                      const on = effects.tabs.length === 0 || effects.tabs.includes(t);
                      return <button key={t} type="button" aria-pressed={on} onClick={() => toggleTab(t)} className={`rounded-full border px-4 py-1.5 text-xs font-bold ${on ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-500'}`}>{TAB_LABELS[t]}</button>;
                    })}
                    {effects.tabs.length > 0 && <button type="button" onClick={() => setFx({ tabs: [] })} className="text-xs font-bold text-slate-500 underline px-2">All tabs</button>}
                  </div>
                </div>

                {effects.type === 'custom' && (
                  <div className="grid gap-5 sm:grid-cols-[1fr_170px]">
                    <div>
                      <p className={label}>Shapes (up to 6)</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SHAPE_NAMES.map((s) => {
                          const on = effects.shapes.includes(s);
                          return (
                            <button key={s} type="button" aria-pressed={on} aria-label={s} onClick={() => toggleList('shapes', s)}
                              className={`w-11 h-11 rounded-xl border flex items-center justify-center ${on ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                              <span className="w-5 h-5 block"><ThemeShape name={s} color={on ? '#fff' : '#64748B'} /></span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <label className="block">
                      <span className={label}>Motion</span>
                      <select value={effects.motion} onChange={(e) => setFx({ motion: e.target.value })} className={fieldCls}>
                        <option value="fall">Falling</option><option value="rise">Rising</option><option value="float">Floating</option>
                      </select>
                    </label>
                  </div>
                )}

                <div>
                  <p className={label}>Effect colours <span className="normal-case font-semibold text-slate-400">— optional</span></p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const own = typeInfo(effects.type).colors || [];
                      return (
                        <input key={i} type="color" aria-label={`Effect colour ${i + 1}`} value={effects.colors[i] || own[i] || '#ffffff'}
                          onChange={(e) => { const next = [...(effects.colors.length ? effects.colors : own)]; next[i] = e.target.value.toUpperCase(); setFx({ colors: next.slice(0, 5) }); }}
                          className="h-10 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
                      );
                    })}
                    {effects.colors.length > 0 && <button type="button" onClick={() => setFx({ colors: [] })} className="text-xs font-bold text-slate-500 underline">Reset</button>}
                  </div>
                </div>

                <Toggle checked={effects.ambient} onChange={(v) => setFx({ ambient: v })} title="Soft glow" hint="A light overlay that matches the effect (frost, sun glow, golden light…)" />

                {/* Hero banner */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                  <Toggle checked={effects.hero.enabled} onChange={(v) => setHero({ enabled: v })} title="Illustrated banner on the home screen" hint="Large festive banner with headline and button, drawn in the effect's scene" />
                  {effects.hero.enabled && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block sm:col-span-2"><span className={label}>Headline</span><input value={effects.hero.headline} maxLength={60} onChange={(e) => setHero({ headline: e.target.value })} placeholder="Winter Sale is here" className={fieldCls} /></label>
                      <label className="block sm:col-span-2"><span className={label}>Sub text</span><input value={effects.hero.subtext} maxLength={110} onChange={(e) => setHero({ subtext: e.target.value })} placeholder="Warm picks & cosy essentials, up to 50% off" className={fieldCls} /></label>
                      <label className="block"><span className={label}>Button text</span><input value={effects.hero.ctaLabel} maxLength={24} onChange={(e) => setHero({ ctaLabel: e.target.value })} className={fieldCls} /></label>
                      <label className="block"><span className={label}>Button opens (in-app link)</span><input value={effects.hero.ctaLink} maxLength={200} onChange={(e) => setHero({ ctaLink: e.target.value.trim() })} placeholder="/deals" className={fieldCls} /></label>
                    </div>
                  )}
                </div>

                {/* Announcement pill */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                  <Toggle checked={effects.banner.enabled} onChange={(v) => setBanner({ enabled: v })} title="Announcement pill" hint="Small dismissible message near the bottom of the screen" />
                  {effects.banner.enabled && (
                    <>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pill icon">
                        {ICON_NAMES.map((n) => (
                          <button key={n} type="button" role="radio" aria-checked={effects.banner.icon === n} aria-label={n} onClick={() => setBanner({ icon: n })}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center ${effects.banner.icon === n ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            <ThemeIcon name={n} size={18} />
                          </button>
                        ))}
                      </div>
                      <input aria-label="Pill text" value={effects.banner.text} maxLength={120} onChange={(e) => setBanner({ text: e.target.value })} placeholder="Winter Sale — stay cosy, save more" className={fieldCls} />
                    </>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className={label}>Starts (optional)</span><input type="datetime-local" value={toLocalInput(effects.startsAt)} onChange={(e) => setFx({ startsAt: fromLocalInput(e.target.value) })} className={fieldCls} /></label>
                  <label className="block"><span className={label}>Ends (optional)</span><input type="datetime-local" value={toLocalInput(effects.endsAt)} onChange={(e) => setFx({ endsAt: fromLocalInput(e.target.value) })} className={fieldCls} /></label>
                </div>
                <p className="text-[11.5px] text-slate-500 -mt-4">Leave both empty to run until you switch it off. Customers who prefer reduced motion see no animation.</p>
              </>
            )}
          </div>

          {/* Live phone preview */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {EFFECT_TAB_KEYS.map((t) => (
                <button key={t} type="button" onClick={() => setPreviewTab(t)} className={`rounded-full px-3 py-1 text-[11px] font-bold ${previewTab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{TAB_LABELS[t]}</button>
              ))}
            </div>
            <div className="mx-auto w-[280px] rounded-[38px] bg-slate-900 p-2 shadow-2xl">
              <div className="relative h-[520px] rounded-[30px] overflow-hidden bg-white" data-testid="effect-preview" style={{ background: previewColours.light }}>
                <div className="h-14 flex items-end px-4 pb-2 text-white font-extrabold text-sm" style={{ background: `linear-gradient(90deg, ${previewColours.primary}, ${previewColours.accent})` }}>{TAB_LABELS[previewTab]}</div>
                <div className="p-3 space-y-3">
                  {showHero ? (
                    <HeroCard effects={effects} colours={previewColours} className="!rounded-2xl [&_h2]:!text-[16px] [&_p]:!text-[10.5px]" />
                  ) : (
                    <div className="h-28 rounded-2xl bg-white/70 border border-dashed border-slate-300 flex items-center justify-center text-[11px] font-semibold text-slate-400">Banner off</div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="rounded-xl bg-white p-2 shadow-sm">
                        <div className="h-14 rounded-lg bg-slate-100" />
                        <div className="h-2 w-3/4 rounded bg-slate-200 mt-2" />
                        <div className="mt-1.5 inline-block rounded px-2 py-0.5 text-[9px] font-black text-white" style={{ background: previewColours.primary }}>ADD</div>
                      </div>
                    ))}
                  </div>
                </div>
                <EffectLayer effects={effects} fixed={false} force />
                {effects.type !== 'none' && effects.banner.enabled && effects.banner.text.trim() && (
                  <div className="absolute left-3 right-3 bottom-3 z-10 flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-white text-[10.5px] font-semibold shadow-lg" style={{ background: previewColours.primary }}>
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><ThemeIcon name={effects.banner.icon} size={13} /></span>
                    <span className="truncate">{effects.banner.text}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-3 text-center">Live preview — what customers will see.</p>
          </div>
        </div>
      </Section>

      {/* Per-tab colours */}
      <div className="grid gap-5 lg:grid-cols-2">
        {TAB_KEYS.map((tab) => {
          const colours = completePalette(tabs[tab], tab);
          const readable = HEX.test(tabs[tab].primary || '') ? contrastWithWhite(tabs[tab].primary) >= 3 : true;
          return (
            <section key={tab} className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-slate-900">{TAB_LABELS[tab]}</h2>
                <button type="button" onClick={() => autoShades(tab)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"><Wand2 size={13} /> Auto shades from main colour</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <label key={role.key} className="flex items-center gap-3">
                      <input type="color" aria-label={`${TAB_LABELS[tab]} ${role.label}`} value={HEX.test(tabs[tab][role.key] || '') ? tabs[tab][role.key] : '#000000'} onChange={(e) => setColour(tab, role.key, e.target.value.toUpperCase())} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
                      <span className="flex-1 min-w-0"><span className="block text-xs font-bold text-slate-800">{role.label}</span><span className="block text-[11px] text-slate-500">{role.hint}</span></span>
                      <input value={tabs[tab][role.key] || ''} onChange={(e) => setColour(tab, role.key, e.target.value.trim())} aria-label={`${TAB_LABELS[tab]} ${role.label} hex`} className={`w-24 rounded-lg border px-2 py-1.5 font-mono text-xs uppercase ${HEX.test(tabs[tab][role.key] || '') ? 'border-slate-200' : 'border-red-400 bg-red-50'}`} />
                    </label>
                  ))}
                </div>
                <TabPreview name={TAB_LABELS[tab]} colours={colours} />
              </div>
              <p className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${readable ? 'text-emerald-700' : 'text-amber-700'}`}>
                {readable ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {readable ? 'White text is readable on the main colour.' : 'Main colour is light — white button text may be hard to read.'}
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default TabThemes;
