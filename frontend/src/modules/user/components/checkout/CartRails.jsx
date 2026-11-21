import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Check, ChevronRight, Clock, Star, Flame, Moon, Heart, Zap, Bell, ThumbsUp, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCartRecommendations } from '../../services/cartApi';
import { addProductToCart } from '../../utils/cartUtils';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import { formatPrice } from '../../../../shared/utils/priceFormatter';
import { handleImageError } from '../../../../shared/utils/imageUtils';

/** Small coloured badge in front of each rail title, like the reference. */
const RAIL_ICONS = {
  recently_viewed: { Icon: Clock, bg: '#F59E0B' },
  bestsellers: { Icon: Star, bg: '#F59E0B' },
  highly_ordered: { Icon: Flame, bg: '#EF4444' },
  late_evening: { Icon: Moon, bg: '#2563EB' },
  wishlist: { Icon: Heart, bg: '#EF4444' },
  quick_grabs: { Icon: Zap, bg: '#F59E0B' },
  missed: { Icon: Bell, bg: '#EAB308' },
  recommended: { Icon: ThumbsUp, bg: '#2563EB' },
};

const RailIcon = ({ railKey }) => {
  const { Icon, bg } = RAIL_ICONS[railKey] || { Icon: ShoppingBag, bg: '#64748B' };
  return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      <Icon size={11} className="text-white" fill="currentColor" strokeWidth={2.5} />
    </span>
  );
};

/** 70px card: 52px image, 2-line name, price, round + at the corner. Five fit per row at phone width. */
const Card = ({ item, accentHex, added, onAdd, onOpen }) => (
  <div className="w-[68px] flex-shrink-0 bg-white rounded-lg border border-slate-200/70 p-1 relative">
    <button type="button" onClick={() => onOpen(item)} className="block w-full text-left" aria-label={item.name}>
      <div className="h-[50px] flex items-center justify-center overflow-hidden">
        <img src={item.image} alt="" className="max-w-full max-h-full object-contain" loading="lazy" decoding="async" onError={handleImageError} />
      </div>
      <p className="text-[9.5px] font-semibold text-slate-800 leading-[1.15] line-clamp-2 min-h-[22px] mt-0.5">{item.name}</p>
      <p className="text-[11px] font-extrabold text-slate-900 leading-none mt-0.5 pr-5">{formatPrice(item.price)}</p>
    </button>
    <button
      type="button"
      aria-label={`Add ${item.name} to cart`}
      onClick={() => onAdd(item)}
      className="absolute right-0.5 bottom-0.5 w-[22px] h-[22px] rounded-full text-white flex items-center justify-center shadow active:scale-90 transition-transform"
      style={{ background: accentHex }}
    >
      {added ? <Check size={12} strokeWidth={3.5} /> : <Plus size={13} strokeWidth={3.5} />}
    </button>
  </div>
);

const Rail = ({ railKey, title, tabs, items, accentHex, cartIds, onAdd, onOpen, viewAll }) => {
  const [active, setActive] = useState(0);
  const list = tabs ? tabs[Math.min(active, tabs.length - 1)].items : items;
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900"><RailIcon railKey={railKey} />{title}</h2>
        <button type="button" onClick={viewAll} className="min-h-[28px] pl-2 text-[12px] font-bold flex items-center" style={{ color: accentHex }}>
          View All <ChevronRight size={13} />
        </button>
      </div>
      {tabs && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-1.5 -mx-0.5 px-0.5" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className="flex-shrink-0 h-8 px-3 rounded-full text-[11.5px] font-bold whitespace-nowrap"
              style={i === active ? { background: accentHex, color: '#fff' } : { color: '#475569' }}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {list.map((item) => (
          <Card key={item.productId} item={item} accentHex={accentHex} added={cartIds.has(item.productId)} onAdd={onAdd} onOpen={onOpen} />
        ))}
      </div>
      {tabs && (
        <div className="flex justify-center mt-1.5">
          <button type="button" onClick={viewAll} className="h-8 px-4 rounded-full border text-[11.5px] font-bold flex items-center gap-1 bg-white" style={{ borderColor: accentHex, color: accentHex }}>
            View More Products <ChevronRight size={12} />
          </button>
        </div>
      )}
    </section>
  );
};

/** CART-1 recommendation rails (admin controls which, order, titles). */
const CartRails = ({ marketplaceTab, cartProductIds, accentHex, shopLink }) => {
  const navigate = useNavigate();
  const [rails, setRails] = useState([]);
  const key = cartProductIds.join(',');

  useEffect(() => {
    if (!marketplaceTab) return undefined;
    let cancelled = false;
    getCartRecommendations(marketplaceTab, { cart: cartProductIds, recent: getRecentlyViewed() })
      .then((data) => { if (!cancelled) setRails(data?.rails || []); })
      .catch(() => { if (!cancelled) setRails([]); });
    return () => { cancelled = true; };
    // Refetch when the tab changes; the cart key keeps "in cart" ticks right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketplaceTab]);

  const cartIds = useMemo(() => new Set(cartProductIds), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // The cart page listens for 'cartUpdated' and refreshes itself.
  const add = useCallback(async (item) => {
    try {
      await addProductToCart(item);
    } catch (e) {
      if (e?.code !== 'LOGIN_REQUIRED') toast.error(e?.message || 'Could not add to cart');
    }
  }, []);

  const open = useCallback((item) => navigate('/product-detail', { state: { productId: item.productId, listingId: item.listingId, product: item } }), [navigate]);

  if (!rails.length) return null;
  return (
    <div className="space-y-2.5" data-testid="cart-rails">
      {rails.map((r) => (
        <Rail key={r.key} railKey={r.key} title={r.title} tabs={r.tabs} items={r.items} accentHex={accentHex} cartIds={cartIds} onAdd={add} onOpen={open} viewAll={() => navigate(shopLink)} />
      ))}
    </div>
  );
};

export default CartRails;
