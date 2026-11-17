import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';
import { handleImageError } from '../../../../shared/utils/imageUtils';

const stockBadge = (item) => {
  const stock = Number(item.stock);
  if (!Number.isFinite(stock) || item.stock === null) return null;
  if (stock <= 0) return { text: 'Out of stock', cls: 'bg-rose-50 text-rose-700' };
  if (stock <= 20) return { text: `In Stock • ${stock} left`, cls: 'bg-emerald-50 text-emerald-700' };
  return { text: 'In Stock', cls: 'bg-emerald-50 text-emerald-700' };
};

/**
 * One cart / order line. `editable` shows the stepper + delete; the order
 * summary renders the same row read-only so both screens look identical.
 * The + button stops at `maxQuantity` (admin purchase limit or stock) and the
 * limit message appears the moment the shopper reaches it.
 */
const CartLine = ({ item, editable = true, busy = false, limitMessage, onIncrease, onDecrease, onRemove }) => {
  const qty = Number(item.qty || item.quantity) || 1;
  const max = Number(item.maxQuantity) || 0;
  const atMax = max > 0 && qty >= max;
  const badge = stockBadge(item);
  const hasMrp = Number(item.oldPrice) > Number(item.price);

  return (
    <div className="flex gap-3 items-start" data-testid="cart-line">
      {/* Same square frame + same inner padding for every image, whatever its size or ratio. */}
      <div className="w-[76px] h-[76px] rounded-xl bg-white border border-slate-200/80 flex-shrink-0 p-2 flex items-center justify-center overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-bold text-blue-900 leading-snug line-clamp-2">{item.name}</h3>
        {item.brand && (
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{item.brand}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[17px] font-extrabold text-slate-900">{formatPrice(item.price)}</span>
          {hasMrp && <span className="text-[13px] text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>}
          {badge && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.cls}`}>{badge.text}</span>}
        </div>
        {atMax && limitMessage && (
          <p className="text-[11.5px] font-semibold text-amber-700 mt-1" role="status">
            {limitMessage}{max > 0 ? ` — max ${max} per customer` : ''}
          </p>
        )}
      </div>

      {editable ? (
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center rounded-full border border-slate-300 bg-white h-9 select-none">
            <button
              type="button"
              aria-label={qty <= 1 ? 'Remove item' : 'Decrease quantity'}
              disabled={busy}
              onClick={qty <= 1 ? onRemove : onDecrease}
              className="w-9 h-9 flex items-center justify-center text-slate-700 active:scale-90 transition-transform disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-[22px] text-center text-[14px] font-bold text-slate-900" aria-live="polite">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || atMax}
              onClick={onIncrease}
              className="w-9 h-9 flex items-center justify-center text-slate-700 active:scale-90 transition-transform disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Remove item"
            onClick={onRemove}
            className="w-9 h-9 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 active:scale-90 transition-transform"
          >
            <Trash2 size={19} />
          </button>
        </div>
      ) : (
        <span className="text-[13px] font-semibold text-slate-500 flex-shrink-0">Qty: {qty}</span>
      )}
    </div>
  );
};

export default CartLine;
