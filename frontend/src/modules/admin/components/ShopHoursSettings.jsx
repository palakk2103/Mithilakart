import React from 'react';

export const DEFAULT_SHOP_HOURS = {
  enabled: true,
  forceClosed: false,
  tabs: ['quick_shop', 'groceries_fresh'],
  open: '06:00',
  close: '00:00',
  message: 'We are closed right now. Orders open again at 6:00 AM.',
};

const TABS = [
  { id: 'quick_shop', label: 'Quick Shop' },
  { id: 'groceries_fresh', label: 'Fresh & Groceries' },
  { id: 'mithilakart', label: 'Mithilakart' },
  { id: 'mithilak', label: 'Mithilak' },
];

export const shopHoursForSave = (s) => ({
  enabled: Boolean(s.enabled),
  forceClosed: Boolean(s.forceClosed),
  tabs: s.tabs,
  open: s.open || DEFAULT_SHOP_HOURS.open,
  close: s.close || DEFAULT_SHOP_HOURS.close,
  message: String(s.message || '').trim() || DEFAULT_SHOP_HOURS.message,
});

const label = 'text-[10px] font-semibold text-slate-400 uppercase tracking-widest block';
const input = 'w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none';

/** Opening hours (IST) and the "close the shop now" switch. Enforced by the server on every order. */
const ShopHoursSettings = ({ value, onChange }) => {
  const s = { ...DEFAULT_SHOP_HOURS, ...(value || {}) };
  const set = (patch) => onChange({ ...s, ...patch });
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Shop hours</h3>
        <p className="text-xs text-slate-500">Outside these hours customers see the closed screen on the chosen tabs and the server refuses new orders there.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Use opening hours</span>
          <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100 cursor-pointer">
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-tight">Close the shop now</span>
          <input type="checkbox" className="w-5 h-5 accent-rose-600" checked={s.forceClosed} onChange={(e) => set({ forceClosed: e.target.checked })} />
        </label>
        <div className="space-y-2">
          <span className={label}>Opens at (IST)</span>
          <input type="time" aria-label="Opens at" value={s.open} onChange={(e) => set({ open: e.target.value })} className={input} />
        </div>
        <div className="space-y-2">
          <span className={label}>Closes at (IST) — 00:00 is midnight; same as opening = open 24 hours</span>
          <input type="time" aria-label="Closes at" value={s.close} onChange={(e) => set({ close: e.target.value })} className={input} />
        </div>
      </div>
      <fieldset>
        <legend className={label}>Applies on tabs</legend>
        <div className="flex flex-wrap gap-2 mt-2">
          {TABS.map((tab) => {
            const on = s.tabs.includes(tab.id);
            return (
              <button key={tab.id} type="button" aria-pressed={on} onClick={() => set({ tabs: on ? s.tabs.filter((t) => t !== tab.id) : [...s.tabs, tab.id] })}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="space-y-2">
        <span className={label}>Message shown to customers</span>
        <input type="text" maxLength={200} value={s.message} onChange={(e) => set({ message: e.target.value })} className={input} />
      </div>
    </div>
  );
};

export default ShopHoursSettings;
