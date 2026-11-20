import React from 'react';
import { Truck } from 'lucide-react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';

/**
 * "Free Delivery on orders above ₹150! You are just ₹80 away from Free
 * Delivery" with a thin progress bar. Threshold and the amount left both come
 * from the server-priced bill.
 */
const FreeDeliveryBar = ({ bill, eta }) => {
  if (!bill || !(bill.freeDeliveryThreshold > 0)) return null;
  const reached = bill.amountToFreeDelivery <= 0;
  const progress = Math.min(100, Math.max(0, (bill.subtotal - bill.couponDiscount) / bill.freeDeliveryThreshold * 100));

  return (
    <div className="rounded-xl bg-gradient-to-r from-lime-100 to-lime-50 border border-lime-200/70 px-3 py-2 flex items-center gap-2.5">
      <Truck size={30} className="text-emerald-700 flex-shrink-0" strokeWidth={1.8} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 leading-tight">
          {reached ? "You've unlocked Free Delivery!" : `Free Delivery on orders above ${formatPrice(bill.freeDeliveryThreshold)}!`}
        </p>
        <p className="text-[11.5px] font-medium text-slate-600 leading-tight mt-0.5">
          {reached
            ? (eta ? `Arriving ${eta}` : 'Delivery fee waived on this order')
            : <>You are just <span className="font-bold text-slate-900">{formatPrice(bill.amountToFreeDelivery)}</span> away from Free Delivery</>}
        </p>
        <div className="h-1 rounded-full bg-white/80 mt-1.5 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default FreeDeliveryBar;
