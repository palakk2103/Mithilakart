import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Palette, RotateCcw, Save, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services/api';
import {
  DEFAULT_TAB_THEMES,
  FESTIVAL_PRESETS,
  TAB_KEYS,
  TAB_LABELS,
  completePalette,
  contrastWithWhite,
} from '../../../../shared/theme/tabThemes';

const ROLES = [
  { key: 'primary', label: 'Main colour', hint: 'Buttons, header, prices' },
  { key: 'dark', label: 'Dark shade', hint: 'Pressed buttons, headings' },
  { key: 'accent', label: 'Accent', hint: 'Header gradient end, highlights' },
  { key: 'light', label: 'Background tint', hint: 'Page and card backgrounds' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
const clone = (tabs) => JSON.parse(JSON.stringify(tabs));

function TabPreview({ label, colours }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ background: colours.light }}>
      <div className="px-3 py-2.5 text-white text-xs font-black" style={{ background: `linear-gradient(90deg, ${colours.primary}, ${colours.accent})` }}>
        {label}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm">
          <div>
            <p className="text-[11px] font-bold" style={{ color: colours.dark }}>Masala Chips</p>
            <p className="text-sm font-black" style={{ color: colours.primary }}>₹20</p>
          </div>
          <span className="rounded-lg px-3 py-1.5 text-[11px] font-black text-white" style={{ background: colours.primary }}>ADD</span>
        </div>
        <span className="block rounded-full py-2 text-center text-[11px] font-black text-white" style={{ background: colours.dark }}>
          Proceed to Checkout
        </span>
      </div>
    </div>
  );
}

/**
 * Admin: colour theme of each customer tab — festival presets or custom.
 * Saving takes effect in the customer app on the next open/refocus; no
 * rebuild or deploy needed.
 */
const TabThemes = () => {
  const [tabs, setTabs] = useState(clone(DEFAULT_TAB_THEMES));
  const [preset, setPreset] = useState('default');
  const [published, setPublished] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getTabThemes().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data?.tabs) {
        const merged = Object.fromEntries(TAB_KEYS.map((t) => [t, completePalette(data.tabs[t] || DEFAULT_TAB_THEMES[t], t)]));
        setTabs(merged);
        setPreset(data.preset || 'custom');
        setPublished(data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const publishedName = useMemo(() => {
    if (!published) return 'Original colours';
    return FESTIVAL_PRESETS.find((p) => p.id === published.preset)?.name || 'Custom theme';
  }, [published]);

  const applyPreset = (p) => {
    setTabs(clone(p.tabs));
    setPreset(p.id);
  };

  const setColour = (tab, role, value) => {
    setTabs((prev) => ({ ...prev, [tab]: { ...prev[tab], [role]: value } }));
    setPreset('custom');
  };

  const autoShades = (tab) => {
    setTabs((prev) => ({ ...prev, [tab]: completePalette({ primary: prev[tab].primary }, tab) }));
    setPreset('custom');
  };

  const invalid = TAB_KEYS.some((t) => ROLES.some((r) => !HEX.test(tabs[t][r.key] || '')));

  const handleSave = async () => {
    if (invalid) {
      toast.error('Every colour must be a hex code like #F26522');
      return;
    }
    setSaving(true);
    const themes = preset === 'default' ? null : { preset, tabs };
    const { error } = await settingsApi.updateTabThemes(themes);
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    setPublished(themes);
    toast.success(themes ? 'Theme published to the customer app' : 'Original colours restored');
  };

  const handleRestore = async () => {
    applyPreset(FESTIVAL_PRESETS[0]);
    setSaving(true);
    const { error } = await settingsApi.updateTabThemes(null);
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    setPublished(null);
    toast.success('Original colours restored');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 className="animate-spin" size={18} /> Loading themes…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Palette size={22} /> App Theme & Festival Colours</h1>
          <p className="text-sm text-slate-500 mt-1">
            Colours of the four customer tabs. Live now: <span className="font-bold text-slate-800">{publishedName}</span>.
            Customers see a change the next time they open or return to the app.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleRestore} disabled={saving || !published}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            <RotateCcw size={15} /> Restore original
          </button>
          <button type="button" onClick={handleSave} disabled={saving || invalid}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3E5A44] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Publish theme
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Festival presets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {FESTIVAL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              aria-pressed={preset === p.id}
              className={`rounded-2xl border p-3 text-left transition-all ${preset === p.id ? 'border-[#3E5A44] ring-2 ring-[#3E5A44]/20 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className="flex gap-1 mb-2">
                {TAB_KEYS.map((t) => (
                  <span key={t} className="h-6 flex-1 rounded-md" style={{ background: p.tabs[t].primary }} title={TAB_LABELS[t]} />
                ))}
              </div>
              <p className="text-xs font-black text-slate-800">{p.emoji} {p.name}</p>
            </button>
          ))}
        </div>
        {preset === 'custom' && <p className="mt-2 text-xs font-semibold text-slate-500">Custom colours — not one of the presets.</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {TAB_KEYS.map((tab) => {
          const colours = completePalette(tabs[tab], tab);
          const readable = HEX.test(tabs[tab].primary || '') ? contrastWithWhite(tabs[tab].primary) >= 3 : true;
          return (
            <section key={tab} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-slate-900">{TAB_LABELS[tab]}</h2>
                <button type="button" onClick={() => autoShades(tab)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800">
                  <Wand2 size={13} /> Auto shades from main colour
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <label key={role.key} className="flex items-center gap-3">
                      <input
                        type="color"
                        aria-label={`${TAB_LABELS[tab]} ${role.label}`}
                        value={HEX.test(tabs[tab][role.key] || '') ? tabs[tab][role.key] : '#000000'}
                        onChange={(e) => setColour(tab, role.key, e.target.value.toUpperCase())}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-slate-800">{role.label}</span>
                        <span className="block text-[11px] text-slate-500">{role.hint}</span>
                      </span>
                      <input
                        value={tabs[tab][role.key] || ''}
                        onChange={(e) => setColour(tab, role.key, e.target.value.trim())}
                        aria-label={`${TAB_LABELS[tab]} ${role.label} hex`}
                        className={`w-24 rounded-lg border px-2 py-1.5 font-mono text-xs uppercase ${HEX.test(tabs[tab][role.key] || '') ? 'border-slate-200' : 'border-red-400 bg-red-50'}`}
                      />
                    </label>
                  ))}
                </div>
                <TabPreview label={TAB_LABELS[tab]} colours={colours} />
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
