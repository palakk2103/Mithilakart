import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import useTabTheme from '../../../../shared/hooks/useTabTheme';
import { addProductToCart } from '../../utils/cartUtils';

/**
 * Shared "ADD" button for product cards that only link to the product page.
 *
 * variant:
 *  - "outline" (default): full-width outlined ADD button, quick-commerce style
 *  - "solid": full-width filled ADD button
 *  - "icon": small round "+" button (for tight cards)
 *
 * `product` may be any of the card shapes used in the app; only the id (or
 * productId / listingId) is required for the cart call.
 */
/**
 * Presentational Add button shared by every product card in all four tabs.
 * Outlined style with a subtle inner hairline, coloured from the active tab theme;
 * fixed height/typography so all cards align. Behaviour (cart calls) stays with the caller.
 */
export const ADD_BUTTON_CLASS =
  'w-full h-8 px-3 inline-flex items-center justify-center rounded-lg whitespace-nowrap ' +
  'border-[1.5px] bg-white text-[12px] md:text-[13px] font-bold leading-none ' +
  'active:scale-[0.97] transition-all duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

export const AddButton = ({ onClick, disabled = false, loading = false, label, className = '', style, ...rest }) => {
  const { t } = useTranslation();
  const { primaryHex } = useTabTheme();
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`${ADD_BUTTON_CLASS} ${className}`}
      style={{
        borderColor: primaryHex,
        color: primaryHex,
        '--tw-ring-color': primaryHex,
        backgroundColor: hover && !disabled && !loading ? `${primaryHex}14` : '#fff',
        boxShadow: `inset 0 0 0 2px #fff, inset 0 0 0 3px ${primaryHex}4D`,
        ...style,
      }}
      {...rest}
    >
      {label || t('auto.add', { defaultValue: 'Add' })}
    </button>
  );
};

const AddToCartButton = ({ product, variant = 'outline', className = '', commerceFlow, label }) => {
  const { t } = useTranslation();
  const { primaryBg, primaryText, primaryBorder, primaryHex } = useTabTheme();
  const [busy, setBusy] = useState(false);

  const handleAdd = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy || !product) return;
    setBusy(true);
    try {
      const raw = product.product && typeof product.product === 'object' ? product.product : {};
      await addProductToCart({
        ...raw,
        ...product,
        id: product.productId || product.id || raw._id || raw.id,
        productId: product.productId || raw._id || raw.id || product.id,
        listingId: product.listingId || raw.listingId,
        marketplaceTab: product.marketplaceTab || raw.marketplaceTab,
        price: product.price ?? raw.price,
        name: product.name || product.title || raw.name,
        image: product.image || product.img || raw.image,
      }, 1, commerceFlow || product.commerceFlow || undefined);
      toast.success(t('common.addedToCart', { name: product.name || product.title || '' }));
    } catch (err) {
      toast.error(err?.message || t('common.couldNotAddToCart'));
    } finally {
      setBusy(false);
    }
  }, [product, busy, commerceFlow, t]);

  const text = label || t('auto.add', { defaultValue: 'ADD' });

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        aria-label={text}
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${primaryBg} shadow-sm active:scale-90 transition-transform disabled:opacity-60 flex-shrink-0 ${className}`}
      >
        <Plus size={15} strokeWidth={3} />
      </button>
    );
  }

  if (variant === 'solid') {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        className={`w-full py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide text-white ${primaryBg} active:scale-95 transition-transform disabled:opacity-60 ${className}`}
      >
        {text}
      </button>
    );
  }

  return <AddButton onClick={handleAdd} loading={busy} label={label} className={className} />;
};

export default React.memo(AddToCartButton);
