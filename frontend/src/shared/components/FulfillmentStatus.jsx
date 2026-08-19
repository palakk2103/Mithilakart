import { Loader2, Package, Truck, Zap, AlertCircle } from 'lucide-react';
import useFulfillmentStatus from '../hooks/useFulfillmentStatus';

/**
 * CR-002 — customer-facing fulfillment status.
 *
 * Every value shown comes from the backend. This component computes no ETA,
 * picks no delivery mode, and contains no hardcoded delivery time. When the
 * backend falls back to courier it reports "Standard Delivery" with no quick
 * promise, because that is what the server says.
 */

/** Presentation only — the state itself is decided server-side. */
const PRESENTATION = {
  searching: { Icon: Loader2, tone: 'text-blue-600 bg-blue-50 border-blue-100', spin: true },
  seller_assigned: { Icon: Package, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  seller_accepted: { Icon: Package, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  warehouse_pending: { Icon: Package, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  warehouse_accepted: { Icon: Package, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  courier_pending: { Icon: Truck, tone: 'text-slate-600 bg-slate-50 border-slate-200' },
  courier_assigned: { Icon: Truck, tone: 'text-slate-600 bg-slate-50 border-slate-200' },
  fulfilled: { Icon: Package, tone: 'text-green-600 bg-green-50 border-green-100' },
  failed: { Icon: AlertCircle, tone: 'text-red-600 bg-red-50 border-red-100' },
  cancelled: { Icon: AlertCircle, tone: 'text-slate-500 bg-slate-50 border-slate-200' },
};

const DEFAULT_PRESENTATION = { Icon: Package, tone: 'text-slate-600 bg-slate-50 border-slate-200' };

function deliveryLabel(fulfillment) {
  if (!fulfillment) return null;
  if (fulfillment.deliveryMode === 'quick') return 'Quick Delivery';
  if (fulfillment.deliveryMode === 'standard') return 'Standard Delivery';
  return null;
}

/**
 * ETA text, straight from server values.
 * Quick orders carry minutes; courier orders do not, and must never be shown
 * a minute-based promise.
 */
function etaText(fulfillment) {
  if (!fulfillment) return null;

  const minutes = fulfillment.estimatedDeliveryMinutes;
  if (fulfillment.deliveryMode === 'quick' && Number.isFinite(Number(minutes)) && Number(minutes) > 0) {
    return `Arriving in ~${Math.round(Number(minutes))} min`;
  }

  if (fulfillment.deliveryMode === 'standard') {
    if (fulfillment.estimatedDeliveryAt) {
      const when = new Date(fulfillment.estimatedDeliveryAt);
      if (!Number.isNaN(when.getTime())) {
        return `Expected by ${when.toLocaleDateString()}`;
      }
    }
    return 'Courier delivery';
  }

  return null;
}

export default function FulfillmentStatus({ orderId, enabled = true, className = '' }) {
  const { fulfillment, loading, error } = useFulfillmentStatus(orderId, { enabled });

  if (!enabled || !orderId) return null;

  if (loading && !fulfillment) {
    return (
      <div className={`flex items-center gap-2 text-[11px] font-bold text-slate-400 ${className}`}>
        <Loader2 size={14} className="animate-spin" />
        <span>Loading delivery status…</span>
      </div>
    );
  }

  // A failed poll shows nothing rather than a misleading placeholder.
  if (error && !fulfillment) return null;
  if (!fulfillment) return null;

  const presentation = PRESENTATION[fulfillment.state] || DEFAULT_PRESENTATION;
  const { Icon, tone, spin } = presentation;

  const mode = deliveryLabel(fulfillment);
  const eta = etaText(fulfillment);
  const message = fulfillment.message || null;

  // A fallback to courier is worth calling out explicitly, since the customer
  // was originally promised quick delivery.
  const downgraded = Number(fulfillment.fallbackLevel) >= 3 && fulfillment.deliveryMode === 'standard';

  return (
    <div className={`rounded-2xl border p-4 ${tone} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={spin ? 'animate-spin mt-0.5' : 'mt-0.5'} strokeWidth={2.5} />

        <div className="flex-1 min-w-0">
          {mode && (
            <p className="text-[13px] font-black tracking-tight flex items-center gap-1.5">
              {fulfillment.deliveryMode === 'quick' && <Zap size={12} strokeWidth={3} />}
              {mode}
            </p>
          )}

          {message && (
            <p className="text-[12px] font-semibold opacity-90 mt-0.5">{message}</p>
          )}

          {eta && (
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mt-1">{eta}</p>
          )}

          {downgraded && (
            <p className="text-[11px] font-semibold opacity-80 mt-2">
              Quick delivery wasn&apos;t available nearby, so this order ships by courier.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
