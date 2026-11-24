import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Gift, ChevronRight, X, Lock, CheckCircle2, RotateCcw, ShieldCheck, Star, BadgePercent } from 'lucide-react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';
import { getCouponOffers } from '../../services/cartApi';

/** Bottom sheet used for the tip and the offers list. */
export const Sheet = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[1100] bg-black/55 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
    <div className="bg-white w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-4 pb-[max(16px,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-slate-500"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

const TIPS = [10, 20, 30, 50];

export const TipSheet = ({ value, accentHex, onSave, onClose }) => {
  const [tip, setTip] = useState(value || 0);
  const [custom, setCustom] = useState('');
  const chosen = custom !== '' ? Math.min(500, Math.max(0, Math.round(Number(custom) || 0))) : tip;
  return (
    <Sheet title="Reward Your Delivery Hero" onClose={onClose}>
      <p className="text-[12.5px] text-slate-600 mb-3">100% of your tip goes to your delivery partner. It is added to your bill.</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {TIPS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTip(t === tip && custom === '' ? 0 : t); setCustom(''); }}
            aria-pressed={custom === '' && tip === t}
            className="h-11 rounded-xl border-2 text-[14px] font-bold"
            style={custom === '' && tip === t ? { borderColor: accentHex, background: `${accentHex}18`, color: '#0f172a' } : { borderColor: '#e2e8f0', color: '#334155' }}
          >
            ₹{t}
          </button>
        ))}
      </div>
      <label className="block text-[11.5px] font-semibold text-slate-500 mb-1" htmlFor="tip-custom">Other amount (₹0 – ₹500)</label>
      <input
        id="tip-custom"
        type="number"
        inputMode="numeric"
        min="0"
        max="500"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Enter amount"
        className="w-full h-11 border border-slate-300 rounded-xl px-3 text-[14px] font-semibold focus:outline-none focus:border-amber-500"
      />
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={() => onSave(0)} className="h-11 px-5 rounded-full border border-slate-300 text-[13.5px] font-bold text-slate-700">No tip</button>
        <button type="button" onClick={() => onSave(chosen)} className="flex-1 h-11 rounded-full text-white text-[14px] font-bold" style={{ background: accentHex }}>
          {chosen > 0 ? `Add ₹${chosen} tip` : 'Continue without tip'}
        </button>
      </div>
    </Sheet>
  );
};

/** "Reward Your Delivery Hero" + "Vouchers & Offers" cards (texts from admin). */
export const ActionCards = ({ content, tip, onTip, onOffers, couponApplied }) => {
  const hero = content?.deliveryHero || {};
  const vouchers = content?.vouchers || {};
  if (hero.enabled === false && vouchers.enabled === false) return null;
  const card = 'cd-card flex items-center gap-2 text-left min-h-[52px]';
  return (
    <div className="grid grid-cols-2 gap-2">
      {hero.enabled !== false && (
        <button type="button" onClick={onTip} className={card}>
          <Trophy size={24} className="text-amber-500 flex-shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-[12.5px] font-bold cd-heading leading-tight">{hero.title}</span>
            <span className="block text-[10.5px] text-slate-500 leading-tight mt-0.5">{tip > 0 ? `₹${tip} tip added` : hero.subtitle}</span>
          </span>
          <ChevronRight size={15} className="text-slate-500 flex-shrink-0" />
        </button>
      )}
      {vouchers.enabled !== false && (
        <button type="button" onClick={onOffers} className={card}>
          <Gift size={24} className="text-orange-500 flex-shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-[12.5px] font-bold cd-heading leading-tight">{vouchers.title}</span>
            <span className="block text-[10.5px] text-slate-500 leading-tight mt-0.5">{couponApplied ? `${couponApplied} applied` : vouchers.subtitle}</span>
          </span>
          <ChevronRight size={15} className="text-slate-500 flex-shrink-0" />
        </button>
      )}
    </div>
  );
};

/**
 * CART-3: every coupon as a row — tile, "Save ₹50 with ADVANTAGE50", an orange
 * "Shop for ₹877 more to apply" line, and Apply / Locked / Remove on the right.
 */
export const CouponOffers = ({ subtotal, appliedCode, accentHex, onApply, onRemove, emptyText = 'No offers available right now.' }) => {
  const [offers, setOffers] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOffers(null);
    setFailed(false);
    getCouponOffers(Math.round(subtotal || 0))
      .then((list) => { if (!cancelled) setOffers(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) { setOffers([]); setFailed(true); } });
    return () => { cancelled = true; };
  }, [subtotal]);

  if (offers === null) return <div className="h-14 rounded-lg bg-slate-100 animate-pulse" aria-busy />;
  if (!offers.length) return <p className="text-[12.5px] text-slate-500 py-1">{failed ? 'Could not load offers. Please try again.' : emptyText}</p>;

  return (
    <ul className="divide-y divide-dashed divide-slate-200">
      {offers.map((o) => {
        const applied = appliedCode === o.code;
        const open = o.eligible || applied;
        return (
          <li key={o.code} className="py-2 first:pt-0 last:pb-0 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              {open ? <BadgePercent size={20} className="text-emerald-600" /> : <Lock size={16} className="text-slate-400" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-slate-900 leading-tight">{o.title}</p>
              <p className={`text-[11.5px] leading-tight mt-0.5 ${open ? 'text-emerald-700 font-semibold' : 'text-orange-600 font-medium'}`}>
                {applied ? 'Applied on this order' : o.eligible ? (o.description || 'Eligible on this order') : o.lockedReason}
              </p>
            </div>
            {applied ? (
              <button type="button" onClick={onRemove} className="h-9 px-3 rounded-lg border border-slate-300 text-[12px] font-bold text-slate-700 flex-shrink-0">Remove</button>
            ) : o.eligible ? (
              <button type="button" onClick={() => onApply(o.code)} className="h-9 px-4 rounded-lg border-2 text-[13px] font-bold flex-shrink-0 active:scale-95 bg-white" style={{ borderColor: accentHex, color: accentHex }}>Apply</button>
            ) : (
              <span className="h-9 px-3 rounded-lg bg-slate-100 text-slate-400 text-[12px] font-bold flex items-center flex-shrink-0">Locked</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const AppliedStrip = ({ message }) => (message ? (
  <p className="rounded-lg bg-emerald-50 text-emerald-700 text-[12.5px] font-semibold px-2.5 py-1.5 flex items-center gap-2" role="status">
    <CheckCircle2 size={15} /> {message}
  </p>
) : null);

/** Best coupon for this cart, one tap to apply (shown under "Apply Coupon" until one is applied). */
export const BestOffer = ({ subtotal, accentHex, onApply, onMore }) => {
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    let cancelled = false;
    getCouponOffers(Math.round(subtotal || 0))
      .then((list) => { if (!cancelled) setOffers(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setOffers([]); });
    return () => { cancelled = true; };
  }, [subtotal]);
  const best = offers[0];
  if (!best) return null;
  return (
    <div data-testid="best-offer" className="mt-2.5 rounded-lg border border-dashed px-3 py-2 flex items-center gap-2.5" style={{ borderColor: `${accentHex}88`, background: `${accentHex}0f` }}>
      <BadgePercent size={20} className="text-emerald-600 flex-shrink-0" />
      <p className="flex-1 min-w-0 text-[13px] font-bold text-slate-900 leading-tight">
        Best offer: {best.title}
        {!best.eligible && <span className="block text-[12px] font-medium text-orange-600 mt-0.5">{best.lockedReason}</span>}
      </p>
      {best.eligible
        ? <button type="button" onClick={() => onApply(best.code)} className="h-9 px-3 text-[13px] font-bold flex-shrink-0" style={{ color: accentHex }}>Apply</button>
        : <button type="button" onClick={onMore} className="h-9 px-3 text-[13px] font-bold flex-shrink-0" style={{ color: accentHex }}>All offers</button>}
    </div>
  );
};

/** Return & Exchange / Cancellation box; the lines are edited in admin. */
export const PolicyBox = ({ content, to }) => {
  const points = (content?.policyPoints || []).filter(Boolean);
  return (
    <Link to={to} className="block bg-slate-100/80 border border-slate-200/70" style={{ borderRadius: 'var(--cd-radius, 12px)', padding: 'var(--cd-pad, 10px)' }}>
      <div className="flex items-center gap-2 mb-1">
        <RotateCcw size={18} className="text-blue-700 flex-shrink-0" />
        <p className="flex-1 text-[13px] font-bold cd-heading leading-tight">{content?.policyTitle || 'Return & Exchange / Cancellation Policy'}</p>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
      {points.length > 0 && (
        <ul className="list-disc pl-7 pr-1 space-y-px text-[11px] text-slate-600 leading-snug">
          {points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
    </Link>
  );
};

/** Trust line; the star rating is added only when the admin has entered the real figure. */
export const TrustBlock = ({ content }) => {
  const trust = content?.trust;
  const rating = Number(trust?.rating);
  if (!trust || trust.enabled === false) return null;
  return (
    <section className="cd-card flex items-center gap-2.5" data-testid="trust-block">
      <ShieldCheck size={26} className="text-emerald-600 flex-shrink-0" />
      <p className="flex-1 text-[14px] font-bold cd-heading leading-tight">{trust.title}</p>
      {rating > 0 && <div className="text-right flex-shrink-0">
        <div className="flex justify-end gap-px" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />)}
        </div>
        <p className="text-[12px] font-bold text-slate-800">{rating}/5{trust.reviewsLabel ? ` (${trust.reviewsLabel})` : ''}</p>
      </div>}
    </section>
  );
};

/** Cashback strip, written by the server from the admin's live cashback rules; nothing shows when none is running. */
export const CashbackBanner = ({ cashback: b, accentHex, onMore }) => {
  if (!b?.enabled || !b.title) return null;
  return (
    <div className="rounded-lg px-2.5 py-2 flex items-center gap-2.5" style={{ background: `${accentHex}22` }}>
      <Gift size={24} style={{ color: accentHex }} className="flex-shrink-0" />
      <p className="flex-1 text-[12.5px] font-bold text-slate-900 leading-tight">{b.title}</p>
      {b.rules?.length > 0 && (
        <button type="button" onClick={onMore} className="text-[12px] font-bold flex items-center min-h-[36px] flex-shrink-0" style={{ color: accentHex }}>
          {b.linkText || 'Know More'} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
};
