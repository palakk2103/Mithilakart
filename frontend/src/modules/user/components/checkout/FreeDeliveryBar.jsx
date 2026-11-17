import React from 'react';
import { Truck } from 'lucide-react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';

/**
 * "Free Delivery on orders above ₹150 — you are just ₹80 away", with a progress bar.
 * Threshold and the amount left both come from the server-priced bill.
 */
const FreeDeliveryBar = ({ bill, eta }) => {
  if (!bill || !(bill.freeDeliveryThreshold > 0)) return null;
  const reached = bill.amountToFreeDelivery <= 0;
  const progress = Math.min(100, Math.max(0, (bill.subtotal - bill.couponDiscount) / bill.freeDeliveryThreshold * 100));

  return (
    <div className="rounded-2xl bg-lime-50 border border-lime-200/70 px-3.5 py-3 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-white border border-lime-200 flex items-center justify-center flex-shrink-0">
        <Truck size={22} className="text-emerald-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-slate-900 leading-snug">
          {reached
            ? `You've unlocked free delivery!`
            : `Free Delivery on orders above ${formatPrice(bill.freeDeliveryThreshold)}!`}
        </p>
        <p className="text-[12px] font-medium text-slate-600 leading-snug mt-0.5">
          {reached
            ? (eta ? `Arriving ${eta}` : 'Delivery fee waived on this order')
            : <>Add items worth <span className="font-bold text-slate-900">{formatPrice(bill.amountToFreeDelivery)}</span> more for free delivery</>}
        </p>
        <div className="h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default FreeDeliveryBar;
