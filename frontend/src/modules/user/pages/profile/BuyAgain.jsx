import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getAlreadyBought } from '../../services/userApi';
import { addProductToCart } from '../../utils/cartUtils';
import { isAuthenticated } from '../../../../shared/api/tokenStorage';
import { handleImageError } from '../../../../shared/utils/imageUtils';

/** Customer's previously purchased products (existing /users/me/you-buy/already-bought API). */
const BuyAgain = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = isAuthenticated('customer');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(loggedIn);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loggedIn) return undefined;
    let cancelled = false;
    getAlreadyBought({ page: 1, limit: 24 })
      .then((data) => { if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loggedIn]);

  const buyAgain = async (it) => {
    if (!it.inStock) { toast.error(t('common.outOfStockToast')); return; }
    try {
      await addProductToCart({
        productId: it.productId,
        listingId: it.listingId,
        variantId: it.variantId,
        marketplaceTab: it.marketplaceTab || 'mithilakart',
      }, 1, it.commerceFlow || undefined);
      toast.success(t('common.addedToCart', { name: it.title }));
    } catch (err) {
      toast.error(err?.message || t('common.couldNotAddToCart'));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EE] pb-24" data-testid="buy-again-page">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#FFF8EE] border-b border-[#EADCC9]">
        <button type="button" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={22} /></button>
        <h1 className="text-[16px] font-black text-[#3F2A20]">{t('common.buyAgain', { defaultValue: 'Buy Again' })}</h1>
      </div>
      <div className="p-3">
        {!loggedIn ? (
          <p className="text-center text-sm text-[#3F2A20]/70 py-10">
            <Link to="/login" className="font-bold underline">Log in</Link> to see products you have bought before.
          </p>
        ) : loading ? (
          <p className="text-center text-sm text-[#3F2A20]/60 py-10">Loading…</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600 py-10">Could not load your purchases. Please try again.</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-[#3F2A20]/60 py-10">No previous purchases yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((it) => (
              <div key={`${it.productId}:${it.variantId || ''}`} className="bg-white border border-[#EADCC9] rounded-xl p-2 flex flex-col">
                <button type="button" onClick={() => navigate('/product-detail', { state: { productId: it.productId } })} className="text-left">
                  <img src={it.image} alt={it.title} onError={handleImageError} className="w-full aspect-square object-contain rounded-lg bg-[#FFF8EE]" />
                  <p className="mt-2 text-[12.5px] font-bold text-[#3F2A20] line-clamp-2">{it.variantName ? `${it.title} (${it.variantName})` : it.title}</p>
                  <p className="text-[13px] font-black text-[#3F2A20]">₹{it.price}</p>
                </button>
                <button
                  type="button"
                  disabled={!it.inStock}
                  onClick={() => buyAgain(it)}
                  className="mt-2 min-h-[40px] rounded-lg bg-[#65B842] text-white text-[12.5px] font-black disabled:opacity-50"
                >
                  {it.inStock ? t('common.buyAgain', { defaultValue: 'Buy Again' }) : t('common.outOfStock', { defaultValue: 'Out of stock' })}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyAgain;
