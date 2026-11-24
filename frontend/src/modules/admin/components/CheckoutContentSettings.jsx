import React from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

const SOURCE_LABELS = {
  recently_viewed: 'Recently viewed (this device)',
  bestsellers: 'Bestsellers (last 30 days)',
  highly_ordered: 'Highly ordered (last 90 days)',
  price_drops: 'Price drops (biggest % off)',
  new_arrivals: 'New arrivals',
  order_again: 'Customer past orders',
  missed: 'Past orders not in cart',
  brands_in_trend: 'Brands in trend',
  recommended: 'Same categories as the cart',
  wishlist: 'Customer wishlist',
  budget: 'Budget picks (up to a price)',
  manual: 'Hand-picked product ids',
};

const label = 'text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1';
const input = 'w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3.5 text-sm font-bold outline-none';
const h3 = 'text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1';

const Check = ({ checked, onChange, children }) => (
  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
    {children}
  </label>
);

/** One rail row: on/off, title, order arrows, and (for manual / budget) its extra field. */
const RailRow = ({ rail, index, count, onChange, onMove, nested = false }) => (
  <div className={`bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 space-y-2 ${nested ? 'ml-6' : ''}`}>
    <div className="flex flex-wrap items-center gap-3">
      <Check checked={rail.enabled !== false} onChange={(v) => onChange({ enabled: v })}>Show</Check>
      <input value={rail.title} maxLength={60} aria-label="Rail title" onChange={(e) => onChange({ title: e.target.value })} className={`${input} flex-1 min-w-[160px]`} />
      <select value={rail.source || ''} aria-label="Rail source" onChange={(e) => onChange({ source: e.target.value })} className={`${input} w-auto`}>
        {Object.entries(SOURCE_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      <div className="flex gap-1">
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-30"><ArrowUp size={14} /></button>
        <button type="button" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)} className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-30"><ArrowDown size={14} /></button>
      </div>
    </div>
    {rail.source === 'budget' && (
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">Show products up to ₹
        <input type="number" min="0" value={rail.maxPrice ?? 99} onChange={(e) => onChange({ maxPrice: Number(e.target.value) || 0 })} className="w-24 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold" />
      </label>
    )}
    {rail.source === 'manual' && (
      <div>
        <span className={label}>Product ids, one per line (leave empty to use the fallback)</span>
        <textarea
          rows={2}
          value={(rail.productIds || []).join('\n')}
          onChange={(e) => onChange({ productIds: e.target.value.split(/[\s,]+/).filter(Boolean) })}
          className={`${input} font-mono text-xs`}
        />
      </div>
    )}
  </div>
);

const move = (list, i, d) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export const railsForSave = (rails) => ({
  itemsPerRail: Math.min(20, Math.max(3, Math.round(Number(rails.itemsPerRail) || 10))),
  rails: rails.rails.map((r) => ({
    ...r,
    title: String(r.title || '').trim() || 'Products',
    ...(r.subTabs ? { subTabs: r.subTabs.map((t) => ({ ...t, title: String(t.title || '').trim() || 'Products' })) } : {}),
  })),
});

export const contentForSave = (c) => ({
  ...c,
  trust: { ...c.trust, rating: c.trust.rating === '' || c.trust.rating == null ? null : Number(c.trust.rating) },
  policyPoints: (c.policyPoints || []).map((p) => String(p).trim()).filter(Boolean),
});

/**
 * CART-1/2/3 admin: cart recommendation rails (show/hide, order, titles,
 * sources) and the texts on the summary / payment steps.
 */
const CheckoutContentSettings = ({ rails, content, onRails, onContent }) => {
  const setRail = (i, patch) => onRails({ ...rails, rails: rails.rails.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const setSub = (i, k, patch) => setRail(i, { subTabs: rails.rails[i].subTabs.map((t, j) => (j === k ? { ...t, ...patch } : t)) });
  const setContent = (key, patch) => onContent({ ...content, [key]: { ...content[key], ...patch } });

  return (
    <div className="space-y-8">
      <div>
        <h3 className={h3}>Cart page — product rails</h3>
        <p className="text-xs text-slate-500 mb-4">Shown under the cart items for the customer&apos;s tab. A rail with nothing to show is skipped, and a product never appears twice.</p>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-3">Products per rail
          <input type="number" min="3" max="20" value={rails.itemsPerRail} onChange={(e) => onRails({ ...rails, itemsPerRail: e.target.value })} className="w-20 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold" />
        </label>
        <div className="space-y-3">
          {rails.rails.map((rail, i) => (
            <div key={rail.key} className="space-y-2">
              <RailRow rail={rail} index={i} count={rails.rails.length} onChange={(p) => setRail(i, p)} onMove={(d) => onRails({ ...rails, rails: move(rails.rails, i, d) })} />
              {(rail.subTabs || []).map((sub, k) => (
                <RailRow key={sub.key} nested rail={sub} index={k} count={rail.subTabs.length} onChange={(p) => setSub(i, k, p)} onMove={(d) => setRail(i, { subTabs: move(rail.subTabs, k, d) })} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={h3}>Order summary cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['deliveryHero', 'Delivery tip card'], ['vouchers', 'Vouchers & offers card']].map(([key, name]) => (
            <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
              <Check checked={content[key].enabled !== false} onChange={(v) => setContent(key, { enabled: v })}>{name}</Check>
              <input aria-label={`${name} title`} value={content[key].title} onChange={(e) => setContent(key, { title: e.target.value })} className={input} />
              <input aria-label={`${name} subtitle`} value={content[key].subtitle} onChange={(e) => setContent(key, { subtitle: e.target.value })} className={input} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={h3}>Return &amp; cancellation box</h3>
        <input aria-label="Policy title" value={content.policyTitle} onChange={(e) => onContent({ ...content, policyTitle: e.target.value })} className={`${input} mb-3`} />
        <div className="space-y-2">
          {content.policyPoints.map((p, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="flex gap-2">
              <input aria-label={`Policy line ${i + 1}`} value={p} onChange={(e) => onContent({ ...content, policyPoints: content.policyPoints.map((x, j) => (j === i ? e.target.value : x)) })} className={input} />
              <button type="button" aria-label="Remove line" onClick={() => onContent({ ...content, policyPoints: content.policyPoints.filter((_, j) => j !== i) })} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => onContent({ ...content, policyPoints: [...content.policyPoints, ''] })} className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider"><Plus size={14} /> Add line</button>
        </div>
      </div>

      <div>
        <h3 className={h3}>Trust block</h3>
        <p className="text-xs text-slate-500 mb-3">The stars appear only when you enter a rating — enter the real figure from your reviews.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><span className={label}>Heading</span><input value={content.trust.title} onChange={(e) => setContent('trust', { title: e.target.value })} className={input} /></div>
          <div><span className={label}>Average rating (0–5)</span><input type="number" min="0" max="5" step="0.1" value={content.trust.rating ?? ''} onChange={(e) => setContent('trust', { rating: e.target.value })} className={input} /></div>
          <div><span className={label}>Reviews label, e.g. 1L+ Reviews</span><input value={content.trust.reviewsLabel} onChange={(e) => setContent('trust', { reviewsLabel: e.target.value })} className={input} /></div>
        </div>
      </div>

      <div>
        <h3 className={h3}>Payment page — bank / app offers</h3>
        <p className="text-xs text-slate-500 mb-3">Text only, for offers run by a bank or app. Your own cashback is set in the Cashback section.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['upi', 'UPI'], ['phonepe', 'PhonePe'], ['card', 'Card'], ['cod', 'Cash on Delivery']].map(([key, name]) => (
            <div key={key}>
              <span className={label}>{name} offer line</span>
              <input value={content.paymentOffers[key] || ''} onChange={(e) => setContent('paymentOffers', { [key]: e.target.value })} className={input} placeholder="Leave empty for none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckoutContentSettings;
