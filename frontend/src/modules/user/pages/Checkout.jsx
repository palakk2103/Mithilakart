import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ChevronRight, ShieldCheck, Truck, Loader2, MapPin, Clock,
  CreditCard, Landmark, Banknote, Tag, CheckCircle2, Lock, RotateCcw, Smartphone, Home,
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
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import LoginRequiredCard from '../../../shared/components/LoginRequiredCard';

// Items from these tabs ship by courier whatever tab the page is themed for.
const TAB_TO_COMMERCE_FLOW = {
  mithilakart: 'standard',
  mithilak: 'mithilak',
  quick_shop: 'quick_shop',
  groceries_fresh: 'fresh_grocery',
};

const titleCase = (v) => String(v).toLowerCase().replace(/^./, (c) => c.toUpperCase());

const PAYMENT_METHOD_MAP = { UPI: 'upi', CARD: 'card', COD: 'cod', WALLET: 'wallet' };

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
  const { addOrder, savedAddresses, selectedAddressId, setSelectedAddress } = useAccountStore();
  const { location: liveLocation } = useLiveLocation();
  const [savingLiveAddress, setSavingLiveAddress] = useState(false);

  const theme = useTabTheme();
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const accentHex = theme.primaryHex || '#F5A400';
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
    if (buyNowItem) return estimateBill(checkoutItems, config || {}, 0);
    return billFromCart(cart, checkoutItems.reduce((n, i) => n + (Number(i.qty) || 1), 0));
  }, [buyNowItem, checkoutItems, config, cart]);

  const loadCart = useCallback(async (coupon) => {
    const { items, cart: fetched } = await fetchCartItems(undefined, coupon || undefined);
    setCheckoutItems(items);
    setCart(fetched);
    setCartTab(fetched?.marketplaceTab || null);
    return fetched;
  }, []);

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
  }, [loggedIn, buyNowItem, appliedCoupon]);

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

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { toast.error(t('checkout.enterCoupon')); return; }
    try {
      const result = await validateCoupon({ code, subtotal: bill?.subtotal || 0 });
      const discount = Number(result?.discountAmount ?? result?.discount ?? 0) || 0;
      if (discount <= 0) throw new Error(result?.message || t('checkout.invalidCoupon'));
      setAppliedCoupon(code);
      setCouponMessage(`Best Offer Applied! You Save ${formatPrice(discount)}`);
      toast.success(result?.message || t('checkout.couponApplied'));
    } catch (err) {
      setAppliedCoupon('');
      setCouponMessage('');
      toast.error(err?.message || t('checkout.invalidCoupon'));
    }
  };

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

  const headerBg = isFreshGroceryFlow ? 'bg-[color:var(--fg-primary,#D9A21B)]'
    : isMithilakFlow ? 'bg-[color:var(--ml-primary,#207C8A)]'
      : isQuickShopFlow ? 'bg-gradient-to-r from-[color:var(--qs-primary,#F26522)] to-[color:var(--qs-accent,#FF7A00)]'
        : 'bg-[#F5A400]';
  const pageBg = isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]' : isMithilakFlow ? 'bg-[color:var(--ml-light,#F5F9FA)]' : isQuickShopFlow ? 'bg-[color:var(--qs-light,#FFF5EE)]' : 'bg-[#FFF9E8]';

  const renderHeader = (title, onBack) => (
    <header className={`sticky top-0 z-50 px-4 h-14 flex items-center justify-between ${headerBg}`}>
      <button type="button" aria-label="Back" onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform">
        <ArrowLeft size={19} strokeWidth={2.5} />
      </button>
      <h1 className="text-[18px] font-bold text-white">{title}</h1>
      <Link to={shopNowLink} aria-label="Home" className="w-10 h-10 rounded-full flex items-center justify-center text-white">
        <Home size={20} />
      </Link>
    </header>
  );

  if (!loggedIn) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        {renderHeader("Checkout", () => navigate(-1))}
        <LoginRequiredCard title="Login to checkout" subtitle="Please log in to place your order." />
      </div>
    );
  }

  if (processing) {
    return (
      <div className={`min-h-screen flex items-center justify-center fixed inset-0 z-[1000] px-4 ${pageBg}`}>
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
      <div className={`min-h-screen ${pageBg}`}>
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

  const SummaryStep = (
    <div className="px-4 space-y-3 pb-36">
      {/* Delivery address */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5">
        <div className="flex items-start gap-3">
          <MapPin size={22} className="text-blue-700 flex-shrink-0 mt-0.5" fill="currentColor" />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-blue-900">
              {address ? `Deliver to ${titleCase(address.type || 'Home')}` : t('checkout.selectAddress')}
            </p>
            {address ? (
              <>
                <p className="text-[13px] text-slate-700 mt-0.5 leading-snug">
                  <span className="font-semibold">{address.name}</span>{address.phone ? ` · ${address.phone}` : ''}
                </p>
                <p className="text-[13px] text-slate-600 leading-snug">{address.address}{address.pincode ? ` - ${address.pincode}` : ''}</p>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 items-start">
                {canUseLiveLocation && (
                  <button type="button" onClick={useLiveLocationAsAddress} disabled={savingLiveAddress} className="text-[13px] font-bold px-4 h-10 rounded-full border border-slate-300 text-blue-800 disabled:opacity-60 text-left">
                    {savingLiveAddress ? 'Saving…' : `Use my current location — ${liveLocation.shortLabel || liveLocation.formattedAddress}`}
                  </button>
                )}
                <button type="button" onClick={() => navigate('/profile/addresses')} className="text-[13px] font-bold underline text-slate-600">Add a new address</button>
              </div>
            )}
            {etaText && address && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold"><Clock size={12} /> {etaText}</span>
            )}
          </div>
          {address && (
            <button type="button" onClick={() => navigate('/profile/addresses')} className="text-blue-800 text-[14px] font-bold flex items-center flex-shrink-0">
              Change <ChevronRight size={16} />
            </button>
          )}
        </div>
        {isEcommerceFlow && defaultAddress?.pincode && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-[12px]">
            {checkingServiceability ? (
              <p className="font-semibold text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('checkout.checkingCourier', { pin: defaultAddress.pincode })}</p>
            ) : courierServiceable === false ? (
              <p className="font-bold text-red-600">{t('checkout.courierUnavailablePin', { pin: defaultAddress.pincode })}</p>
            ) : courierServiceable ? (
              <p className="font-semibold text-emerald-700 flex items-center gap-1.5"><Truck size={14} /> {t('checkout.courierAvailablePin', { pin: defaultAddress.pincode })}</p>
            ) : null}
          </div>
        )}
      </section>

      <FreeDeliveryBar bill={bill} />

      {/* Cart items */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5">
        <h2 className="text-[16px] font-bold text-blue-900 mb-3">Your Cart Items ({checkoutItems.length})</h2>
        <div className="divide-y divide-slate-100">
          {checkoutItems.map((item, idx) => (
            <div key={item.cartId || idx} className="py-3 first:pt-0 last:pb-0">
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

      {/* Coupon */}
      {!buyNowItem && (
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Tag size={19} className="text-amber-500" />
            <h2 className="text-[16px] font-bold text-blue-900">{t('cart.applyCoupon')}</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t('checkout.enterCode')}
              aria-label="Coupon code"
              className="flex-1 min-w-0 h-11 border border-slate-300 rounded-xl px-3 text-[14px] font-semibold uppercase focus:outline-none focus:border-amber-500"
            />
            <button type="button" onClick={handleApplyCoupon} className="px-5 h-11 rounded-xl text-white text-[13px] font-bold active:scale-95" style={{ background: accentHex }}>
              {t('auto.apply')}
            </button>
          </div>
          {appliedCoupon && couponMessage && (
            <p className="mt-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-[13px] font-semibold px-3 py-2 flex items-center gap-2">
              <CheckCircle2 size={16} /> {couponMessage}
            </p>
          )}
        </section>
      )}

      <BillSummary bill={bill} />

      {/* Policy */}
      <Link to="/cancellation-returns" className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5 flex items-center gap-3">
        <RotateCcw size={20} className="text-blue-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-blue-900">Return, Exchange &amp; Cancellation Policy</p>
          <p className="text-[12px] text-slate-500 mt-0.5">Eligible products can be returned or exchanged within the specified time.</p>
        </div>
        <ChevronRight size={18} className="text-slate-400" />
      </Link>

      <p className="text-[11.5px] text-slate-500 text-center leading-relaxed px-3">
        {t('auth.termsText')} <Link to="/terms" className="underline">{t('auth.termsOfUse')}</Link> {t('auth.and')} <Link to="/privacy" className="underline">{t('auth.privacyPolicy')}</Link>
      </p>
    </div>
  );

  const paymentOptions = [
    { id: 'UPI', label: 'UPI', sub: 'Pay using any UPI app', icon: Smartphone },
    { id: 'CARD', label: 'Credit / Debit / ATM Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
    ...(codAllowed ? [{ id: 'COD', label: 'Cash on Delivery', sub: 'Pay at your doorstep', icon: Banknote }] : []),
  ];

  const PaymentStep = (
    <div className="px-4 space-y-3 pb-36">
      {appliedCoupon && bill?.couponDiscount > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5 flex items-center gap-3">
          <Tag size={20} className="text-emerald-600" />
          <p className="flex-1 text-[14px] font-semibold text-slate-800">
            <span className="font-bold">{appliedCoupon}</span> applied — you save {formatPrice(bill.couponDiscount)}
          </p>
        </section>
      )}

      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Landmark size={19} className="text-blue-700" />
          <h2 className="text-[16px] font-bold text-blue-900">Select Payment Method</h2>
        </div>
        <div role="radiogroup" aria-label="Payment method" className="divide-y divide-slate-100">
          {paymentOptions.map(({ id, label, sub, icon: Icon }) => {
            const checked = selectedPayment === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setSelectedPayment(id)}
                className="w-full flex items-center gap-3 py-3.5 text-left"
              >
                <span
                  className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: checked ? accentHex : '#CBD5E1' }}
                >
                  {checked && <span className="w-[11px] h-[11px] rounded-full" style={{ background: accentHex }} />}
                </span>
                <Icon size={22} className="text-slate-700 flex-shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-slate-900">{label}</span>
                  <span className="block text-[12px] text-slate-500">{label === 'Cash on Delivery' && config?.codHandlingFee > 0 ? `Pay at your doorstep · +${formatPrice(config.codHandlingFee)} fee` : sub}</span>
                </span>
              </button>
            );
          })}
        </div>
        {import.meta.env.DEV && (
          <p className="mt-2 rounded-lg bg-blue-50 text-blue-900 text-[11.5px] px-3 py-2">
            Razorpay test mode: use card <span className="font-mono">4111 1111 1111 1111</span> or UPI <span className="font-mono">success@razorpay</span>.
          </p>
        )}
      </section>

      <BillSummary bill={bill} title="Order Summary" />

      <p className="flex items-center justify-center gap-1.5 text-[12px] text-slate-500 font-medium">
        <ShieldCheck size={15} /> {t('checkout.happyCustomers')}
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans text-slate-800 relative ${pageBg}`}>
      {renderHeader(currentStep === 3 ? 'Payment' : 'Order Summary', () => (currentStep === 3 ? setCurrentStep(2) : navigate(-1)))}
      <CheckoutStepper current={currentStep} accentHex={accentHex} />

      <main className="max-w-xl mx-auto pt-1">
        {loading ? (
          <div className="px-4 mt-3 space-y-3 animate-pulse" aria-busy>
            <div className="h-24 rounded-2xl bg-white" /><div className="h-48 rounded-2xl bg-white" /><div className="h-56 rounded-2xl bg-white" />
          </div>
        ) : currentStep === 2 ? SummaryStep : PaymentStep}
      </main>

      {/* Sticky action bar */}
      {!loading && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            {currentStep === 2 ? (
              <>
                <Link to={shopNowLink} className="h-12 px-4 rounded-full border-2 text-[14px] font-bold flex items-center gap-1.5 flex-shrink-0 active:scale-95" style={{ borderColor: accentHex, color: accentHex }}>
                  <ArrowLeft size={16} /> <span className="hidden min-[380px]:inline">Continue Shopping</span><span className="min-[380px]:hidden">Shop</span>
                </Link>
                <button
                  type="button"
                  onClick={goToPayment}
                  disabled={checkingServiceability || courierServiceable === false || belowMinimum}
                  className="flex-1 h-12 rounded-full text-white text-[15px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: accentHex }}
                >
                  Proceed to Payment <ChevronRight size={17} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-shrink-0">
                  <p className="text-[11.5px] font-semibold text-slate-500">Total Amount</p>
                  <p className="text-[20px] font-extrabold text-slate-900 leading-none mt-0.5">{payLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={!selectedPayment || checkingServiceability || courierServiceable === false}
                  className="flex-1 h-12 rounded-full text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: accentHex }}
                >
                  <Lock size={16} /> {selectedPayment === 'COD' ? 'Place Order' : `Pay ${payLabel} Securely`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
