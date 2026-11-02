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

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={busy}
      style={{ borderColor: primaryHex }}
      className={`w-full py-1 rounded-lg border bg-white text-[11px] font-black uppercase tracking-wide ${primaryText} ${primaryBorder} active:scale-95 transition-transform disabled:opacity-60 ${className}`}
    >
      {text}
    </button>
  );
};

export default React.memo(AddToCartButton);
