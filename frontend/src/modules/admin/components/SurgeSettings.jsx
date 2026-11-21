import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { estimateBill } from '../../user/utils/billing';

export const DEFAULT_SURGE = {
  enabled: true,
  amount: 30,
  threshold: 499,
  tabs: ['quick_shop', 'groceries_fresh'],
  windows: [],
  bannerTitle: 'Place an order above ₹{threshold} to avoid surge charge',
  bannerText: 'Surge applicable due to high demand',
  billLabel: 'Surge charge',
  billNote: 'High demand right now. Add ₹{remaining} more to remove it.',
};

const TABS = [
  { id: 'mithilakart', label: 'Mithilakart' },
  { id: 'quick_shop', label: 'Quick Shop' },
  { id: 'mithilak', label: 'Mithilak' },
  { id: 'groceries_fresh', label: 'Fresh & Groceries' },
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const num = (v, fallback) => {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Shape sent to PATCH settings (`surgeConfig`). */
export const surgeForSave = (s) => ({
  enabled: Boolean(s.enabled),
  amount: num(s.amount, 30),
  threshold: num(s.threshold, 499),
  tabs: s.tabs,
  windows: (s.windows || []).map((w) => ({ days: w.days, start: w.start, end: w.end })),
  bannerTitle: String(s.bannerTitle || '').trim() || DEFAULT_SURGE.bannerTitle,
  bannerText: String(s.bannerText || '').trim(),
  billLabel: String(s.billLabel || '').trim() || DEFAULT_SURGE.billLabel,
  billNote: String(s.billNote || '').trim(),
});

const label = 'text-[10px] font-semibold text-slate-400 uppercase tracking-widest block';
const input = 'w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none';

/** FEE-3 surge settings + FEE-4 sample-bill preview (uses the storefront's bill rules). */
const SurgeSettings = ({ value, onChange, fees }) => {
  const s = { ...DEFAULT_SURGE, ...(value || {}) };
  const set = (patch) => onChange({ ...s, ...patch });
  const [previewValue, setPreviewValue] = useState(120);
  const [previewTab, setPreviewTab] = useState('quick_shop');

  const preview = useMemo(() => {
    const surge = {
      enabled: s.enabled,
      amount: num(s.amount, 0),
      threshold: num(s.threshold, 0),
      activeTabs: s.tabs, // preview ignores time windows
      billLabel: s.billLabel,
    };
    return estimateBill(
      [{ price: num(previewValue, 0), oldPrice: num(previewValue, 0), qty: 1 }],
      { ...fees, surge },
      0,
      previewTab
    );
  }, [s.enabled, s.amount, s.threshold, s.tabs, s.billLabel, fees, previewValue, previewTab]);

  const updateWindow = (i, patch) => set({ windows: s.windows.map((w, j) => (j === i ? { ...w, ...patch } : w)) });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Surge charge (high demand)</h3>
        <p className="text-xs text-slate-500">Added to the bill on the chosen tabs while the cart value is below the threshold. Customers see a banner on those tabs and a line in the bill.</p>
      </div>

      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Surge charge on</span>
        <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <span className={label}>Surge amount (₹)</span>
          <input type="number" min="0" value={s.amount} onChange={(e) => set({ amount: e.target.value })} className={input} />
        </div>
        <div className="space-y-2">
          <span className={label}>No surge on carts of at least (₹)</span>
          <input type="number" min="0" value={s.threshold} onChange={(e) => set({ threshold: e.target.value })} className={input} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Applies on tabs</legend>
        <div className="flex flex-wrap gap-2 mt-2">
          {TABS.map((tab) => {
            const on = s.tabs.includes(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={on}
                onClick={() => set({ tabs: on ? s.tabs.filter((t) => t !== tab.id) : [...s.tabs, tab.id] })}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <span className={label}>Time windows (IST) — leave empty for all day, every day</span>
        <div className="space-y-3 mt-2">
          {s.windows.map((w, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {DAYS.map((d, di) => {
                  const days = w.days?.length ? w.days : [0, 1, 2, 3, 4, 5, 6];
                  const on = days.includes(di);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => updateWindow(i, { days: on ? days.filter((x) => x !== di) : [...days, di].sort() })}
                      className={`w-10 h-8 rounded-lg text-[11px] font-bold ${on ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <input type="time" aria-label="From" value={w.start} onChange={(e) => updateWindow(i, { start: e.target.value })} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold" />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input type="time" aria-label="To" value={w.end} onChange={(e) => updateWindow(i, { end: e.target.value })} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold" />
              <button type="button" aria-label="Remove window" onClick={() => set({ windows: s.windows.filter((_, j) => j !== i) })} className="ml-auto p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ windows: [...s.windows, { days: [0, 1, 2, 3, 4, 5, 6], start: '18:00', end: '23:00' }] })} className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider">
            <Plus size={14} /> Add time window
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          ['bannerTitle', 'Banner headline ({threshold} = threshold)'],
          ['bannerText', 'Banner sub-text'],
          ['billLabel', 'Bill line label'],
          ['billNote', 'Bill line note ({remaining} = amount left)'],
        ].map(([key, text]) => (
          <div key={key} className="space-y-2">
            <span className={label}>{text}</span>
            <input type="text" maxLength={200} value={s[key]} onChange={(e) => set({ [key]: e.target.value })} className={input} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">Sample bill preview</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            Cart value ₹
            <input type="number" min="0" value={previewValue} onChange={(e) => setPreviewValue(e.target.value)} className="w-24 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold" />
          </label>
          <select aria-label="Preview tab" value={previewTab} onChange={(e) => setPreviewTab(e.target.value)} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold">
            {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm max-w-sm">
          <dt className="text-slate-600">Items</dt><dd className="font-bold text-right">₹{preview.subtotal}</dd>
          <dt className="text-slate-600">Handling fee</dt><dd className="font-bold text-right">{preview.handlingFee ? `₹${preview.handlingFee}` : 'FREE'}</dd>
          <dt className="text-slate-600">Delivery fee</dt><dd className="font-bold text-right">{preview.deliveryCharge ? `₹${preview.deliveryCharge}` : 'FREE'}</dd>
          <dt className="text-slate-600">{s.billLabel || 'Surge charge'}</dt><dd className="font-bold text-right">{preview.surgeCharge ? `₹${preview.surgeCharge}` : '—'}</dd>
          {preview.platformFee > 0 && <><dt className="text-slate-600">Platform fee</dt><dd className="font-bold text-right">₹{preview.platformFee}</dd></>}
          {preview.packagingFee > 0 && <><dt className="text-slate-600">Packaging fee</dt><dd className="font-bold text-right">₹{preview.packagingFee}</dd></>}
          <dt className="text-slate-900 font-black border-t border-slate-200 pt-1.5">Total</dt><dd className="font-black text-right border-t border-slate-200 pt-1.5">₹{preview.total}</dd>
        </dl>
        <p className="text-[11px] text-slate-500 mt-3">Uses the values on this screen before saving. Time windows are not applied in the preview.</p>
      </div>
    </div>
  );
};

export default SurgeSettings;
