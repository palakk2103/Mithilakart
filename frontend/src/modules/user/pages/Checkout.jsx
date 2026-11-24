import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, ChevronRight, ShieldCheck, Truck, Loader2, MapPin, Clock,
  CreditCard, Landmark, Banknote, Tag, Lock, Smartphone, Home, ShoppingCart, Percent, FileText,
} from 'lucide-react';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import useAccountStore from '../../../store/useAccountStore';
import { createOrder, quoteOrder, initiatePayment, verifyPayment } from '../services/ordersApi';
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
import OrderCredits from '../components/checkout/OrderCredits';
import { requestLogin } from '../../../shared/utils/loginRequired';
import SafePayments from '../components/checkout/SafePayments';
import { useCartDesign, CartDesignProvider, DesignSection, OrderedSections } from '../components/checkout/cartDesign';
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import LoginRequiredCard from '../../../shared/components/LoginRequiredCard';
import {
  Sheet, TipSheet, ActionCards, CouponOffers, AppliedStrip, PolicyBox, TrustBlock, CashbackBanner, BestOffer,
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
  const [quote, setQuote] = useState(null);
  const [giftCode, setGiftCode] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [quoting, setQuoting] = useState(false);
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
    if (quote) return billFromCart(quote, checkoutItems.length);
    if (buyNowItem) {
      const tab = checkoutItems.find((it) => it.marketplaceTab)?.marketplaceTab
        || (isQuickShopFlow ? 'quick_shop' : isFreshGroceryFlow ? 'groceries_fresh' : null);
      return estimateBill(checkoutItems, config || {}, 0, tab, tip);
    }
    return billFromCart(cart, checkoutItems.length);
  }, [quote, buyNowItem, checkoutItems, config, cart, tip, isQuickShopFlow, isFreshGroceryFlow]);

  const loadCart = useCallback(async (coupon, tipAmount = tip) => {
    const { items, cart: fetched } = await fetchCartItems(undefined, coupon || undefined, tipAmount);
    setCheckoutItems(items);
    setCart(fetched);
    setCartTab(fetched?.marketplaceTab || null);
    // The coupon stopped fitting this cart (items removed, expired…): drop it and say why.
    if (coupon && fetched?.couponError) {
      setAppliedCoupon('');
      setCouponMessage('');
      toast.error(fetched.couponError);
    }
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
        const res = await checkShippingServiceability({ pincode, cod: selectedPayment === 'COD' });
        // false only when the admin chose to block pincodes the courier refuses
        if (!cancelled) setCourierServiceable(res?.serviceable !== false);
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
    if (mins.length) return `Estimated Delivery in ${Math.min(...mins)}–${Math.max(...mins) + 15} min`;
    return isEcommerceFlow ? 'Estimated Delivery: standard courier' : null;
  })();

  const applyCode = async (rawCode) => {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) { toast.error(t('checkout.enterCoupon')); return; }
    try {
      // Priced by the server on the real cart, so seller coupons and limits are exact.
      const { cart: priced } = await fetchCartItems(undefined, code, tip);
      if (!priced) throw new Error(t('checkout.invalidCoupon'));
      if (priced.couponError) throw new Error(priced.couponError);
      const discount = Number(priced.couponDiscount) || 0;
      if (discount <= 0) throw new Error(t('checkout.invalidCoupon'));
      setAppliedCoupon(code);
      setCouponCode('');
      setSheet(null);
      setCouponMessage(`Best Offer Applied! You Save ${formatPrice(discount)}`);
      toast.success(t('checkout.couponApplied'));
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
    if (processing || quoting) return;
    if (!isAuthenticated('customer')) { requestLogin('Please login to continue checkout'); return; }
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
        ...(giftCode ? { giftCardCode: giftCode } : {}),
        ...(useWallet ? { useWallet: true } : {}),
        ...(quote ? { expectedTotal: quote.total } : {}),
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
      if (err?.status === 401) { requestLogin('Please login to continue checkout'); return; }
      const message = err?.message || t('checkout.couldNotPlace');
      toast.error(message.includes('Insufficient stock')
        ? t('checkout.itemsOutOfStock')
        : /payment|razorpay|another method/i.test(message) ? t('checkout.onlinePaymentFailed') : message);
    } finally {
      setProcessing(false);
    }
  };

  // The bill is always the server's: same inputs as the order itself.
  const buyNowLines = useMemo(() => (buyNowItem ? [{
    productId: buyNowItem.productId || buyNowItem._id || buyNowItem.id,
    ...(buyNowItem.listingId ? { listingId: buyNowItem.listingId } : {}),
    variantId: buyNowItem.variantId || null,
    quantity: Number(buyNowItem.quantity || buyNowItem.qty) || 1,
  }] : null), [buyNowItem]);
  const quoteMethod = currentStep === 3 ? (PAYMENT_METHOD_MAP[selectedPayment] || 'upi') : null;
  const orderFlow = () => {
    const itemTab = checkoutItems.find((it) => it.marketplaceTab)?.marketplaceTab;
    const themeTab = isMithilakFlow ? 'mithilak' : isQuickShopFlow ? 'quick_shop' : isFreshGroceryFlow ? 'groceries_fresh' : getMarketplaceTab();
    return TAB_TO_COMMERCE_FLOW[(!buyNowItem && cartTab) || itemTab || themeTab] || getCommerceFlow();
  };
  const quoteSeq = useRef(0);
  useEffect(() => {
    if (!loggedIn || loading || !checkoutItems.length) return undefined;
    const seq = ++quoteSeq.current;
    setQuoting(true);
    quoteOrder({
      commerceFlow: orderFlow(),
      ...(buyNowLines ? { items: buyNowLines } : {}),
      ...(quoteMethod ? { paymentMethod: quoteMethod } : {}),
      ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
      ...(tip > 0 ? { tipAmount: tip } : {}),
      ...(giftCode ? { giftCardCode: giftCode } : {}),
      ...(useWallet ? { useWallet: true } : {}),
    }).then((q) => {
      if (seq !== quoteSeq.current) return;
      setQuote(q);
      if (q.giftCardError && giftCode) { setGiftCode(''); toast.error(q.giftCardError); }
    }).catch((e) => {
      if (seq !== quoteSeq.current) return;
      setQuote(null);
      if (e?.status === 401) requestLogin('Please login to continue checkout');
    }).finally(() => { if (seq === quoteSeq.current) setQuoting(false); });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, loading, checkoutItems, buyNowLines, quoteMethod, appliedCoupon, tip, giftCode, useWallet]);

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
        <LoginRequiredCard title="Please login to continue checkout" subtitle="Your items are safe. Log in and you will come right back here." />
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
            <MapPin size={21} className="flex-shrink-0 mt-0.5" style={{ color: accentHex }} fill="currentColor" />
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
                <p data-testid="estimated-delivery" className="flex items-center gap-1.5 mt-1.5 text-emerald-700 text-[13px] font-bold"><Clock size={14} /> {etaText}</p>
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
          <h2 className="flex items-center gap-2 text-[16px] font-bold cd-heading mb-2.5"><ShoppingCart size={19} /> {sd.title('items', 'Your Cart Items')} ({checkoutItems.length})</h2>
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
          {appliedCoupon && couponMessage ? (
            <div className="mt-2 flex items-center gap-2" data-testid="best-offer-applied">
              <div className="flex-1"><AppliedStrip message={couponMessage} /></div>
              <button type="button" onClick={removeCoupon} className="h-9 px-2 text-[12px] font-bold text-slate-600 underline flex-shrink-0">Remove</button>
            </div>
          ) : (
            <BestOffer subtotal={bill?.subtotal || 0} accentHex={accentHex} onApply={applyCode} onMore={() => setSheet('offers')} />
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

    safePayments: <DesignSection id="safePayments" plain><SafePayments /></DesignSection>,

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
  const billTab = quote?.marketplaceTab || cartTab;
  const cashbackCfg = config?.cashback;
  const cashbackShown = cashbackCfg?.enabled && (!cashbackCfg.tabs?.length || !billTab || cashbackCfg.tabs.includes(billTab)) ? cashbackCfg : null;
  const paymentOffers = checkoutContent?.paymentOffers || {};
  const pd = designPayment;

  const paymentEls = {
    coupons: buyNowItem ? null : (
      <DesignSection id="coupons">
        <section className="cd-card">
          <h2 className="flex items-center gap-2 text-[16px] font-bold cd-heading mb-2.5"><Tag size={18} style={{ color: accentHex }} /> {pd.title('coupons', 'Coupons & Offers')}</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t('checkout.enterCode')}
              aria-label="Coupon code"
              className="flex-1 min-w-0 h-11 border border-slate-300 rounded-lg px-3 text-[14px] font-semibold uppercase focus:outline-none bg-white"
            />
            <button type="button" onClick={handleApplyCoupon} className="px-5 h-11 cd-btn text-white text-[13.5px] font-bold active:scale-95" style={{ background: accentHex }}>{t('auto.apply')}</button>
          </div>
          {appliedCoupon && couponMessage && <div className="mb-2"><AppliedStrip message={couponMessage} /></div>}
          <CouponOffers subtotal={bill?.subtotal || 0} appliedCode={appliedCoupon} accentHex={accentHex} onApply={applyCode} onRemove={removeCoupon} />
          {paymentOptions.filter((o) => paymentOffers[o.key]).map((o) => (
            <button key={o.id} type="button" onClick={() => setSelectedPayment(o.id)} className="w-full mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center gap-2.5 text-left min-h-[44px]">
              <Percent size={18} className="text-emerald-600 flex-shrink-0" />
              <span className="flex-1 text-[13px] font-semibold text-slate-800">{o.label}: {paymentOffers[o.key]}</span>
              <span className="text-[12px] font-bold" style={{ color: accentHex }}>Use</span>
            </button>
          ))}
        </section>
      </DesignSection>
    ),

    methods: (
      <DesignSection id="methods">
        <section className="cd-card">
          <h2 className="flex items-center gap-2 text-[16px] font-bold cd-heading mb-2.5"><Landmark size={18} style={{ color: accentHex }} /> {pd.title('methods', 'Select Payment Method')}</h2>
          <div role="radiogroup" aria-label="Payment method" className="space-y-2.5">
            {paymentOptions.map(({ id, key, label, sub, icon: Icon, tile }) => {
              const checked = selectedPayment === id;
              const earn = bill?.cashback?.offers?.[PAYMENT_METHOD_MAP[id]] || 0;
              const offer = earn > 0 ? `${formatPrice(earn)} cashback` : paymentOffers[key];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setSelectedPayment(id)}
                  className="w-full flex items-center gap-3 p-3 min-h-[64px] text-left rounded-xl border-2 transition-colors"
                  style={checked ? { borderColor: accentHex, background: `${accentHex}12` } : { borderColor: '#E2E8F0', background: '#fff' }}
                >
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tile }}>
                    <Icon size={21} className="text-white" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-bold text-slate-900 leading-tight">{label}</span>
                    <span className="block text-[12.5px] text-slate-500 leading-tight mt-0.5">{id === 'COD' && config?.codHandlingFee > 0 ? `Pay at your doorstep · +${formatPrice(config.codHandlingFee)} fee` : sub}</span>
                    {offer && <span className="block text-[12px] font-semibold text-emerald-700 leading-tight mt-0.5">{offer}</span>}
                  </span>
                  <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: checked ? accentHex : '#CBD5E1' }}>
                    {checked && <span className="w-3 h-3 rounded-full" style={{ background: accentHex }} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-1.5">
            <CashbackBanner cashback={cashbackShown} accentHex={accentHex} onMore={() => setSheet('cashback')} />
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
          <h2 className="flex items-center gap-2 text-[16px] font-bold cd-heading mb-2.5"><FileText size={18} style={{ color: accentHex }} /> {pd.title('orderSummary', 'Order Summary')} ({checkoutItems.length} {checkoutItems.length === 1 ? 'Item' : 'Items'})</h2>
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

    credits: (
      <DesignSection id="credits">
        <section className="cd-card">
          <OrderCredits bill={bill} accentHex={accentHex} giftCode={giftCode} onApplyGift={setGiftCode} onRemoveGift={() => setGiftCode('')} useWallet={useWallet} onWallet={setUseWallet} busy={quoting} />
        </section>
      </DesignSection>
    ),

    safePayments: <DesignSection id="safePayments" plain><SafePayments /></DesignSection>,

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
        <Sheet title={cashbackShown?.title || 'Cashback'} onClose={() => setSheet(null)}>
          <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-slate-700 leading-relaxed">{(cashbackShown?.rules || []).map((r) => <li key={r}>{r}</li>)}</ul>
          {cashbackShown?.terms && <p className="mt-3 text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{cashbackShown.terms}</p>}
        </Sheet>
      )}

      {/* Sticky action bar */}
      {!loading && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl border-t border-slate-200 px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.07)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-2.5">
            {currentStep === 2 ? (
              <>
                <Link to={shopNowLink} className="flex-1 h-12 px-2 cd-btn border-2 text-[13.5px] font-bold flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap bg-white" style={{ borderColor: accentHex, color: '#1E3A8A' }}>
                  <ArrowLeft size={16} /> Continue Shopping
                </Link>
                <button
                  type="button"
                  onClick={goToPayment}
                  className="flex-1 h-12 px-2 cd-btn text-white text-[13.5px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
                  style={{ background: accentHex }}
                >
                  Proceed to Payment <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-shrink-0">
                  <p className="text-[11px] font-semibold text-slate-500 leading-none">Total Amount</p>
                  <p className="text-[19px] font-extrabold text-slate-900 leading-none mt-1">{payLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={placeOrder}
                  data-testid="pay-button"
                  className="ml-auto h-12 px-5 cd-btn text-white text-[14.5px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
                  style={{ background: accentHex }}
                >
                  <Lock size={15} /> {selectedPayment === 'COD' || bill?.total === 0 ? 'Place Order' : `Pay ${payLabel} Securely`} <ArrowRight size={16} />
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
