import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAlreadyBought } from '../../../services/userApi';
import { addProductToCart } from '../../../utils/cartUtils';
import { getTokens, getUser, isAuthenticated } from '../../../../../shared/api/tokenStorage';

const PAGE_SIZE = 12;

// Identity of the current session. Changes on login, logout and account switch.
const readSessionKey = () => {
  if (!isAuthenticated('customer')) return null;
  const user = getUser('customer');
  return String(user?.id || user?._id || getTokens('customer').accessToken || '');
};

/**
 * "Already Bought Products" - renders nothing for guests, while loading, on error,
 * or when the customer has no eligible purchases.
 */
const AlreadyBoughtSection = ({ CardComponent }) => {
  const navigate = useNavigate();
  const [sessionKey, setSessionKey] = useState(readSessionKey);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const sync = () => setSessionKey((prev) => {
      const next = readSessionKey();
      return prev === next ? prev : next;
    });
    window.addEventListener('customer-auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('customer-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    // Drop the previous customer's data immediately, before anything new arrives.
    setItems([]);
    if (!sessionKey) return undefined;
    let cancelled = false;
    getAlreadyBought({ page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => { cancelled = true; };
  }, [sessionKey]);

  const deals = useMemo(() => items.map((it) => ({
    id: `${it.productId}:${it.variantId || ''}`,
    title: it.variantName ? `${it.title} (${it.variantName})` : it.title,
    img: it.image,
    price: it.price,
    raw: it,
    product: { brand: it.brand || 'MITHILAKART', price: it.price, mrp: it.mrp, rating: it.rating },
  })), [items]);

  const handleBuyAgain = useCallback(async (deal, e) => {
    e.stopPropagation();
    e.preventDefault();
    const it = deal.raw;
    if (!it.inStock) {
      toast.error('This item is currently out of stock');
      return;
    }
    try {
      await addProductToCart({
        productId: it.productId,
        listingId: it.listingId,
        variantId: it.variantId,
        marketplaceTab: it.marketplaceTab || 'mithilakart',
      }, 1, it.commerceFlow || undefined);
      toast.success(`${deal.title} added to cart!`);
    } catch (err) {
      toast.error(err?.message || 'Could not add to cart');
    }
  }, []);

  if (!sessionKey || !deals.length || !CardComponent) return null;

  return (
    <div className="py-2 px-3 w-full max-w-[1600px] mx-auto select-none">
      <div className="flex justify-between items-center mb-3.5 px-1">
        <h2 className="text-[15.5px] font-black text-[#3F2A20] tracking-tight">Already Bought Products</h2>
      </div>
      <div className="flex items-stretch gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1 -mx-1 px-1">
        {deals.map((deal) => (
          <div key={deal.id} className="w-[165px] sm:w-[195px] md:w-[220px] flex-shrink-0 snap-start flex flex-col">
            <CardComponent
              deal={deal}
              ctaLabel={deal.raw.inStock ? 'Buy Again' : 'Out of stock'}
              ctaDisabled={!deal.raw.inStock}
              onNavigate={(d) => navigate('/product-detail', { state: { productId: d.raw.productId } })}
              onAddToCart={handleBuyAgain}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(AlreadyBoughtSection);
