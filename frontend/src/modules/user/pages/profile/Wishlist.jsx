import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, ShoppingCart, Share2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoginGate from '../../../../shared/components/LoginGate';
import useTabTheme from '../../../../shared/hooks/useTabTheme';
import useAccountStore from '../../../../store/useAccountStore';
import { getWishlist, removeFromWishlist as removeWishlistApi } from '../../services/userApi';
import { getCartRecommendationRail } from '../../services/cartApi';
import { extractList, mapWishlistItem } from '../../utils/mappers';
import { fetchCartCount } from '../../utils/cartUtils';
import RailCard from '../../components/checkout/RailCard';
import CartRails from '../../components/checkout/CartRails';
import SafePayments from '../../components/checkout/SafePayments';

const FLOW_TO_TAB = { mithilakart: 'mithilakart', quickshop: 'quick_shop', mithilak: 'mithilak', freshgrocery: 'groceries_fresh' };
const HOME = { mithilakart: '/home', quickshop: '/quick-shop', mithilak: '/mithilak', freshgrocery: '/fresh-grocery' };
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'mithilakart', label: 'Mithilakart' },
  { key: 'quick_shop', label: 'Quick Shop' },
  { key: 'mithilak', label: 'Mithilak' },
  { key: 'groceries_fresh', label: 'Fresh & Groceries' },
];

/**
 * One wishlist per account, whatever tab an item was saved from; the chips only
 * filter it. Prices, stock and the tab an item sells in come from the live listing.
 */
const WishlistPage = () => {
  const navigate = useNavigate();
  const theme = useTabTheme();
  const tab = FLOW_TO_TAB[theme.activeFlow] || 'mithilakart';
  const wishlist = useAccountStore((s) => s.wishlist);
  const setWishlist = useAccountStore((s) => s.setWishlist);
  const removeFromWishlist = useAccountStore((s) => s.removeFromWishlist);
  const [live, setLive] = useState({}); // productId -> live listing card
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [filter, setFilter] = useState('all');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getWishlist();
        if (cancelled) return;
        setWishlist(extractList(data).map((p) => mapWishlistItem(p)));
        const rail = await getCartRecommendationRail('wishlist', tab).catch(() => null);
        if (cancelled) return;
        setLive(Object.fromEntries((rail?.items || []).map((i) => [String(i.productId), i])));
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [setWishlist, tab]);

  useEffect(() => {
    const update = async () => setCartCount(await fetchCartCount());
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  const items = useMemo(() => (Array.isArray(wishlist) ? wishlist : []).map((w) => {
    const id = String(w.productId || w.id);
    return live[id] ? { ...live[id], image: live[id].image || w.image } : { ...w, productId: id, unavailable: status === 'ready' };
  }), [wishlist, live, status]);

  const counts = useMemo(() => {
    const out = { all: items.length };
    items.forEach((i) => { if (i.marketplaceTab) out[i.marketplaceTab] = (out[i.marketplaceTab] || 0) + 1; });
    return out;
  }, [items]);
  const shown = filter === 'all' ? items : items.filter((i) => i.marketplaceTab === filter);

  const remove = async (item) => {
    const before = useAccountStore.getState().wishlist;
    removeFromWishlist(item.productId);
    try {
      await removeWishlistApi(item.productId);
      toast.success('Removed from wishlist');
    } catch (err) {
      setWishlist(before);
      toast.error(err?.message || 'Could not remove this item');
    }
  };

  const open = (item) => navigate('/product-detail', { state: { productId: item.productId, listingId: item.listingId, product: item } });

  const share = async () => {
    const text = items.map((i) => `${i.name} — ₹${i.price}`).join('\n');
    try {
      if (navigator.share) await navigator.share({ title: 'My Mithilakart wishlist', text });
      else { await navigator.clipboard.writeText(text); toast.success('Wishlist copied'); }
    } catch { /* share sheet closed */ }
  };

  return (
    <div className={`min-h-screen pb-10 ${theme.primaryLightBg}`} data-testid="wishlist-page">
      <header data-testid="wishlist-header" className={`sticky top-0 z-50 px-3 h-14 flex items-center gap-3 text-white shadow-sm ${theme.headerBg}`}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95">
          <ArrowLeft size={19} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 text-[17px] font-bold">My Wishlist{items.length ? ` (${items.length})` : ''}</h1>
        {items.length > 0 && <button type="button" aria-label="Share wishlist" onClick={share} className="w-10 h-10 rounded-full flex items-center justify-center"><Share2 size={20} /></button>}
        <button type="button" aria-label="Cart" onClick={() => navigate('/cart')} className="relative w-10 h-10 rounded-full flex items-center justify-center">
          <ShoppingCart size={21} />
          {cartCount > 0 && <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[10.5px] font-bold flex items-center justify-center" style={{ color: theme.primaryHex }}>{cartCount}</span>}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-3 pt-3 flex flex-col gap-4">
        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter wishlist">
            {FILTERS.filter((f) => f.key === 'all' || counts[f.key]).map((f) => {
              const on = filter === f.key;
              return (
                <button key={f.key} type="button" role="tab" aria-selected={on} onClick={() => setFilter(f.key)}
                  className="flex-shrink-0 h-10 px-4 rounded-full border text-[13px] font-bold bg-white"
                  style={on ? { background: theme.primaryHex, borderColor: theme.primaryHex, color: '#fff' } : { color: '#475569', borderColor: '#e2e8f0' }}>
                  {f.label} ({counts[f.key] || 0})
                </button>
              );
            })}
          </div>
        )}

        {status === 'loading' && !items.length && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-pulse" aria-busy>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-xl bg-white" />)}
          </div>
        )}

        {status === 'error' && !items.length && <p className="text-center py-16 text-[14px] font-semibold text-slate-600">We could not load your wishlist. Please check your connection and try again.</p>}

        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" data-testid="wishlist-grid">
            {shown.map((item) => (
              <RailCard key={item.productId} item={item.unavailable ? { ...item, stock: 0 } : item} onOpen={open} currentTab={tab} className="w-full">
                <button type="button" aria-label={`Remove ${item.name} from wishlist`} onClick={() => remove(item)}
                  className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-rose-600 active:scale-90">
                  <Trash2 size={16} />
                </button>
              </RailCard>
            ))}
          </div>
        )}

        {status === 'ready' && !items.length && (
          <section className="rounded-2xl bg-white border border-slate-200/70 flex flex-col items-center text-center px-6 py-12">
            <span className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${theme.primaryHex}1a`, color: theme.primaryHex }}><Heart size={38} /></span>
            <h2 className="mt-4 text-[18px] font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="text-[14px] text-slate-500 mt-1">Tap the heart on any product to save it here.</p>
            <button type="button" onClick={() => navigate(HOME[theme.activeFlow] || '/home')} className="mt-6 h-12 px-9 rounded-full text-white text-[14px] font-bold active:scale-95" style={{ background: theme.primaryHex }}>Start shopping</button>
          </section>
        )}

        {status === 'ready' && (
          <CartRails
            marketplaceTab={tab}
            cartProductIds={items.map((i) => String(i.productId)).slice(0, 40)}
            accentHex={theme.primaryHex}
            only={['recommended', 'bestsellers', 'recently_viewed']}
          />
        )}
        {status === 'ready' && <SafePayments />}
      </main>
    </div>
  );
};

const Wishlist = () => (
  <LoginGate title="Wishlist" cardTitle="Login to see your wishlist" subtitle="Log in to view and manage the items you have saved." icon={Heart}>
    <WishlistPage />
  </LoginGate>
);

export default Wishlist;
