import React from 'react';
import { FileText, Zap } from 'lucide-react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';

const Row = ({ label, hint, children, tone = 'default' }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-slate-700 leading-tight">{label}</p>
      {hint && <p className="text-[11px] font-medium text-blue-700 leading-tight mt-px">{hint}</p>}
    </div>
    <div className={`text-[13px] font-semibold text-right whitespace-nowrap leading-tight ${tone === 'save' ? 'text-emerald-600' : tone === 'free' ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
      {children}
    </div>
  </div>
);

/**
 * "Order Details" bill used by the cart, the order summary and the payment step,
 * so the three screens can never disagree. Every number comes from `bill`
 * (server-priced); fee rules and thresholds are admin settings, never hard-coded.
 */
const BillSummary = ({ bill, title = 'Order Details', showSavings = true, bare = false, className = '' }) => {
  if (!bill) return null;
  const savings = bill.productDiscount + bill.couponDiscount
    + Math.max(0, bill.handlingFeeOriginal - bill.handlingFee)
    + Math.max(0, bill.deliveryChargeOriginal - bill.deliveryCharge);

  const handlingHint = bill.handlingFeeTier
    ? `(${bill.handlingFeeTier.discountPercent}% off on orders above ${formatPrice(bill.handlingFeeTier.minSubtotal)})`
    : bill.handlingFeeNextTier
      ? `(${bill.handlingFeeNextTier.discountPercent}% off on orders above ${formatPrice(bill.handlingFeeNextTier.minSubtotal)})`
      : null;
  const deliveryHint = bill.freeDeliveryThreshold > 0
    ? `(Free delivery on orders above ${formatPrice(bill.freeDeliveryThreshold)})`
    : null;

  return (
    <section className={`${bare ? '' : 'cd-card'} ${className}`} aria-label={title}>
      {!bare && (
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-blue-700" />
          <h2 className="text-[15px] font-bold cd-heading">{title}</h2>
        </div>
      )}

      <div className="space-y-1.5">
        <Row label={`Total MRP (${bill.itemCount} ${bill.itemCount === 1 ? 'Item' : 'Items'})`}>
          {formatPrice(bill.mrpTotal)}
        </Row>
        {bill.productDiscount > 0 && (
          <Row label="Product Discount" tone="save">-{formatPrice(bill.productDiscount)}</Row>
        )}
        {bill.couponDiscount > 0 && (
          <Row label="Coupon Discount" tone="save">-{formatPrice(bill.couponDiscount)}</Row>
        )}

        {(bill.handlingFeeOriginal > 0 || bill.handlingFee > 0) && (
          <Row label="Handling Fee" hint={handlingHint}>
            {bill.handlingFee < bill.handlingFeeOriginal && (
              <span className="mr-1.5 text-slate-400 line-through font-medium">{formatPrice(bill.handlingFeeOriginal)}</span>
            )}
            {bill.handlingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatPrice(bill.handlingFee)}
          </Row>
        )}

        <Row label="Delivery Fee" hint={deliveryHint} tone={bill.deliveryCharge === 0 ? 'free' : 'default'}>
          {bill.deliveryCharge === 0 ? (
            <>
              {bill.deliveryChargeOriginal > 0 && (
                <span className="mr-1.5 text-slate-400 line-through font-medium">{formatPrice(bill.deliveryChargeOriginal)}</span>
              )}
              FREE
            </>
          ) : formatPrice(bill.deliveryCharge)}
        </Row>

        {bill.surgeCharge > 0 && (
          <Row label={bill.surge?.label || 'Surge charge'} hint={bill.surge?.note || null}>
            <span className="text-orange-700">{formatPrice(bill.surgeCharge)}</span>
          </Row>
        )}

        {bill.tipAmount > 0 && <Row label="Delivery Partner Tip" hint="(100% goes to your delivery partner)">{formatPrice(bill.tipAmount)}</Row>}
        {bill.platformFee > 0 && <Row label="Platform Fee">{formatPrice(bill.platformFee)}</Row>}
        {bill.packagingFee > 0 && <Row label="Packaging Fee">{formatPrice(bill.packagingFee)}</Row>}
        {bill.codHandlingFee > 0 && <Row label="Cash on Delivery Fee">{formatPrice(bill.codHandlingFee)}</Row>}
        {bill.tax > 0 && <Row label="Taxes (GST)">{formatPrice(bill.tax)}</Row>}
      </div>

      <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
        <span className="text-[15px] font-bold text-slate-900">Total Payable</span>
        <span className="text-[18px] font-extrabold text-slate-900" data-testid="total-payable">{formatPrice(bill.total, bill.total % 1 !== 0)}</span>
      </div>

      {showSavings && savings > 0 && (
        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 flex items-center justify-center gap-1.5">
          <Zap size={13} className="text-emerald-700 fill-emerald-700" />
          <p className="text-[12px] font-bold text-emerald-800">You are saving {formatPrice(savings)} on this order</p>
        </div>
      )}
    </section>
  );
};

export default BillSummary;
