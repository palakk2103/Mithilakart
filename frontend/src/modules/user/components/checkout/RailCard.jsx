import React from 'react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';
import { handleImageError } from '../../../../shared/utils/imageUtils';
import CartQtyControl from '../common/CartQtyControl';

const TAB_LABEL = { mithilakart: 'Mithilakart', mithilak: 'Mithilak', quick_shop: 'Quick Shop', groceries_fresh: 'Fresh & Groceries' };

/**
 * Product card used by the cart rails, their "View All" pages and the wishlist:
 * image, name, price, and "Add" that turns into − qty + once it is in the cart.
 * `currentTab` shows a small note when the product sells in another tab's cart.
 */
const RailCard = ({ item, onOpen, currentTab, className = 'w-[132px]', children }) => {
  const mrp = Number(item.mrp || item.oldPrice) || 0;
  const price = Number(item.price) || 0;
  const off = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const out = item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0;
  const otherTab = currentTab && item.marketplaceTab && item.marketplaceTab !== currentTab ? TAB_LABEL[item.marketplaceTab] : null;

  return (
    <article data-testid="rail-card" className={`flex-shrink-0 bg-white rounded-xl border border-slate-200/80 p-2 relative flex flex-col ${className}`}>
      {children}
      <button type="button" onClick={() => onOpen(item)} className="block w-full text-left flex-1" aria-label={item.name}>
        <div className="aspect-square w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative">
          <img src={item.image} alt="" className={`max-w-full max-h-full object-contain ${out ? 'opacity-50 grayscale' : ''}`} loading="lazy" decoding="async" onError={handleImageError} />
          {off > 0 && <span className="absolute left-1 top-1 rounded bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">{off}% OFF</span>}
        </div>
        <p className="text-[12.5px] font-semibold text-slate-800 leading-[1.25] line-clamp-2 min-h-[32px] mt-1.5">{item.name}</p>
        <p className="flex items-baseline gap-1.5 mt-1">
          <span className="text-[14px] font-extrabold text-slate-900 leading-none">{formatPrice(price)}</span>
          {off > 0 && <span className="text-[11px] text-slate-400 line-through leading-none">{formatPrice(mrp)}</span>}
        </p>
        {otherTab && <p className="text-[10.5px] font-semibold text-slate-500 mt-1">Sold in {otherTab}</p>}
      </button>
      <div className="mt-2">
        {out
          ? <span className="block text-center text-[12px] font-bold text-rose-600 bg-rose-50 rounded-lg py-2">Out of stock</span>
          : <CartQtyControl product={item} />}
      </div>
    </article>
  );
};

export default RailCard;
