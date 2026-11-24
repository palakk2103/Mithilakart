import React from 'react';

export const DEFAULT_CASHBACK = {
  enabled: false, campaign: 'default', mode: 'instant', type: 'percent', value: 10, maxAmount: 100, minOrder: 199,
  methods: ['upi'], tabs: [], perCustomer: 1, startsAt: null, endsAt: null, title: '', linkText: 'Know More', terms: '',
};

const num = (v, d = 0) => { const n = Number(v); return v === '' || v == null || !Number.isFinite(n) ? d : n; };
export const cashbackForSave = (c) => ({
  ...DEFAULT_CASHBACK, ...c,
  enabled: Boolean(c.enabled),
  value: num(c.value), maxAmount: num(c.maxAmount), minOrder: num(c.minOrder), perCustomer: Math.max(0, Math.round(num(c.perCustomer))),
  startsAt: c.startsAt || null, endsAt: c.endsAt || null,
  title: String(c.title || '').trim(), linkText: String(c.linkText || '').trim() || 'Know More', terms: String(c.terms || '').trim(),
});

const label = 'text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1';
const input = 'w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none';
const pill = (on) => `px-4 py-2 rounded-xl text-xs font-bold border ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`;
const METHODS = [['upi', 'UPI / PhonePe'], ['card', 'Cards'], ['cod', 'Cash on Delivery']];
const TABS = [['mithilakart', 'Mithilakart'], ['quick_shop', 'Quick Shop'], ['mithilak', 'Mithilak'], ['groceries_fresh', 'Fresh & Groceries']];

// <input type="datetime-local"> works in the admin's own time zone.
const toLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const toIso = (v) => (v ? new Date(v).toISOString() : null);
const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Cashback rules, wallet at checkout and pincode blocking. Everything here is applied by the server. */
const CashbackSettings = ({ value, onChange, walletEnabled, onWallet, blockPincodes, onBlockPincodes }) => {
  const c = { ...DEFAULT_CASHBACK, ...(value || {}) };
  const set = (patch) => onChange({ ...c, ...patch });
  const check = (text, checked, on, help) => (
    <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
      <span><span className="block text-xs font-black text-slate-900">{text}</span>{help && <span className="block text-[11px] text-slate-500 mt-0.5">{help}</span>}</span>
      <input type="checkbox" aria-label={text} className="w-5 h-5 accent-blue-600 flex-shrink-0" checked={Boolean(checked)} onChange={(e) => on(e.target.checked)} />
    </label>
  );
  const field = (key, text, props = {}) => (
    <div><span className={label}>{text}</span><input aria-label={text} type="number" min="0" value={c[key]} onChange={(e) => set({ [key]: e.target.value })} className={input} {...props} /></div>
  );

  return (
    <div className="space-y-5" data-testid="cashback-settings">
      <div>
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Cashback</h3>
        <p className="text-xs text-slate-500">The payment page banner and its &quot;Know More&quot; text are written from these rules, and the cashback is really given.</p>
      </div>
      {check('Cashback on', c.enabled, (v) => set({ enabled: v }))}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[['instant', 'Off the bill now', 'The amount to pay is lower straight away.'], ['wallet', 'To wallet after delivery', 'Needs "Pay with wallet balance" below so customers can spend it.']].map(([id, t, h]) => (
          <button key={id} type="button" aria-pressed={c.mode === id} onClick={() => set({ mode: id })} className={`text-left p-4 rounded-2xl border ${c.mode === id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <span className="block text-xs font-black text-slate-900">{t}</span><span className="block text-[11px] text-slate-500 mt-1">{h}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><span className={label}>Type</span>
          <select aria-label="Cashback type" value={c.type} onChange={(e) => set({ type: e.target.value })} className={input}><option value="percent">Percent of items</option><option value="flat">Fixed amount</option></select>
        </div>
        {field('value', c.type === 'flat' ? 'Cashback (₹)' : 'Cashback (%)')}
        {field('maxAmount', 'Maximum (₹, 0 = no maximum)')}
        {field('minOrder', 'Minimum order (₹)')}
        {field('perCustomer', 'Times per customer (0 = no limit)')}
        <div className="flex items-end"><button type="button" onClick={() => set({ campaign: `c${Date.now().toString(36)}` })} className="h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600">New campaign (restart customer counts)</button></div>
      </div>
      <div><span className={label}>Payment methods</span><div className="flex flex-wrap gap-2">{METHODS.map(([id, t]) => <button key={id} type="button" aria-pressed={c.methods.includes(id)} onClick={() => set({ methods: toggle(c.methods, id) })} className={pill(c.methods.includes(id))}>{t}</button>)}</div></div>
      <div><span className={label}>Tabs (none selected = all)</span><div className="flex flex-wrap gap-2">{TABS.map(([id, t]) => <button key={id} type="button" aria-pressed={c.tabs.includes(id)} onClick={() => set({ tabs: toggle(c.tabs, id) })} className={pill(c.tabs.includes(id))}>{t}</button>)}</div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><span className={label}>Starts (optional)</span><input aria-label="Cashback starts" type="datetime-local" value={toLocal(c.startsAt)} onChange={(e) => set({ startsAt: toIso(e.target.value) })} className={input} /></div>
        <div><span className={label}>Ends (optional)</span><input aria-label="Cashback ends" type="datetime-local" value={toLocal(c.endsAt)} onChange={(e) => set({ endsAt: toIso(e.target.value) })} className={input} /></div>
        <div><span className={label}>Banner text (empty = written automatically)</span><input aria-label="Cashback banner text" maxLength={120} value={c.title} onChange={(e) => set({ title: e.target.value })} className={input} /></div>
        <div><span className={label}>Link text</span><input aria-label="Cashback link text" maxLength={40} value={c.linkText} onChange={(e) => set({ linkText: e.target.value })} className={input} /></div>
      </div>
      <div><span className={label}>Extra terms in &quot;Know More&quot;</span><textarea aria-label="Cashback terms" rows={3} maxLength={1000} value={c.terms} onChange={(e) => set({ terms: e.target.value })} className={input} /></div>
      {check('Pay with wallet balance at checkout', walletEnabled, onWallet)}
      {check('Stop checkout when the courier does not deliver to the pincode', blockPincodes, onBlockPincodes, 'Off: the order is accepted even when the courier says no.')}
    </div>
  );
};

export default CashbackSettings;
