import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, ArrowLeft, ShieldCheck, Heart, Trash2, X, MapPin, Clock, Plus, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import { fetchCartItems, updateCartItemQuantity, removeCartItemById, addProductToCart } from '../utils/cartUtils';
import useVendorStore from '../../../store/useVendorStore';
import { isAuthenticated as checkAuth, getUser } from '../../../shared/api/tokenStorage';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { getDisplayAddress, useHydrateAddresses } from '../../../shared/hooks/useDeliverToAddress';
import toast from 'react-hot-toast';
import useAccountStore from '../../../store/useAccountStore';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import { getWishlist, addToWishlist as addToWishlistApi, removeFromWishlist as removeFromWishlistApi } from '../services/userApi';
import { extractList, mapWishlistItem } from '../utils/mappers';
import { handleImageError } from '../../../shared/utils/imageUtils';
import { billFromCart } from '../utils/billing';
import BillSummary from '../components/checkout/BillSummary';
import FreeDeliveryBar from '../components/checkout/FreeDeliveryBar';
import CartLine from '../components/checkout/CartLine';
import LoginRequiredCard from '../../../shared/components/LoginRequiredCard';

// Each shopping tab keeps its own cart; the switcher below lets the shopper reach the others.
const CART_TABS = [
  { tab: 'mithilakart', flow: 'mithilakart', label: 'Mithilakart' },
  { tab: 'mithilak', flow: 'mithilak', label: 'Mithilak' },
  { tab: 'quick_shop', flow: 'quickshop', label: 'Quick Shop' },
  { tab: 'groceries_fresh', flow: 'freshgrocery', label: 'Fresh & Groceries' },
];

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { location: liveLocation } = useLiveLocation();
  const { savedAddresses, selectedAddressId, deliveryMode, wishlist, addToWishlist: addToWishlistStore, removeFromWishlist: removeFromWishlistStore } = useAccountStore();
  useHydrateAddresses();
  const deliverTo = getDisplayAddress({ savedAddresses, selectedAddressId, liveLocation, deliveryMode });

  const theme = useTabTheme();
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';
  const accentHex = theme.primaryHex || '#F5A400';
  const shopNowLink = isMithilakFlow ? '/mithilak' : (isFreshGroceryFlow ? '/fresh-grocery' : (isQuickShopFlow ? '/quick-shop' : '/vendor/home'));

  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth('customer'));
  const [cartItems, setCartItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busyLine, setBusyLine] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [localWishlist, setLocalWishlist] = useState([]);
  const [tabCounts, setTabCounts] = useState({});

  const loadTabCounts = async () => {
    const entries = await Promise.all(CART_TABS.map(async ({ tab }) => {
      const { items } = await fetchCartItems(tab);
      return [tab, items.reduce((n, i) => n + (Number(i.qty) || 1), 0)];
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  const switchCartTab = (flow) => {
    useVendorStore.getState().setActiveFlow(flow);
    setLoaded(false);
    loadCart();
  };

  const loadCartSeq = useRef(0);
  const loadCart = async () => {
    const seq = ++loadCartSeq.current;
    try {
      const { items, cart: fetched } = await fetchCartItems();
      // A slower, older response must not overwrite a newer one.
      if (seq !== loadCartSeq.current) return;
      setCartItems(items);
      setCart(fetched);
      loadTabCounts();
    } catch (e) {
      console.error('Failed to load cart', e);
    } finally {
      if (seq === loadCartSeq.current) setLoaded(true);
    }
  };

  const loadWishlistItems = async () => {
    try {
      const data = await getWishlist();
      const items = extractList(data).map((p) => mapWishlistItem(p));
      setLocalWishlist(items.length > 0 ? items : (Array.isArray(wishlist) ? wishlist : []));
    } catch {
      setLocalWishlist(Array.isArray(wishlist) ? wishlist : []);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { setLoaded(true); return undefined; }
    loadCart();
    loadWishlistItems();
    const onCartUpdated = () => loadCart();
    window.addEventListener('cartUpdated', onCartUpdated);
    return () => window.removeEventListener('cartUpdated', onCartUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Re-sync auth when returning from login / after logout in another tab
  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(checkAuth('customer'));
    window.addEventListener('customer-auth-changed', syncAuthState);
    window.addEventListener('focus', syncAuthState);
    return () => {
      window.removeEventListener('customer-auth-changed', syncAuthState);
      window.removeEventListener('focus', syncAuthState);
    };
  }, []);

  const bill = useMemo(
    () => billFromCart(cart, cartItems.reduce((n, i) => n + (Number(i.qty) || 1), 0)),
    [cart, cartItems]
  );
  const limitMessage = cart?.limits?.message;
  const user = getUser('customer');
  const hasAddress = deliverTo.source === 'live' || deliverTo.source === 'saved';
  const belowMinimum = bill && bill.minOrderAmount > 0 && bill.subtotal < bill.minOrderAmount;

  const changeQuantity = async (item, delta) => {
    if (busyLine) return;
    setBusyLine(item.cartId);
    try {
      await updateCartItemQuantity(item, delta);
      await loadCart();
    } catch (e) {
      // The server states the limit ("Limited quantity due to high demand…") — show it as-is.
      toast.error(e?.message || 'Could not update quantity');
      await loadCart();
    } finally {
      setBusyLine(null);
    }
  };

  const handleConfirmRemove = async (moveToWishlist) => {
    if (!itemToRemove) return;
    const target = itemToRemove;
    setItemToRemove(null);

    if (moveToWishlist) {
      try {
        const prodId = target.productId || target.id;
        if (!prodId) throw new Error('Product ID missing');
        await addToWishlistApi(prodId);
        const prod = { id: prodId, name: target.name, price: target.price, image: target.image, brand: target.brand };
        if (typeof addToWishlistStore === 'function' && !(Array.isArray(wishlist) && wishlist.some((w) => String(w.id) === String(prodId)))) {
          addToWishlistStore(prod);
        }
        setLocalWishlist((prev) => (prev.some((w) => w.id === prod.id) ? prev : [prod, ...prev]));
        toast.success('Moved to wishlist');
      } catch (err) {
        // Keep the item in the cart: don't lose it when the wishlist save failed.
        toast.error(err?.message || 'Could not add to wishlist');
        return;
      }
    }

    try {
      await removeCartItemById(target.cartId || target.itemKey || target.productId || target.id);
    } catch (err) {
      toast.error(err?.message || 'Could not remove item');
    }
    await loadCart();
  };

  const handleAddWishlistItemToCart = async (product) => {
    try {
      await addProductToCart(product);
      try { await removeFromWishlistApi(product.id); } catch { /* wishlist cleanup is best-effort */ }
      removeFromWishlistStore(product.id);
      setLocalWishlist((prev) => prev.filter((item) => item.id !== product.id));
      await loadCart();
    } catch (e) {
      if (e?.code !== 'LOGIN_REQUIRED') toast.error(e?.message || 'Could not add to cart');
    }
  };

  const themeBg = isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]'
    : isMithilakFlow ? 'bg-[color:var(--ml-light,#F5F9FA)]'
      : isQuickShopFlow ? 'bg-[color:var(--qs-light,#FFF5EE)]' : 'bg-[#FFF9E8]';
  const headerBg = isFreshGroceryFlow ? 'bg-[color:var(--fg-primary,#D9A21B)]'
    : isMithilakFlow ? 'bg-[color:var(--ml-primary,#207C8A)]'
      : isQuickShopFlow ? 'bg-gradient-to-r from-[color:var(--qs-primary,#F26522)] to-[color:var(--qs-accent,#FF7A00)]'
        : 'bg-[#F5A400]';

  const eta = (() => {
    const mins = cartItems.map((i) => Number(i.deliveryPromiseMinutes)).filter(Boolean);
    return mins.length ? `ETA in ${Math.min(...mins)}–${Math.max(...mins) + 15} min` : null;
  })();

  const proceed = () => {
    if (!hasAddress) { navigate('/profile/addresses'); return; }
    navigate('/vendor/checkout');
  };

  return (
    <div className={`min-h-screen pb-36 font-sans text-slate-800 flex flex-col relative ${themeBg}`}>
      {/* Header */}
      <header className={`sticky top-0 z-[100] px-4 h-14 flex items-center justify-between ${headerBg}`}>
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={19} strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-bold text-white">{t('nav.cart')}</h1>
        <span className="w-10" aria-hidden />
      </header>

      {isAuthenticated && loaded && CART_TABS.some(({ tab, flow }) => flow !== theme.activeFlow && tabCounts[tab] > 0) && (
        <nav aria-label="Your carts" className="px-4 pt-3">
          <p className="text-[12px] font-semibold text-slate-600 mb-2">
            {cartItems.length === 0 ? 'Your items are in another cart:' : 'You also have items in:'}
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CART_TABS.filter(({ tab, flow }) => flow !== theme.activeFlow && tabCounts[tab] > 0).map(({ tab, flow, label }) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchCartTab(flow)}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-white border border-slate-300 text-[13px] font-bold text-slate-800 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
              >
                {label}
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center" style={{ background: accentHex }}>{tabCounts[tab]}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {!isAuthenticated ? (
        <LoginRequiredCard title="Login to see your cart" subtitle="Your cart is empty until you log in. Log in to add items and check out." icon={ShoppingCart} />
      ) : !loaded ? (
        <div className="px-4 mt-4 space-y-3 animate-pulse" aria-busy>
          <div className="h-24 rounded-2xl bg-white" />
          <div className="h-48 rounded-2xl bg-white" />
          <div className="h-56 rounded-2xl bg-white" />
        </div>
      ) : cartItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-5">
            <ShoppingCart size={40} className="text-slate-400" />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900">{t('cart.empty')}</h2>
          <p className="text-[14px] text-slate-500 mt-1.5 mb-7">{t('cart.emptySubtitle')}</p>
          <Link to={shopNowLink} className="px-10 h-12 inline-flex items-center rounded-full text-white font-bold text-[14px] active:scale-95 transition-transform" style={{ background: accentHex }}>
            {t('cart.shopNow')}
          </Link>
        </div>
      ) : (
        <div className="px-4 mt-3 space-y-3 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 md:max-w-6xl md:mx-auto md:w-full md:py-4 md:items-start">
          <div className="md:col-span-2 space-y-3">
            {/* Delivery address */}
            <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5 flex items-start gap-3">
              <MapPin size={22} className="text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-blue-900">{hasAddress ? t('cart.deliverToHome') : t('cart.deliveryAddress')}</p>
                <p className="text-[12.5px] text-slate-600 mt-0.5 leading-snug">
                  {hasAddress
                    ? <>{user?.name ? <span className="font-semibold">{user.name} | </span> : null}{deliverTo.label}</>
                    : t('cart.loginAddAddress')}
                </p>
                {eta && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11.5px] font-bold">
                    <Clock size={12} /> {eta}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile/addresses')}
                className="px-3.5 h-9 rounded-full border border-amber-400 text-amber-600 text-[13px] font-bold active:scale-95 transition-transform flex-shrink-0"
              >
                {hasAddress ? t('auto.change') : t('cart.addAddress')}
              </button>
            </section>

            <FreeDeliveryBar bill={bill} />

            {/* Items */}
            <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5">
              <h2 className="flex items-center gap-2 text-[16px] font-bold text-blue-900 mb-3">
                <ShoppingCart size={19} /> Your Cart Items ({cartItems.length})
              </h2>
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="py-3 first:pt-0">
                    <CartLine
                      item={item}
                      busy={busyLine === item.cartId}
                      limitMessage={limitMessage}
                      onIncrease={() => changeQuantity(item, 1)}
                      onDecrease={() => changeQuantity(item, -1)}
                      onRemove={() => setItemToRemove(item)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Link to={shopNowLink} className="text-[14px] font-bold text-blue-900">Continue Shopping</Link>
                <Link
                  to={shopNowLink}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full text-white text-[13.5px] font-bold active:scale-95 transition-transform"
                  style={{ background: accentHex }}
                >
                  <Plus size={16} /> Add More Items
                </Link>
              </div>
            </section>

            {/* Wishlist */}
            {localWishlist.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-blue-900">
                    <Heart size={18} className="text-rose-500 fill-rose-500" /> {t('cart.wishlistItems', { count: localWishlist.length })}
                  </h3>
                  <Link to="/wishlist" className="text-[13px] font-bold flex items-center" style={{ color: accentHex }}>
                    {t('common.viewAll')} <ChevronRight size={15} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {localWishlist.slice(0, 6).map((item) => (
                    <div key={item.id} className="border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center">
                      <div className="w-full aspect-square rounded-lg bg-white border border-slate-100 p-2 flex items-center justify-center mb-2 overflow-hidden">
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" loading="lazy" decoding="async" onError={handleImageError} />
                      </div>
                      <h4 className="text-[12.5px] font-semibold text-slate-800 text-center line-clamp-1 w-full">{item.name}</h4>
                      <p className="text-[13px] font-bold text-slate-900">{formatPrice(item.price)}</p>
                      <button
                        type="button"
                        onClick={() => handleAddWishlistItemToCart(item)}
                        className="mt-2 w-full h-9 rounded-lg text-white font-bold text-[12px] flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        style={{ background: accentHex }}
                      >
                        <ShoppingCart size={13} /> {t('common.addToCart')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="md:col-span-1 space-y-3 md:sticky md:top-20">
            <BillSummary bill={bill} />
            {belowMinimum && (
              <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-semibold px-3.5 py-2.5">
                Minimum order value is {formatPrice(bill.minOrderAmount)}. Add {formatPrice(bill.minOrderAmount - bill.subtotal)} more to check out.
              </p>
            )}
            <button
              type="button"
              onClick={proceed}
              disabled={belowMinimum}
              className="hidden md:flex w-full h-12 rounded-full text-white font-bold text-[15px] items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ background: accentHex }}
            >
              {hasAddress ? t('cart.checkout') : t('cart.addAddress')}
            </button>
          </div>
        </div>
      )}

      {/* Sticky checkout bar (mobile) */}
      {isAuthenticated && cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-between gap-4 md:hidden shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
          <div>
            <p className="text-[12px] font-semibold text-slate-500">Total Amount</p>
            <p className="text-[21px] font-extrabold text-slate-900 leading-none mt-0.5">{bill ? formatPrice(bill.total, bill.total % 1 !== 0) : '—'}</p>
          </div>
          <button
            type="button"
            onClick={proceed}
            disabled={belowMinimum}
            className="flex-1 max-w-[220px] h-12 rounded-full text-white font-bold text-[15px] active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: accentHex }}
          >
            {hasAddress ? `${t('cart.checkout')} →` : t('cart.addAddress')}
          </button>
        </div>
      )}

      {/* Remove / move to wishlist */}
      {itemToRemove && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl w-full max-w-[380px] p-6 shadow-2xl relative text-center">
            <button type="button" aria-label="Close" onClick={() => setItemToRemove(null)} className="absolute right-4 top-4 text-slate-400 p-1.5 rounded-full hover:bg-slate-100">
              <X size={20} />
            </button>
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 mx-auto p-2 flex items-center justify-center mb-4 overflow-hidden">
              <img src={itemToRemove.image} alt={itemToRemove.name} className="max-w-full max-h-full object-contain" onError={handleImageError} />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900">{t('cart.removeItemTitle')}</h3>
            <p className="text-[13px] text-slate-500 mt-1 mb-5">{t('cart.removeItemHint', { name: itemToRemove.name })}</p>
            <div className="space-y-2.5">
              <button type="button" onClick={() => handleConfirmRemove(true)} className="w-full h-12 rounded-2xl text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98]" style={{ background: accentHex }}>
                <Heart size={16} className="fill-white" /> {t('cart.moveToWishlist')}
              </button>
              <button type="button" onClick={() => handleConfirmRemove(false)} className="w-full h-12 rounded-2xl bg-rose-50 text-rose-600 font-bold text-[14px] border border-rose-100 flex items-center justify-center gap-2 active:scale-[0.98]">
                <Trash2 size={16} /> {t('cart.removeFromCart')}
              </button>
              <button type="button" onClick={() => setItemToRemove(null)} className="w-full h-10 text-slate-500 font-semibold text-[13px]">{t('auto.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && cartItems.length > 0 && (
        <div className="mt-6 px-6 py-4 flex flex-col items-center gap-2 text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={17} />
            <span className="text-[12px] font-bold">{t('cart.safePayments')}</span>
          </div>
          <p className="text-[11px] text-center leading-relaxed">{t('cart.paymentsSubtitle')}</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
