import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Clock, Star, Flame, Moon, Heart, Zap, Bell, ThumbsUp, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCartRecommendations } from '../../services/cartApi';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import RailCard from './RailCard';

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
    <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      <Icon size={13} className="text-white" fill="currentColor" strokeWidth={2.5} />
    </span>
  );
};

const Rail = ({ railKey, title, tabs, items, accentHex, marketplaceTab, onOpen, onViewAll }) => {
  const [active, setActive] = useState(0);
  const tab = tabs ? tabs[Math.min(active, tabs.length - 1)] : null;
  const list = tab ? tab.items : items;
  const viewAll = () => onViewAll(railKey, tab?.key);
  return (
    <section className="rounded-2xl bg-white/70 border border-slate-200/60 p-3" data-rail={railKey}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-900"><RailIcon railKey={railKey} />{title}</h2>
        <button type="button" onClick={viewAll} className="min-h-[36px] pl-2 text-[13px] font-bold flex items-center" style={{ color: accentHex }}>
          View All <ChevronRight size={15} />
        </button>
      </div>
      {tabs && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2.5 -mx-0.5 px-0.5" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className="flex-shrink-0 h-9 px-3.5 rounded-full text-[12.5px] font-bold whitespace-nowrap border"
              style={i === active ? { background: accentHex, borderColor: accentHex, color: '#fff' } : { color: '#475569', borderColor: '#e2e8f0' }}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
        {list.map((item) => (
          <RailCard key={item.productId} item={item} onOpen={onOpen} currentTab={marketplaceTab} />
        ))}
      </div>
      {tabs && (
        <div className="flex justify-center mt-3">
          <button type="button" onClick={viewAll} className="h-10 px-5 rounded-full border text-[13px] font-bold flex items-center gap-1 bg-white" style={{ borderColor: accentHex, color: accentHex }}>
            View More Products <ChevronRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
};

/**
 * CART-1 recommendation rails (admin controls which, order, titles). `only`
 * limits them to some keys, for pages that show just a few (wishlist).
 */
const CartRails = ({ marketplaceTab, cartProductIds, accentHex, only = null }) => {
  const navigate = useNavigate();
  const [rails, setRails] = useState([]);

  useEffect(() => {
    if (!marketplaceTab) return undefined;
    let cancelled = false;
    getCartRecommendations(marketplaceTab, { cart: cartProductIds, recent: getRecentlyViewed() })
      .then((data) => { if (!cancelled) setRails(data?.rails || []); })
      .catch(() => { if (!cancelled) setRails([]); });
    return () => { cancelled = true; };
    // Refetch only when the tab changes, so a card does not vanish the moment it is added.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketplaceTab]);

  const open = useCallback((item) => navigate('/product-detail', { state: { productId: item.productId, listingId: item.listingId, product: item } }), [navigate]);

  const viewAll = useCallback((railKey, sub) => {
    const params = new URLSearchParams({ tab: marketplaceTab });
    if (sub) params.set('sub', sub);
    navigate(`/picks/${railKey}?${params}`);
  }, [navigate, marketplaceTab]);

  const shown = only ? rails.filter((r) => only.includes(r.key)) : rails;
  if (!shown.length) return null;
  return (
    <div className="flex flex-col" style={{ gap: 'var(--cd-gap, 14px)' }} data-testid="cart-rails">
      {shown.map((r) => (
        <Rail key={r.key} railKey={r.key} title={r.title} tabs={r.tabs} items={r.items} accentHex={accentHex} marketplaceTab={marketplaceTab} onOpen={open} onViewAll={viewAll} />
      ))}
    </div>
  );
};

export default CartRails;
