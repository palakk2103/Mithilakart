import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Package, Clock, Check, X, MapPin, Volume2, VolumeX, IndianRupee,
} from 'lucide-react';
import { useFulfillmentOffers } from '../../context/FulfillmentOfferContext';

/**
 * CR-002 — the incoming-order popup.
 *
 * Mounted app-wide in SellerLayout, so it appears on whatever page the seller
 * is on. It previously did not exist: the only offer UI lived inside the Orders
 * page, which is why 75% of real offers expired unseen
 * (docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md, Failure 1).
 *
 * Everything shown here comes from the backend offer payload. The countdown is
 * derived from the server's `expiresAt`; expiry is enforced server-side, and the
 * client only stops offering a button that is already doomed.
 */

const REJECT_REASONS = [
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'too_busy', label: 'Too busy' },
  { value: 'closing_soon', label: 'Closing soon' },
  { value: 'cannot_deliver', label: 'Cannot deliver' },
  { value: 'other', label: 'Other reason' },
];

function useCountdown(expiresAt) {
  const compute = () => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Number.isNaN(ms) ? null : Math.max(0, Math.ceil(ms / 1000));
  };

  const [left, setLeft] = useState(compute);

  useEffect(() => {
    setLeft(compute());
    const id = setInterval(() => setLeft(compute()), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return left;
}

export default function IncomingOfferModal() {
  const ctx = useFulfillmentOffers();
  const [showReasons, setShowReasons] = useState(false);

  // One offer at a time: a modal stack would be unusable under load, and the
  // engine only ever holds one live offer per seller in practice.
  const offer = ctx?.offers?.[0] || null;
  const remaining = useCountdown(offer?.expiresAt);

  useEffect(() => { setShowReasons(false); }, [offer?.attemptId]);

  if (!ctx || !offer) return null;

  const busy = ctx.busyId === offer.attemptId;
  const expired = remaining === 0;
  const urgent = remaining !== null && remaining <= 15;

  const totalSeconds = offer.secondsRemaining || 60;
  const progress = remaining === null
    ? 1
    : Math.max(0, Math.min(1, remaining / totalSeconds));

  return (
    // `wait` matters here: without it, switching from one offer to the next
    // leaves the outgoing overlay mounted alongside the incoming one, so the
    // seller briefly sees two stacked full-screen dialogs.
    <AnimatePresence mode="wait">
      <motion.div
        key={offer.attemptId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Incoming order"
      >
        <motion.div
          initial={{ scale: 0.94, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Countdown bar — the clearest signal of urgency. */}
          <div className="h-1.5 bg-slate-100">
            <div
              className={`h-full transition-[width] duration-250 ease-linear ${
                urgent ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-green-600">
                  New order
                </p>
                <h2 className="text-[19px] font-black text-slate-900 tracking-tight truncate">
                  {offer.orderNumber || 'Incoming order'}
                </h2>
              </div>

              {remaining !== null && (
                <div
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[15px] font-black tabular-nums ${
                    urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Clock size={14} strokeWidth={3} />
                  {remaining}s
                </div>
              )}
            </div>

            {/* Autoplay blocked — say so honestly and offer the fix. */}
            {ctx.audioBlocked && (
              <button
                type="button"
                onClick={ctx.enableAudio}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-left"
              >
                <VolumeX size={16} className="shrink-0 text-amber-600" strokeWidth={2.5} />
                <span className="text-[12px] font-bold text-amber-900 leading-tight">
                  Sound is blocked by your browser.
                  <span className="block font-semibold text-amber-700">
                    Tap to turn on the order alert.
                  </span>
                </span>
                <Volume2 size={16} className="ml-auto shrink-0 text-amber-600" strokeWidth={2.5} />
              </button>
            )}

            {/* What to pack. */}
            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {offer.items?.length ? (
                offer.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-slate-400" strokeWidth={2.5} />
                      </div>
                    )}
                    <p className="flex-1 min-w-0 text-[13px] font-bold text-slate-800 truncate">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[13px] font-black text-slate-900 tabular-nums">
                      ×{item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 p-3 text-[13px] font-bold text-slate-700">
                  <Package size={16} strokeWidth={2.5} />
                  {offer.itemCount} item{offer.itemCount === 1 ? '' : 's'}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-bold text-slate-500">
              {offer.orderValue != null && (
                <span className="flex items-center gap-1 text-slate-900">
                  <IndianRupee size={13} strokeWidth={3} />
                  <span className="tabular-nums">{offer.orderValue}</span>
                  {offer.paymentMethod && (
                    <span className="text-slate-400 uppercase ml-0.5">
                      {offer.paymentMethod}
                    </span>
                  )}
                </span>
              )}
              {offer.deliveryArea?.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} strokeWidth={3} />
                  {offer.deliveryArea.city}
                  {offer.deliveryArea.pincode ? ` ${offer.deliveryArea.pincode}` : ''}
                </span>
              )}
              {offer.estimatedDeliveryMinutes != null && (
                <span>Deliver in ~{offer.estimatedDeliveryMinutes} min</span>
              )}
            </div>

            {ctx.error && (
              <p className="text-[12px] font-bold text-red-600">{ctx.error}</p>
            )}

            {expired ? (
              <div className="rounded-xl bg-slate-100 p-3 text-center">
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-wider">
                  Offer expired
                </p>
                <button
                  type="button"
                  onClick={() => ctx.dismiss(offer.attemptId)}
                  className="mt-2 text-[12px] font-bold text-slate-600 underline"
                >
                  Dismiss
                </button>
              </div>
            ) : showReasons ? (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Why are you rejecting?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {REJECT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      disabled={busy}
                      onClick={() => ctx.reject(offer, reason.value)}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[12px] font-bold text-slate-700 disabled:opacity-50 transition-colors"
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowReasons(false)}
                  className="w-full py-2 text-[12px] font-bold text-slate-500"
                >
                  Back
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  data-testid="offer-reject"
                  aria-label="Reject order"
                  disabled={busy}
                  onClick={() => setShowReasons(true)}
                  className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[13px] disabled:opacity-50 transition-colors"
                >
                  <X size={16} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => ctx.accept(offer)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-[14px] disabled:opacity-60 transition-colors"
                >
                  <Check size={17} strokeWidth={3} />
                  {busy ? 'Accepting…' : 'Accept order'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
