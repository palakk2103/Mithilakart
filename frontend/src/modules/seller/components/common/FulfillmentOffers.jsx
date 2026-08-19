import { useEffect, useState } from 'react';
import { Clock, Check, X, Package, Loader2 } from 'lucide-react';
import { useFulfillmentOffers } from '../../context/FulfillmentOfferContext';

/**
 * CR-002 — inline list of live offers on the Orders page.
 *
 * This is now a VIEW ONLY. It used to own the socket subscription and the
 * offer fetch, which made the Orders page the single point where an offer could
 * be seen — the root cause of Failure 1 in
 * docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md. The subscription now lives in
 * FulfillmentOfferProvider (mounted app-wide), and this panel reads from it, so
 * there is exactly one socket listener, one poll, and one ringtone regardless of
 * how many components display offers.
 *
 * The blocking popup (IncomingOfferModal) is the primary alert; this panel is
 * the at-a-glance list for a seller who is already looking at their orders.
 */

const REJECT_REASONS = [
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'too_busy', label: 'Too busy' },
  { value: 'closing_soon', label: 'Closing soon' },
  { value: 'cannot_deliver', label: 'Cannot deliver' },
];

function secondsLeft(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isNaN(ms) ? null : Math.max(0, Math.ceil(ms / 1000));
}

export default function FulfillmentOffers({ onAccepted }) {
  const ctx = useFulfillmentOffers();
  const [, forceTick] = useState(0);

  const offers = ctx?.offers ?? [];

  // Drives the countdown display only — expiry is enforced server-side.
  useEffect(() => {
    if (!offers.length) return undefined;
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [offers.length]);

  if (!ctx) return null;

  if (ctx.loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 p-4">
        <Loader2 size={14} className="animate-spin" />
        <span>Checking for new orders…</span>
      </div>
    );
  }

  if (!offers.length) return null;

  const respond = async (offer, action, reason) => {
    const result = action === 'accept'
      ? await ctx.accept(offer)
      : await ctx.reject(offer, reason);

    if (action === 'accept' && result?.ok) onAccepted?.(offer.orderId);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
        New order {offers.length > 1 ? 'offers' : 'offer'}
      </h3>

      {ctx.error && (
        <p className="text-[12px] font-semibold text-red-600">{ctx.error}</p>
      )}

      {offers.map((offer) => {
        const remaining = secondsLeft(offer.expiresAt);
        const urgent = remaining !== null && remaining <= 15;
        const busy = ctx.busyId === offer.attemptId;

        return (
          <div
            key={offer.attemptId}
            className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Package size={14} strokeWidth={2.5} />
                  {offer.orderNumber || 'New order'}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {offer.itemCount} item{offer.itemCount === 1 ? '' : 's'}
                  {offer.deliveryArea?.pincode ? ` · ${offer.deliveryArea.pincode}` : ''}
                </p>
                {offer.estimatedDeliveryMinutes != null && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">
                    Promised delivery ~{offer.estimatedDeliveryMinutes} min
                  </p>
                )}
              </div>

              {remaining !== null && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black tabular-nums ${
                    urgent ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <Clock size={12} strokeWidth={3} />
                  {remaining}s
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || remaining === 0}
                onClick={() => respond(offer, 'accept')}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white rounded-xl py-2.5 text-[12px] font-black disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                Accept
              </button>

              <select
                disabled={busy || remaining === 0}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) respond(offer, 'reject', e.target.value);
                }}
                className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-2.5 px-2 text-[12px] font-black disabled:opacity-50"
              >
                <option value="" disabled>Reject…</option>
                {REJECT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              <button
                type="button"
                aria-label="Reject order"
                disabled={busy || remaining === 0}
                onClick={() => respond(offer, 'reject', 'other')}
                className="px-3 bg-slate-100 text-slate-500 rounded-xl disabled:opacity-50"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
