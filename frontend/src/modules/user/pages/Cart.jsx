import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, ArrowLeft, Heart, Trash2, X, MapPin, Clock, Plus, Home, ChevronDown, ReceiptText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import { fetchCartItems, updateCartItemQuantity, removeCartItemById } from '../utils/cartUtils';
import useVendorStore from '../../../store/useVendorStore';
import { isAuthenticated as checkAuth, getUser } from '../../../shared/api/tokenStorage';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { getDisplayAddress, useHydrateAddresses } from '../../../shared/hooks/useDeliverToAddress';
import toast from 'react-hot-toast';
import useAccountStore from '../../../store/useAccountStore';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import { getWishlist, addToWishlist as addToWishlistApi } from '../services/userApi';
import { extractList, mapWishlistItem } from '../utils/mappers';
import { handleImageError } from '../../../shared/utils/imageUtils';
import { billFromCart } from '../utils/billing';
import BillSummary from '../components/checkout/BillSummary';
import FreeDeliveryBar from '../components/checkout/FreeDeliveryBar';
import CartLine from '../components/checkout/CartLine';
import { useCartDesign, CartDesignProvider, DesignSection, OrderedSections } from '../components/checkout/cartDesign';
import CartRails from '../components/checkout/CartRails';
import SafePayments from '../components/checkout/SafePayments';
import CartBannerCarousel from '../components/checkout/CartBannerCarousel';
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
  const { savedAddresses, selectedAddressId, deliveryMode, wishlist, addToWishlist: addToWishlistStore } = useAccountStore();
  useHydrateAddresses();
  const deliverTo = getDisplayAddress({ savedAddresses, selectedAddressId, liveLocation, deliveryMode });

  const theme = useTabTheme();
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';
  const design = useCartDesign('cart');
  const accentHex = design.accent;
  const shopNowLink = isMithilakFlow ? '/mithilak' : (isFreshGroceryFlow ? '/fresh-grocery' : (isQuickShopFlow ? '/quick-shop' : '/vendor/home'));

  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth('customer'));
  const [cartItems, setCartItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busyLine, setBusyLine] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [localWishlist, setLocalWishlist] = useState([]);
  const [tabCounts, setTabCounts] = useState({});
  const [showBill, setShowBill] = useState(false);

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
    () => billFromCart(cart, cartItems.length),
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

  const eta = (() => {
    const mins = cartItems.map((i) => Number(i.deliveryPromiseMinutes)).filter(Boolean);
    return mins.length ? `ETA in ${Math.min(...mins)}–${Math.max(...mins) + 15} min` : null;
  })();

  const minimumHint = belowMinimum
    ? `Minimum order value is ${formatPrice(bill.minOrderAmount)}. Add ${formatPrice(bill.minOrderAmount - bill.subtotal)} more to check out.`
    : '';

  const proceed = () => {
    // The button is never faded out; tapping it explains what is missing instead.
    if (belowMinimum) { toast.error(minimumHint); return; }
    if (!hasAddress) { navigate('/profile/addresses'); return; }
    navigate('/vendor/checkout');
  };

  const tabSwitcher = isAuthenticated && loaded && CART_TABS.some(({ tab, flow }) => flow !== theme.activeFlow && tabCounts[tab] > 0) ? (
    <nav aria-label="Your carts" className="flex items-center gap-2">
      <p className="text-[11.5px] font-semibold flex-shrink-0 cd-text">
        {cartItems.length === 0 ? 'You have items in:' : 'Your other carts:'}
      </p>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {CART_TABS.filter(({ tab, flow }) => flow !== theme.activeFlow && tabCounts[tab] > 0).map(({ tab, flow, label }) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchCartTab(flow)}
            className="flex-shrink-0 h-9 px-3 rounded-full bg-white border border-slate-300 text-[12px] font-bold text-slate-800 flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            {label}
            <span className="min-w-[20px] h-5 px-1 rounded-full text-white text-[10.5px] font-extrabold flex items-center justify-center" style={{ background: accentHex }}>{tabCounts[tab]}</span>
          </button>
        ))}
      </div>
    </nav>
  ) : null;

  // Every section of the page, keyed like the admin's "Cart Pages Design" screen.
  const sectionEls = {
    tabSwitcher: <DesignSection id="tabSwitcher" plain>{tabSwitcher}</DesignSection>,

    banner: <DesignSection id="banner" plain><CartBannerCarousel flow={theme.activeFlow} /></DesignSection>,

    address: (
      <DesignSection id="address">
        <section className="cd-card flex items-start gap-2">
          <MapPin size={20} className="flex-shrink-0 mt-0.5" style={{ color: accentHex }} fill="currentColor" />
          <div className="flex-1 min-w-0">
            <p className="text-[15.5px] font-bold cd-heading leading-tight">{hasAddress ? t('cart.deliverToHome') : t('cart.deliveryAddress')}</p>
            <p className="text-[13px] mt-1 leading-snug line-clamp-2 cd-text">
              {hasAddress
                ? <>{user?.name ? <span className="font-semibold">{user.name} | </span> : null}{deliverTo.label}</>
                : t('cart.loginAddAddress')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate('/profile/addresses')}
              className="px-3 h-8 cd-btn border text-[12px] font-bold active:scale-95 transition-transform bg-white"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              {hasAddress ? t('auto.change') : t('cart.addAddress')}
            </button>
            {eta && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-bold whitespace-nowrap">
                <Clock size={10} /> {eta}
              </span>
            )}
          </div>
        </section>
      </DesignSection>
    ),

    items: (
      <DesignSection id="items">
        <section className="cd-card">
          <h2 className="flex items-center gap-2 text-[16px] font-bold cd-heading mb-2.5">
            <ShoppingCart size={19} /> {design.title('items', 'Your Cart Items')} ({cartItems.length})
          </h2>
          <div className="divide-y divide-slate-100">
            {cartItems.map((item) => (
              <div key={item.cartId} className="cd-row">
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
          <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-slate-100">
            <p className="text-[14px] font-bold cd-heading min-h-[36px] flex items-center">Continue Shopping</p>
            <Link
              to={shopNowLink}
              className="inline-flex items-center gap-1.5 px-4 h-10 cd-btn text-white text-[13.5px] font-bold active:scale-95 transition-transform"
              style={{ background: accentHex }}
            >
              <Plus size={15} /> Add More Items
            </Link>
          </div>
        </section>
      </DesignSection>
    ),

    freeDelivery: <DesignSection id="freeDelivery" plain><FreeDeliveryBar bill={bill} /></DesignSection>,

    // One tappable row on phones; the full bill sits in the right column on desktop.
    priceDetails: (
      <DesignSection id="priceDetails" className="md:hidden">
        <div className="cd-card">
          <button
            type="button"
            aria-expanded={showBill}
            onClick={() => setShowBill((v) => !v)}
            className="w-full flex items-center justify-between min-h-[44px] text-left"
          >
            <span className="flex items-center gap-2 text-[16px] font-bold cd-heading"><ReceiptText size={19} /> {design.title("priceDetails", "Price Details")}</span>
            <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-slate-900">
              {bill ? formatPrice(bill.total, bill.total % 1 !== 0) : '—'}
              <ChevronDown size={16} className={`text-slate-500 transition-transform ${showBill ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {showBill && <div className="mt-2"><BillSummary bill={bill} bare title={design.title('priceDetails', 'Price Details')} /></div>}
        </div>
      </DesignSection>
    ),

    rails: (
      <DesignSection id="rails" plain>
        <CartRails marketplaceTab={cart?.marketplaceTab} cartProductIds={cartItems.map((i) => String(i.productId || i.id))} accentHex={accentHex} />
      </DesignSection>
    ),

    safePayments: <DesignSection id="safePayments" plain><SafePayments /></DesignSection>,
  };

  return (
    <CartDesignProvider design={design}>
      <div className={`min-h-screen pb-24 font-sans text-slate-800 flex flex-col relative ${design.rootClass}`} style={design.rootStyle}>
        {/* Header */}
        <header className={`sticky top-0 z-[100] px-3 h-[52px] flex items-center justify-between ${design.headerClass}`} style={design.headerStyle}>
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform"
          >
            <ArrowLeft size={19} strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold">{t('nav.cart')}</h1>
          <Link to={shopNowLink} aria-label="Home" className="w-10 h-10 rounded-full flex items-center justify-center"><Home size={20} /></Link>
        </header>

        {!isAuthenticated ? (
          <LoginRequiredCard message="Please login to continue checkout" title="Login to see your cart" subtitle="Your cart is empty until you log in. Log in to add items and check out." icon={ShoppingCart} />
        ) : !loaded ? (
          <div className="mt-3 flex flex-col animate-pulse" style={{ gap: 'var(--cd-gap)', padding: '0 var(--cd-px)' }} aria-busy>
            <div className="h-16 rounded-xl bg-white" />
            <div className="h-36 rounded-xl bg-white" />
            <div className="h-40 rounded-xl bg-white" />
          </div>
        ) : cartItems.length === 0 ? (
          <>
            {tabSwitcher && <div style={{ padding: '8px var(--cd-px) 0' }}>{tabSwitcher}</div>}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-5">
                <ShoppingCart size={40} className="text-slate-400" />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900">{t('cart.empty')}</h2>
              <p className="text-[14px] text-slate-500 mt-1.5 mb-7">{t('cart.emptySubtitle')}</p>
              <Link to={shopNowLink} className="px-10 h-12 inline-flex items-center cd-btn text-white font-bold text-[14px] active:scale-95 transition-transform" style={{ background: accentHex }}>
                {t('cart.shopNow')}
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-2 md:grid md:grid-cols-3 md:gap-6 md:max-w-6xl md:mx-auto md:w-full md:py-4 md:items-start" style={{ padding: '0 var(--cd-px)', paddingTop: 8 }}>
            <div className="md:col-span-2 flex flex-col" style={{ gap: 'var(--cd-gap)' }}>
              <OrderedSections design={design} elements={sectionEls} />
            </div>

            <div className="hidden md:block md:col-span-1 space-y-3 md:sticky md:top-20">
              <BillSummary bill={bill} title={design.title('priceDetails', 'Price Details')} />
              {belowMinimum && <p className="text-[12.5px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{minimumHint}</p>}
              <button
                type="button"
                onClick={proceed}
                className="flex w-full h-12 cd-btn text-white font-bold text-[15px] items-center justify-center active:scale-[0.98] transition-transform"
                style={{ background: accentHex }}
              >
                {hasAddress ? t('cart.checkout') : t('cart.addAddress')}
              </button>
            </div>
          </div>
        )}

        {/* Sticky checkout bar (mobile) */}
        {isAuthenticated && cartItems.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl border-t border-slate-200 px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 md:hidden shadow-[0_-6px_20px_rgba(0,0,0,0.07)]">
            {belowMinimum && <p data-testid="min-order-hint" className="w-full text-[12px] font-semibold text-amber-800 leading-snug">{minimumHint}</p>}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 leading-none">Total Amount</p>
              <p className="text-[20px] font-extrabold text-slate-900 leading-none mt-1">{bill ? formatPrice(bill.total, bill.total % 1 !== 0) : '—'}</p>
            </div>
            <button
              type="button"
              onClick={proceed}
              data-testid="proceed-checkout"
              className="flex-1 max-w-[240px] h-12 cd-btn text-white font-bold text-[15px] active:scale-95 transition-transform"
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

      </div>
    </CartDesignProvider>
  );
};

export default Cart;
