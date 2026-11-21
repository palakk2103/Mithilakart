import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, ChevronRight, ShieldCheck, Truck, Loader2, MapPin, Clock,
  CreditCard, Landmark, Banknote, Tag, Lock, Smartphone, Home, ShoppingCart, Percent, FileText,
} from 'lucide-react';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import useAccountStore from '../../../store/useAccountStore';
import { createOrder, initiatePayment, verifyPayment, validateCoupon } from '../services/ordersApi';
import { checkShippingServiceability } from '../services/shippingApi';
import { getAddresses, createAddress, getProfile } from '../services/userApi';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import {
  fetchCartItems, getCommerceFlow, getMarketplaceTab, clearCart, dispatchCartUpdated,
  updateCartItemQuantity, removeCartItemById,
} from '../utils/cartUtils';
import { getStorefrontConfig } from '../services/storefrontApi';
import { openRazorpayCheckout } from '../../../shared/services/razorpay';
import { toast } from 'react-hot-toast';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import { billFromCart, estimateBill } from '../utils/billing';
import BillSummary from '../components/checkout/BillSummary';
import FreeDeliveryBar from '../components/checkout/FreeDeliveryBar';
import CartLine from '../components/checkout/CartLine';
import { useCartDesign, CartDesignProvider, DesignSection, OrderedSections } from '../components/checkout/cartDesign';
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import LoginRequiredCard from '../../../shared/components/LoginRequiredCard';
import {
  Sheet, TipSheet, ActionCards, CouponOffers, AppliedStrip, PolicyBox, TrustBlock, CashbackBanner,
} from '../components/checkout/CheckoutExtras';

// Items from these tabs ship by courier whatever tab the page is themed for.
const TAB_TO_COMMERCE_FLOW = {
  mithilakart: 'standard',
  mithilak: 'mithilak',
  quick_shop: 'quick_shop',
  groceries_fresh: 'fresh_grocery',
};

const titleCase = (v) => String(v).toLowerCase().replace(/^./, (c) => c.toUpperCase());

const PAYMENT_METHOD_MAP = { UPI: 'upi', PHONEPE: 'upi', CARD: 'card', COD: 'cod', WALLET: 'wallet' };

const Checkout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn] = useState(() => isAuthenticated('customer'));
  const [currentStep, setCurrentStep] = useState(2); // 1: Address (done), 2: Summary, 3: Payment
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [tip, setTip] = useState(0);
  const [sheet, setSheet] = useState(null); // 'tip' | 'offers' | 'cashback'
  const { addOrder, savedAddresses, selectedAddressId, setSelectedAddress } = useAccountStore();
  const { location: liveLocation } = useLiveLocation();
  const [savingLiveAddress, setSavingLiveAddress] = useState(false);

  const theme = useTabTheme();
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const designSummary = useCartDesign('summary');
  const designPayment = useCartDesign('payment');
  const design = currentStep === 3 ? designPayment : designSummary;
  const accentHex = designSummary.accent;
  const shopNowLink = isMithilakFlow ? '/mithilak' : isFreshGroceryFlow ? '/fresh-grocery' : (isQuickShopFlow ? '/quick-shop' : '/vendor/home');
  const isEcommerceFlow = !isQuickShopFlow && !isFreshGroceryFlow;

  const buyNowItem = location.state?.product || null;
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [cartTab, setCartTab] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyLine, setBusyLine] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [courierServiceable, setCourierServiceable] = useState(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);

  // Server-priced bill for a cart; estimated with the same admin rules for Buy Now.
  const bill = useMemo(() => {
    if (buyNowItem) {
      const tab = checkoutItems.find((it) => it.marketplaceTab)?.marketplaceTab
        || (isQuickShopFlow ? 'quick_shop' : isFreshGroceryFlow ? 'groceries_fresh' : null);
      return estimateBill(checkoutItems, config || {}, 0, tab, tip);
    }
    return billFromCart(cart, checkoutItems.length);
  }, [buyNowItem, checkoutItems, config, cart, tip, isQuickShopFlow, isFreshGroceryFlow]);

  const loadCart = useCallback(async (coupon, tipAmount = tip) => {
    const { items, cart: fetched } = await fetchCartItems(undefined, coupon || undefined, tipAmount);
    setCheckoutItems(items);
    setCart(fetched);
    setCartTab(fetched?.marketplaceTab || null);
    return fetched;
  }, [tip]);

  useEffect(() => {
    if (!loggedIn) { setLoading(false); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getStorefrontConfig().catch(() => null);
        if (!cancelled) setConfig(cfg);
        if (buyNowItem) {
          if (!cancelled) setCheckoutItems([buyNowItem]);
        } else if (!cancelled) {
          await loadCart(appliedCoupon);
        }
      } catch {
        if (!cancelled) setCheckoutItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // Re-price only when the coupon changes; the first load happens once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, buyNowItem, appliedCoupon, tip]);

  useEffect(() => {
    let cancelled = false;
    const loadAddresses = async () => {
      const storePreferred = savedAddresses.find((item) => String(item.id || item._id) === String(selectedAddressId))
        || savedAddresses.find((item) => item.isDefault)
        || savedAddresses[0];
      if (storePreferred) {
        if (!cancelled) setDefaultAddress(storePreferred);
        return;
      }
      try {
        const addresses = await getAddresses();
        const list = Array.isArray(addresses) ? addresses
          : Array.isArray(addresses?.items) ? addresses.items
            : Array.isArray(addresses?.data) ? addresses.data : [];
        const preferred = list.find((item) => String(item.id || item._id) === String(selectedAddressId))
          || list.find((item) => item.isDefault) || list[0];
        if (!cancelled) setDefaultAddress(preferred || null);
      } catch {
        if (!cancelled) setDefaultAddress(null);
      }
    };
    if (loggedIn) loadAddresses();
    return () => { cancelled = true; };
  }, [savedAddresses, selectedAddressId, loggedIn]);

  useEffect(() => {
    if (!isEcommerceFlow || !defaultAddress?.pincode) { setCourierServiceable(null); return undefined; }
    const pincode = String(defaultAddress.pincode).replace(/\D/g, '').slice(0, 6);
    if (pincode.length !== 6) { setCourierServiceable(null); return undefined; }
    let cancelled = false;
    (async () => {
      setCheckingServiceability(true);
      try {
        await checkShippingServiceability({ pincode, cod: selectedPayment === 'COD' });
        if (!cancelled) setCourierServiceable(true);
      } catch {
        if (!cancelled) setCourierServiceable(true);
      } finally {
        if (!cancelled) setCheckingServiceability(false);
      }
    })();
    return () => { cancelled = true; };
  }, [defaultAddress?.pincode, isEcommerceFlow, selectedPayment]);

  useEffect(() => { window.scrollTo(0, 0); }, [currentStep]);

  const address = defaultAddress ? {
    ...defaultAddress,
    address: defaultAddress.address || defaultAddress.addressLine,
  } : null;

  const checkoutContent = config?.checkoutContent || null;
  const codAllowed = config?.codEnabled !== false;
  useEffect(() => {
    if (!codAllowed && selectedPayment === 'COD') setSelectedPayment('UPI');
  }, [codAllowed, selectedPayment]);

  const belowMinimum = bill && bill.minOrderAmount > 0 && bill.subtotal < bill.minOrderAmount;
  const etaText = (() => {
    const mins = checkoutItems.map((i) => Number(i.deliveryPromiseMinutes)).filter(Boolean);
    if (mins.length) return `ETA in ${Math.min(...mins)}–${Math.max(...mins) + 15} min`;
    return isEcommerceFlow ? 'Standard delivery' : null;
  })();

  const applyCode = async (rawCode) => {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) { toast.error(t('checkout.enterCoupon')); return; }
    try {
      const result = await validateCoupon({ code, subtotal: bill?.subtotal || 0 });
      const discount = Number(result?.discountAmount ?? result?.discount ?? 0) || 0;
      if (discount <= 0) throw new Error(result?.message || t('checkout.invalidCoupon'));
      setAppliedCoupon(code);
      setCouponCode('');
      setSheet(null);
      setCouponMessage(`Best Offer Applied! You Save ${formatPrice(discount)}`);
      toast.success(result?.message || t('checkout.couponApplied'));
    } catch (err) {
      setAppliedCoupon('');
      setCouponMessage('');
      toast.error(err?.message || t('checkout.invalidCoupon'));
    }
  };

  const handleApplyCoupon = () => applyCode(couponCode);
  const removeCoupon = () => { setAppliedCoupon(''); setCouponMessage(''); };
  const saveTip = (amount) => { setTip(Math.max(0, Math.min(500, Math.round(Number(amount) || 0)))); setSheet(null); };

  const changeQuantity = async (item, delta) => {
    if (busyLine || buyNowItem) return;
    setBusyLine(item.cartId);
    try {
      await updateCartItemQuantity(item, delta);
      await loadCart(appliedCoupon);
    } catch (e) {
      toast.error(e?.message || 'Could not update quantity');
      await loadCart(appliedCoupon);
    } finally {
      setBusyLine(null);
    }
  };

  const removeLine = async (item) => {
    if (buyNowItem) return;
    try {
      await removeCartItemById(item.cartId || item.itemKey || item.productId);
      const fetched = await loadCart(appliedCoupon);
      if (!fetched?.items?.length) navigate(shopNowLink.replace(/^\/$/, '/vendor/home'));
    } catch (e) {
      toast.error(e?.message || 'Could not remove item');
    }
  };

  // A new customer has no saved address, but we already know where they are.
  const canUseLiveLocation = Boolean(
    liveLocation?.latitude != null && liveLocation?.longitude != null
    && (liveLocation.addressLine || liveLocation.formattedAddress)
    && /^\d{6}$/.test(String(liveLocation.pincode || ''))
  );

  const useLiveLocationAsAddress = async () => {
    if (!canUseLiveLocation || savingLiveAddress) return;
    setSavingLiveAddress(true);
    try {
      const profile = await getProfile().catch(() => null);
      const me = profile?.data ?? profile ?? {};
      const phone = String(me.phone || '').replace(/\D/g, '').slice(-10);
      if (phone.length !== 10) {
        toast.error('Add your phone number to your profile, or add an address manually.');
        navigate('/profile/addresses');
        return;
      }
      const created = await createAddress({
        type: 'HOME',
        name: me.name || 'Me',
        phone,
        addressLine: liveLocation.addressLine || liveLocation.formattedAddress,
        city: liveLocation.city || undefined,
        state: liveLocation.state || undefined,
        pincode: String(liveLocation.pincode),
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        placeId: liveLocation.placeId || undefined,
        isDefault: true,
      });
      const saved = created?.data ?? created;
      setDefaultAddress(saved);
      if (saved?.id || saved?._id) setSelectedAddress(saved.id || saved._id);
      toast.success('Delivering to your current location');
    } catch (err) {
      toast.error(err?.message || 'Could not use your location. Please add an address.');
    } finally {
      setSavingLiveAddress(false);
    }
  };

  const goToPayment = () => {
    if (!defaultAddress) { toast.error('Add a delivery address to continue'); return; }
    if (belowMinimum) { toast.error(`Minimum order value is ${formatPrice(bill.minOrderAmount)}`); return; }
    if (isEcommerceFlow && courierServiceable === false) { toast.error(t('checkout.courierUnavailableChoose')); return; }
    setCurrentStep(3);
  };

  const placeOrder = async () => {
    if (processing) return;
    if (isEcommerceFlow && courierServiceable === false) { toast.error(t('checkout.courierUnavailable')); return; }
    setProcessing(true);
    try {
      const addressId = defaultAddress?.id || defaultAddress?._id;
      if (!addressId) throw new Error(t('checkout.addAddressFirst'));

      const paymentMethod = PAYMENT_METHOD_MAP[selectedPayment] || 'upi';
      const itemTab = checkoutItems.find((it) => it.marketplaceTab)?.marketplaceTab;
      const themeTab = isMithilakFlow ? 'mithilak' : isQuickShopFlow ? 'quick_shop' : isFreshGroceryFlow ? 'groceries_fresh' : getMarketplaceTab();
      // Checking out a cart: that cart's own tab decides everything.
      const resolvedTab = (!buyNowItem && cartTab) || itemTab || themeTab;
      const resolvedFlow = TAB_TO_COMMERCE_FLOW[resolvedTab] || getCommerceFlow();

      const buyNowItems = buyNowItem ? [{
        productId: buyNowItem.productId || buyNowItem._id || buyNowItem.id,
        ...(buyNowItem.listingId ? { listingId: buyNowItem.listingId } : {}),
        variantId: buyNowItem.variantId || null,
        quantity: Number(buyNowItem.quantity || buyNowItem.qty) || 1,
      }] : null;

      const result = await createOrder({
        addressId,
        paymentMethod,
        commerceFlow: resolvedFlow,
        ...(buyNowItems ? { items: buyNowItems } : {}),
        ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
        ...(tip > 0 ? { tipAmount: tip } : {}),
      });

      let paymentStatus = result.paymentStatus || result.payment?.paymentStatus;

      if (paymentMethod !== 'cod' && paymentStatus !== 'paid') {
        const paymentInit = result.payment?.keyId || result.payment?.mockPayment
          ? result.payment
          : await initiatePayment({ orderId: result.orderId, paymentMethod });

        if (paymentInit.paymentStatus === 'paid') {
          paymentStatus = 'paid';
        } else if (import.meta.env.DEV && (paymentInit.mockPayment || paymentInit.provider === 'mock')) {
          paymentStatus = 'paid';
        } else if (paymentInit.keyId) {
          const razorpayResult = await openRazorpayCheckout({
            keyId: paymentInit.keyId,
            amountInPaise: paymentInit.amountInPaise,
            providerOrderId: paymentInit.providerOrderId || paymentInit.providerPaymentId,
            orderId: result.orderId,
            prefill: { name: address?.name, contact: address?.phone },
          });
          const verified = await verifyPayment({
            orderId: result.orderId,
            providerPaymentId: razorpayResult.providerPaymentId,
            providerOrderId: razorpayResult.providerOrderId,
            signature: razorpayResult.signature,
          });
          paymentStatus = verified.paymentStatus;
        } else {
          throw new Error(t('checkout.onlineUnavailable'));
        }
      }

      if (paymentMethod !== 'cod' && paymentStatus !== 'paid') throw new Error(t('checkout.paymentNotCompleted'));

      const newOrder = {
        id: result.orderNumber || result.orderId,
        status: result.status || 'Confirmed',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: checkoutItems.map((item) => ({ name: item.name || item.title, price: item.price, image: item.image || item.img })),
      };
      addOrder(newOrder);
      // Buy Now bypasses the cart, so the cart's other items must survive it.
      if (!buyNowItems) await clearCart(resolvedTab);
      dispatchCartUpdated();
      navigate('/order-confirmation', { state: { placedOrder: newOrder, checkoutItems } });
    } catch (err) {
      console.error('Order failed', err);
      const message = err?.message || t('checkout.couldNotPlace');
      toast.error(message.includes('Insufficient stock')
        ? t('checkout.itemsOutOfStock')
        : /payment|razorpay|another method/i.test(message) ? t('checkout.onlinePaymentFailed') : message);
    } finally {
      setProcessing(false);
    }
  };

  // Header and page tint follow the active tab's theme (admin Tab Themes), never a fixed colour.
  const headerBg = design.headerClass;
  const pageBg = design.rootClass;

  const renderHeader = (title, onBack) => (
    <header className={`sticky top-0 z-50 px-3 h-[52px] flex items-center gap-3 ${headerBg}`} style={design.headerStyle}>
      <button type="button" aria-label="Back" onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform flex-shrink-0">
        <ArrowLeft size={19} strokeWidth={2.5} />
      </button>
      <h1 className="flex-1 min-w-0 text-[17px] font-bold truncate">{title}</h1>
      <Link to={shopNowLink} aria-label="Home" className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
        <Home size={20} />
      </Link>
    </header>
  );

  if (!loggedIn) {
    return (
      <div className={`min-h-screen ${pageBg}`} style={design.rootStyle}>
        {renderHeader("Checkout", () => navigate(-1))}
        <LoginRequiredCard title="Login to checkout" subtitle="Please log in to place your order." />
      </div>
    );
  }

  if (processing) {
    return (
      <div className={`min-h-screen flex items-center justify-center fixed inset-0 z-[1000] px-4 ${pageBg}`} style={design.rootStyle}>
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-sm w-full text-center flex flex-col items-center">
          <Loader2 size={46} className="animate-spin mb-5" style={{ color: accentHex }} />
          <p className="text-[17px] font-bold text-slate-900">{t('checkout.processingOrder')}</p>
          <p className="text-[13px] text-slate-500 mt-1.5">{t('checkout.doNotClose')}</p>
        </div>
      </div>
    );
  }

  if (!loading && checkoutItems.length === 0) {
    return (
      <div className={`min-h-screen ${pageBg}`} style={design.rootStyle}>
        {renderHeader("Checkout", () => navigate(-1))}
        <div className="flex flex-col items-center text-center px-6 py-20">
          <p className="text-[17px] font-bold text-slate-900">{t('cart.empty')}</p>
          <Link to={shopNowLink} className="mt-6 px-10 h-12 inline-flex items-center rounded-full text-white font-bold text-[14px]" style={{ background: accentHex }}>
            {t('cart.shopNow')}
          </Link>
        </div>
      </div>
    );
  }

  const payLabel = bill ? formatPrice(bill.total, bill.total % 1 !== 0) : '';

  const sd = designSummary;
  const summaryEls = {
    address: (
      <DesignSection id="address">
        <section className="cd-card">
          <div className="flex items-start gap-2">
            <MapPin size={20} className="text-blue-700 flex-shrink-0 mt-0.5" fill="currentColor" />
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-bold cd-heading leading-tight">
                {address ? `Deliver to ${titleCase(address.type || 'Home')}` : t('checkout.selectAddress')}
              </p>
              {address ? (
                <p className="text-[12px] mt-0.5 leading-snug line-clamp-3 cd-text">
                  <span className="font-semibold">{address.name}</span>{address.phone ? ` · ${address.phone}` : ''}
                  <br />
                  {address.address}{address.pincode && !String(address.address || '').includes(String(address.pincode)) ? ` - ${address.pincode}` : ''}
                </p>
              ) : (
                <div className="mt-1.5 flex flex-col gap-1.5 items-start">
                  {canUseLiveLocation && (
                    <button type="button" onClick={useLiveLocationAsAddress} disabled={savingLiveAddress} className="text-[12.5px] font-bold px-3 min-h-[40px] rounded-full border border-slate-300 text-blue-800 disabled:opacity-60 text-left">
                      {savingLiveAddress ? 'Saving…' : `Use my current location — ${liveLocation.shortLabel || liveLocation.formattedAddress}`}
                    </button>
                  )}
                  <button type="button" onClick={() => navigate('/profile/addresses')} className="text-[12.5px] font-bold underline text-slate-600 min-h-[36px]">Add a new address</button>
                </div>
              )}
              {etaText && address && (
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold"><Clock size={11} /> {etaText}</span>
              )}
            </div>
            {address && (
              <button type="button" onClick={() => navigate('/profile/addresses')} className="text-blue-800 text-[13px] font-bold flex items-center flex-shrink-0 min-h-[36px]">
                Change <ChevronRight size={15} />
              </button>
            )}
          </div>
          {isEcommerceFlow && defaultAddress?.pincode && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11.5px]">
              {checkingServiceability ? (
                <p className="font-semibold text-slate-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> {t('checkout.checkingCourier', { pin: defaultAddress.pincode })}</p>
              ) : courierServiceable === false ? (
                <p className="font-bold text-red-600">{t('checkout.courierUnavailablePin', { pin: defaultAddress.pincode })}</p>
              ) : courierServiceable ? (
                <p className="font-semibold text-emerald-700 flex items-center gap-1.5"><Truck size={13} /> {t('checkout.courierAvailablePin', { pin: defaultAddress.pincode })}</p>
              ) : null}
            </div>
          )}
        </section>
      </DesignSection>
    ),

    freeDelivery: <DesignSection id="freeDelivery" plain><FreeDeliveryBar bill={bill} /></DesignSection>,

    items: (
      <DesignSection id="items">
        <section className="cd-card">
          <h2 className="flex items-center gap-1.5 text-[14.5px] font-bold cd-heading mb-2"><ShoppingCart size={17} /> {sd.title('items', 'Your Cart Items')} ({checkoutItems.length})</h2>
          <div className="divide-y divide-slate-100">
            {checkoutItems.map((item, idx) => (
              <div key={item.cartId || idx} className="cd-row">
                <CartLine
                  item={item}
                  editable={!buyNowItem}
                  busy={busyLine === item.cartId}
                  limitMessage={cart?.limits?.message}
                  onIncrease={() => changeQuantity(item, 1)}
                  onDecrease={() => changeQuantity(item, -1)}
                  onRemove={() => removeLine(item)}
                />
              </div>
            ))}
          </div>
        </section>
      </DesignSection>
    ),

    // Coupon: ticket tile, title, input and APPLY on one compact row
    coupon: buyNowItem ? null : (
      <DesignSection id="coupon">
        <section className="cd-card">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentHex}22` }}><Percent size={20} style={{ color: accentHex }} /></span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[14px] font-bold cd-heading leading-tight">{sd.title('coupon', t('cart.applyCoupon'))}</h2>
              <div className="flex gap-1.5 mt-1">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t('checkout.enterCode')}
                  aria-label="Coupon code"
                  className="flex-1 min-w-0 h-9 border border-slate-300 rounded-lg px-2.5 text-[13px] font-semibold uppercase focus:outline-none bg-white"
                />
                <button type="button" onClick={handleApplyCoupon} className="px-4 h-9 cd-btn text-white text-[12.5px] font-bold active:scale-95" style={{ background: accentHex }}>
                  {t('auto.apply')}
                </button>
              </div>
            </div>
          </div>
          {appliedCoupon && couponMessage && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1"><AppliedStrip message={couponMessage} /></div>
              <button type="button" onClick={removeCoupon} className="h-9 px-2 text-[12px] font-bold text-slate-600 underline flex-shrink-0">Remove</button>
            </div>
          )}
        </section>
      </DesignSection>
    ),

    actions: buyNowItem ? null : (
      <DesignSection id="actions">
        <ActionCards content={checkoutContent} tip={tip} couponApplied={appliedCoupon} onTip={() => setSheet('tip')} onOffers={() => setSheet('offers')} />
      </DesignSection>
    ),

    bill: <DesignSection id="bill"><BillSummary bill={bill} title={sd.title('bill', 'Order Details')} /></DesignSection>,

    policy: <DesignSection id="policy"><PolicyBox content={checkoutContent} to="/cancellation-returns" /></DesignSection>,

    trust: <DesignSection id="trust"><TrustBlock content={checkoutContent} /></DesignSection>,

    terms: (
      <DesignSection id="terms" plain>
        <p className="text-[11px] text-slate-500 text-center leading-snug px-3">
          {t('auth.termsText')} <Link to="/terms" className="underline">{t('auth.termsOfUse')}</Link> {t('auth.and')} <Link to="/privacy" className="underline">{t('auth.privacyPolicy')}</Link>
        </p>
      </DesignSection>
    ),
  };

  const SummaryStep = (
    <div className="flex flex-col pb-24" style={{ gap: 'var(--cd-gap)', padding: '0 var(--cd-px) 96px' }}>
      <OrderedSections design={designSummary} elements={summaryEls} />
    </div>
  );

  // Neutral coloured tiles stand in for logos; official brand logos can be added later.
  const paymentOptions = [
    { id: 'UPI', key: 'upi', label: 'UPI', sub: 'Pay using any UPI app', icon: Smartphone, tile: '#4F46E5' },
    { id: 'PHONEPE', key: 'phonepe', label: 'PhonePe', sub: 'Pay with PhonePe UPI', icon: Smartphone, tile: '#7C3AED' },
    { id: 'CARD', key: 'card', label: 'Credit / Debit / ATM Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard, tile: '#2563EB' },
    ...(codAllowed ? [{ id: 'COD', key: 'cod', label: 'Cash on Delivery', sub: 'Pay at your doorstep', icon: Banknote, tile: '#16A34A' }] : []),
  ];
  const paymentOffers = checkoutContent?.paymentOffers || {};
  const pd = designPayment;

  const paymentEls = {
    coupons: buyNowItem ? null : (
      <DesignSection id="coupons">
        <section className="cd-card">
          <h2 className="flex items-center gap-1.5 text-[14.5px] font-bold cd-heading mb-2"><Tag size={17} className="text-blue-600 fill-blue-600" /> {pd.title('coupons', 'Coupons & Offers')}</h2>
          <CouponOffers subtotal={bill?.subtotal || 0} appliedCode={appliedCoupon} accentHex={accentHex} onApply={applyCode} onRemove={removeCoupon} />
        </section>
      </DesignSection>
    ),

    methods: (
      <DesignSection id="methods">
        <section className="cd-card">
          <h2 className="flex items-center gap-1.5 text-[14.5px] font-bold cd-heading mb-1"><Landmark size={17} className="text-blue-700" /> {pd.title('methods', 'Select Payment Method')}</h2>
          <div role="radiogroup" aria-label="Payment method" className="divide-y divide-slate-100">
            {paymentOptions.map(({ id, key, label, sub, icon: Icon, tile }) => {
              const checked = selectedPayment === id;
              const offer = paymentOffers[key];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setSelectedPayment(id)}
                  className="w-full flex items-center gap-2.5 py-2 min-h-[52px] text-left"
                >
                  <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: checked ? accentHex : '#CBD5E1' }}>
                    {checked && <span className="w-2.5 h-2.5 rounded-full" style={{ background: accentHex }} />}
                  </span>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tile }}>
                    <Icon size={17} className="text-white" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-semibold text-slate-900 leading-tight">{label}</span>
                    <span className="block text-[11.5px] text-slate-500 leading-tight">{id === 'COD' && config?.codHandlingFee > 0 ? `Pay at your doorstep · +${formatPrice(config.codHandlingFee)} fee` : sub}</span>
                    {offer && <span className="block text-[11.5px] font-semibold text-emerald-700 leading-tight mt-0.5">{offer}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-1.5">
            <CashbackBanner content={checkoutContent} accentHex={accentHex} onMore={() => setSheet('cashback')} />
          </div>
          {import.meta.env.DEV && (
            <p className="mt-1.5 rounded-lg bg-blue-50 text-blue-900 text-[11px] px-2.5 py-1.5">
              Razorpay test mode: use card <span className="font-mono">4111 1111 1111 1111</span> or UPI <span className="font-mono">success@razorpay</span>.
            </p>
          )}
        </section>
      </DesignSection>
    ),

    orderSummary: (
      <DesignSection id="orderSummary">
        <section className="cd-card">
          <h2 className="flex items-center gap-1.5 text-[14.5px] font-bold cd-heading mb-2"><FileText size={17} className="text-blue-700" /> {pd.title('orderSummary', 'Order Summary')} ({checkoutItems.length} {checkoutItems.length === 1 ? 'Item' : 'Items'})</h2>
          <div className="divide-y divide-slate-100">
            {checkoutItems.map((item, idx) => (
              <div key={item.cartId || idx} className="cd-row">
                <CartLine item={item} editable={false} />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-2 mt-1">
            <BillSummary bill={bill} bare title="Order Details" />
          </div>
        </section>
      </DesignSection>
    ),

    note: (
      <DesignSection id="note" plain>
        <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-slate-500 font-medium">
          <ShieldCheck size={14} /> {t('checkout.happyCustomers')}
        </p>
      </DesignSection>
    ),
  };

  const PaymentStep = (
    <div className="flex flex-col" style={{ gap: 'var(--cd-gap)', padding: '0 var(--cd-px) 96px' }}>
      <OrderedSections design={designPayment} elements={paymentEls} />
    </div>
  );

  return (
    <CartDesignProvider design={design}>
    <div className={`min-h-screen font-sans text-slate-800 relative ${pageBg}`} style={design.rootStyle}>
      {renderHeader(currentStep === 3 ? 'Payment' : 'Order Summary', () => (currentStep === 3 ? setCurrentStep(2) : navigate(-1)))}
      <CheckoutStepper current={currentStep} accentHex={accentHex} />

      <main className="max-w-xl mx-auto pt-1">
        {loading ? (
          <div className="px-3 mt-2 space-y-2 animate-pulse" aria-busy>
            <div className="h-20 rounded-xl bg-white" /><div className="h-36 rounded-xl bg-white" /><div className="h-44 rounded-xl bg-white" />
          </div>
        ) : currentStep === 2 ? SummaryStep : PaymentStep}
      </main>

      {sheet === 'tip' && <TipSheet value={tip} accentHex={accentHex} onSave={saveTip} onClose={() => setSheet(null)} />}
      {sheet === 'offers' && (
        <Sheet title="Vouchers & Offers" onClose={() => setSheet(null)}>
          <CouponOffers subtotal={bill?.subtotal || 0} appliedCode={appliedCoupon} accentHex={accentHex} onApply={applyCode} onRemove={removeCoupon} />
        </Sheet>
      )}
      {sheet === 'cashback' && (
        <Sheet title={checkoutContent?.cashbackBanner?.title || 'Cashback'} onClose={() => setSheet(null)}>
          <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-line">{checkoutContent?.cashbackBanner?.details}</p>
        </Sheet>
      )}

      {/* Sticky action bar */}
      {!loading && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl border-t border-slate-200 px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.07)]">
          <div className="max-w-xl mx-auto flex items-center gap-2.5">
            {currentStep === 2 ? (
              <>
                <Link to={shopNowLink} className="flex-1 h-11 px-2 cd-btn border-2 text-[13.5px] font-bold flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap bg-white" style={{ borderColor: accentHex, color: '#1E3A8A' }}>
                  <ArrowLeft size={16} /> Continue Shopping
                </Link>
                <button
                  type="button"
                  onClick={goToPayment}
                  disabled={checkingServiceability || courierServiceable === false || belowMinimum}
                  className="flex-1 h-11 px-2 cd-btn text-white text-[13.5px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 whitespace-nowrap"
                  style={{ background: accentHex }}
                >
                  Proceed to Payment <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-shrink-0 pr-2.5 border-r border-slate-300">
                  <p className="text-[11px] font-semibold text-slate-500 leading-none">Total Amount</p>
                  <p className="text-[19px] font-extrabold text-slate-900 leading-none mt-1">{payLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={!selectedPayment || checkingServiceability || courierServiceable === false}
                  className="flex-1 h-11 cd-btn text-white text-[14px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 whitespace-nowrap"
                  style={{ background: accentHex }}
                >
                  <Lock size={15} /> {selectedPayment === 'COD' ? 'Place Order' : `Pay ${payLabel} Securely`} <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </CartDesignProvider>
  );
};

export default Checkout;
