import React, { useEffect, useState } from 'react';
import { ArrowLeft, PackageOpen, ShoppingCart } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import LoginGate from '../../../shared/components/LoginGate';
import { getCartRecommendationRail } from '../services/cartApi';
import { fetchCartItems } from '../utils/cartUtils';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import RailCard from '../components/checkout/RailCard';

const TABS = ['mithilakart', 'mithilak', 'quick_shop', 'groceries_fresh'];
const FLOW_TO_TAB = { mithilakart: 'mithilakart', quickshop: 'quick_shop', mithilak: 'mithilak', freshgrocery: 'groceries_fresh' };

/** "View All" of one cart rail — Bestsellers, Price Drops, My Wishlist… — as its own page. */
const RailProductsPage = () => {
  const { railKey } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTabTheme();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : FLOW_TO_TAB[theme.activeFlow] || 'mithilakart';
  const sub = params.get('sub') || undefined;

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const { items } = await fetchCartItems(tab);
        const res = await getCartRecommendationRail(railKey, tab, {
          sub,
          cart: items.map((i) => String(i.productId || i.id)),
          recent: getRecentlyViewed(),
        });
        if (!cancelled) { setData(res); setStatus('ready'); }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [railKey, tab, sub, attempt]);

  const open = (item) => navigate('/product-detail', { state: { productId: item.productId, listingId: item.listingId, product: item } });
  const switchSub = (key) => setParams({ tab, sub: key }, { replace: true });

  return (
    <div className={`min-h-screen pb-10 ${theme.primaryLightBg}`} data-testid="rail-products">
      <header className={`sticky top-0 z-50 px-3 h-14 flex items-center gap-3 text-white shadow-sm ${theme.headerBg}`}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95">
          <ArrowLeft size={19} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 min-w-0 text-[17px] font-bold truncate">{data?.title || 'Products'}</h1>
        <button type="button" aria-label="Cart" onClick={() => navigate('/cart')} className="w-10 h-10 rounded-full flex items-center justify-center"><ShoppingCart size={21} /></button>
      </header>

      {data?.tabs?.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pt-3" role="tablist">
          {data.tabs.map((t) => {
            const on = t.key === data.subKey;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => switchSub(t.key)}
                className="flex-shrink-0 h-10 px-4 rounded-full text-[13px] font-bold border bg-white"
                style={on ? { background: theme.primaryHex, borderColor: theme.primaryHex, color: '#fff' } : { color: '#475569', borderColor: '#e2e8f0' }}>
                {t.title}
              </button>
            );
          })}
        </div>
      )}

      <main className="max-w-6xl mx-auto p-3">
        {status === 'loading' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-pulse" aria-busy>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-60 rounded-xl bg-white" />)}
          </div>
        )}
        {status === 'error' && (
          <div className="text-center py-20">
            <p className="text-[15px] font-bold text-slate-800">We could not load these products.</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-4 h-11 px-7 rounded-full text-white text-[14px] font-bold" style={{ background: theme.primaryHex }}>Try again</button>
          </div>
        )}
        {status === 'ready' && (data.items.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {data.items.map((item) => <RailCard key={item.productId} item={item} onOpen={open} currentTab={tab} className="w-full" />)}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-20 text-slate-500">
            <PackageOpen size={44} />
            <p className="mt-3 text-[15px] font-bold text-slate-700">Nothing here yet</p>
          </div>
        ))}
      </main>
    </div>
  );
};

const RailProducts = () => (
  <LoginGate title="Products" cardTitle="Login to see your products" subtitle="Log in to see picks made for you.">
    <RailProductsPage />
  </LoginGate>
);

export default RailProducts;
