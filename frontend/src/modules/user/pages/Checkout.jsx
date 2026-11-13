import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tName } from '../../../shared/utils/translateName';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, ShieldCheck, 
  Star, Truck, CheckCircle, Zap, Loader2, IndianRupee, CreditCard
} from 'lucide-react';
import { parsePrice, formatPrice } from '../../../shared/utils/priceFormatter';
import useAccountStore from '../../../store/useAccountStore';
import { createOrder, initiatePayment, verifyPayment, validateCoupon } from '../services/ordersApi';
import { checkShippingServiceability } from '../services/shippingApi';
import { getAddresses, createAddress, getProfile } from '../services/userApi';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { fetchCartItems, getCommerceFlow, getMarketplaceTab, clearCart, dispatchCartUpdated } from '../utils/cartUtils';
import { getStorefrontConfig } from '../services/storefrontApi';
import { openRazorpayCheckout } from '../../../shared/services/razorpay';
import { toast } from 'react-hot-toast';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import { handleImageError } from '../../../shared/utils/imageUtils';

// Items from these tabs ship by courier whatever tab the page is themed for.
const STANDARD_TABS = new Set(['mithilakart', 'mithilak']);

const TAB_TO_COMMERCE_FLOW = {
  mithilakart: 'standard',
  mithilak: 'mithilak',
  quick_shop: 'quick_shop',
  groceries_fresh: 'fresh_grocery',
};

const PAYMENT_METHOD_MAP = {
  UPI: 'upi',
  CARD: 'card',
  COD: 'cod',
  WALLET: 'wallet',
};

const Checkout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2); // 1: Address, 2: Order Summary, 3: Payment
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const [selectedUpi, setSelectedUpi] = useState('paytm');
  const [orderStatus, setOrderStatus] = useState('idle'); // 'idle', 'processing', 'success'
  const [placedOrder, setPlacedOrder] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const { addOrder, savedAddresses, selectedAddressId, setSelectedAddress } = useAccountStore();
  const { location: liveLocation } = useLiveLocation();
  const [savingLiveAddress, setSavingLiveAddress] = useState(false);

  const theme = useTabTheme();
  const isMithilakFlow = theme.activeFlow === 'mithilak';
  const isQuickShopFlow = theme.activeFlow === 'quickshop';
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery';
  const primaryBg = theme.primaryBg;
  const primaryBgHover = `${theme.primaryBg} ${theme.primaryBgHover}`;
  const primaryText = theme.primaryText;
  const primaryBorder = theme.primaryBorder;
  const shopNowLink = isMithilakFlow ? '/mithilak' : isFreshGroceryFlow ? '/fresh-grocery' : (isQuickShopFlow ? '/quick-shop' : '/vendor/home');

  const [checkoutItems, setCheckoutItems] = useState([]);
  // The tab whose cart is being checked out (echoed by the server for the cart we loaded).
  const [cartTab, setCartTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [courierServiceable, setCourierServiceable] = useState(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);

  const isEcommerceFlow = !isQuickShopFlow && !isFreshGroceryFlow;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (location.state?.product) {
        if (!cancelled) {
          const buyProduct = location.state.product;
          setCheckoutItems([buyProduct]);
          try {
            const config = await getStorefrontConfig();
            const threshold = Number(config?.freeShippingThreshold) || 500;
            const fee = Number(config?.defaultDeliveryCharge) || 39;
            const pFee = Number(config?.platformFee) || 0;
            const tRate = Number(config?.taxRate) || 0;
            const itemSubtotal = (Number(buyProduct.price) || 0) * (Number(buyProduct.quantity || buyProduct.qty) || 1);
            setDeliveryFee(itemSubtotal >= threshold ? 0 : fee);
            setPlatformFee(pFee);
            setTaxAmount(Math.round(itemSubtotal * tRate * 100) / 100);
          } catch {
            setDeliveryFee(39);
            setPlatformFee(0);
            setTaxAmount(0);
          }
          setLoading(false);
        }
        return;
      }

      try {
        const { items, cart } = await fetchCartItems();
        if (!cancelled) {
          setCheckoutItems(items.length ? items : []);
          setCartTab(cart?.marketplaceTab || null);
          setDeliveryFee(Number(cart?.deliveryCharge ?? cart?.shippingFee ?? 0) || 0);
          setPlatformFee(Number(cart?.platformFee ?? 0) || 0);
          setTaxAmount(Number(cart?.tax ?? 0) || 0);
        }
      } catch {
        if (!cancelled) {
          setCheckoutItems([]);
          setDeliveryFee(0);
          setPlatformFee(0);
          setTaxAmount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadAddresses = async () => {
      // Find from Zustand store first
      const storePreferred = savedAddresses.find((item) => String(item.id || item._id) === String(selectedAddressId)) ||
                             savedAddresses.find((item) => item.isDefault) ||
                             savedAddresses[0];

      if (storePreferred) {
        if (!cancelled) setDefaultAddress(storePreferred);
        return;
      }

      try {
        const addresses = await getAddresses();
        const list = Array.isArray(addresses)
          ? addresses
          : Array.isArray(addresses?.items)
            ? addresses.items
            : Array.isArray(addresses?.data)
              ? addresses.data
              : [];
        const apiPreferred = list.find((item) => String(item.id || item._id) === String(selectedAddressId)) ||
                             list.find((item) => item.isDefault) ||
                             list[0];
        if (!cancelled) setDefaultAddress(apiPreferred || null);
      } catch {
        if (!cancelled) setDefaultAddress(null);
      }
    };

    loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [savedAddresses, selectedAddressId]);

  useEffect(() => {
    if (!isEcommerceFlow || !defaultAddress?.pincode) {
      setCourierServiceable(null);
      return undefined;
    }

    let cancelled = false;
    const pincode = String(defaultAddress.pincode).replace(/\D/g, '').slice(0, 6);
    if (pincode.length !== 6) {
      setCourierServiceable(null);
      return undefined;
    }

    const verify = async () => {
      setCheckingServiceability(true);
      try {
        const result = await checkShippingServiceability({
          pincode,
          cod: selectedPayment === 'COD',
        });
        if (!cancelled) setCourierServiceable(true);
      } catch {
        if (!cancelled) setCourierServiceable(true);
      } finally {
        if (!cancelled) setCheckingServiceability(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [defaultAddress?.pincode, isEcommerceFlow, selectedPayment]);

  const totalPrice = checkoutItems.reduce((acc, item) => {
    return acc + parsePrice(item.price) * parsePrice(item.qty || 1);
  }, 0);

  const totalOldPrice = checkoutItems.reduce((acc, item) => {
    return acc + parsePrice(item.oldPrice || item.price) * parsePrice(item.qty || 1);
  }, 0);

  const firstItem = checkoutItems[0] || { name: 'Order', price: 0, image: '' };

  const address = defaultAddress ? {
    ...defaultAddress,
    type: defaultAddress.type || 'HOME',
    address: defaultAddress.address || defaultAddress.addressLine,
  } : {
    name: t('auto.guestUser'),
    type: 'HOME',
    address: t('x.noAddressProvided'),
    phone: '—',
  };

  // Auth guard — redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated('customer')) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const payableTotal = Math.max(0, totalPrice + deliveryFee + platformFee + taxAmount - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t('checkout.enterCoupon'));
      return;
    }
    try {
      const result = await validateCoupon({
        code: couponCode.trim().toUpperCase(),
        subtotal: totalPrice,
      });
      const discount = result?.discountAmount ?? result?.discount ?? 0;
      setCouponDiscount(Number(discount) || 0);
      setCouponApplied(true);
      toast.success(result?.message || t('checkout.couponApplied'));
    } catch (err) {
      setCouponDiscount(0);
      setCouponApplied(false);
      toast.error(err?.message || t('checkout.invalidCoupon'));
    }
  };

  // A new customer has no saved address, but we already know where they are.
  // Offer the live location as the delivery address instead of a dead end.
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

  const handleContinue = async () => {
    if (currentStep === 2 && !defaultAddress) {
      toast.error('Add a delivery address to continue');
      return;
    }
    if (currentStep === 2) {
      if (isEcommerceFlow && courierServiceable === false) {
        toast.error(t('checkout.courierUnavailableChoose'));
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (isEcommerceFlow && courierServiceable === false) {
        toast.error(t('checkout.courierUnavailable'));
        return;
      }
      setOrderStatus('processing');

      try {
        const addressId = defaultAddress?.id || defaultAddress?._id;
        if (!addressId) {
          throw new Error(t('checkout.addAddressFirst'));
        }

        const paymentMethod = PAYMENT_METHOD_MAP[selectedPayment] || 'upi';

        // The tab an item was added from decides quick vs standard delivery.
        // Product-level flows are not used: a product sold in both Quick Shop
        // and Mithilakart must ship the way the customer bought it.
        const itemTab = checkoutItems.find((it) => it.marketplaceTab)?.marketplaceTab;
        const themeTab = isMithilakFlow ? 'mithilak' : isQuickShopFlow ? 'quick_shop' : isFreshGroceryFlow ? 'groceries_fresh' : getMarketplaceTab();
        // Checking out a cart: that cart's own tab decides everything.
        const resolvedTab = (!location.state?.product && cartTab) || itemTab || themeTab;
        const resolvedFlow = TAB_TO_COMMERCE_FLOW[resolvedTab] || getCommerceFlow();

        const buyNowItem = location.state?.product;
        const buyNowItems = buyNowItem ? [
          {
            productId: buyNowItem.productId || buyNowItem._id || buyNowItem.id,
            ...(buyNowItem.listingId ? { listingId: buyNowItem.listingId } : {}),
            variantId: buyNowItem.variantId || null,
            quantity: Number(buyNowItem.quantity || buyNowItem.qty) || 1,
          }
        ] : null;

        const result = await createOrder({
          addressId,
          paymentMethod,
          commerceFlow: resolvedFlow,
          ...(buyNowItems ? { items: buyNowItems } : {}),
          ...(couponApplied && couponCode ? { couponCode: couponCode.trim().toUpperCase() } : {}),
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
              prefill: {
                name: address.name,
                contact: address.phone,
              },
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

        if (paymentMethod !== 'cod' && paymentStatus !== 'paid') {
          throw new Error(t('checkout.paymentNotCompleted'));
        }

        const newOrder = {
          id: result.orderNumber || result.orderId,
          status: result.status || 'Confirmed',
          date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          items: checkoutItems.map((item) => ({
            name: item.name || item.title,
            price: item.price,
            image: item.image || item.img,
          })),
        };

        addOrder(newOrder);
        setPlacedOrder(newOrder);
        // Buy Now bypasses the cart, so the cart's other items must survive it.
        if (!buyNowItems) await clearCart(resolvedTab);
        dispatchCartUpdated();
        navigate('/order-confirmation', { state: { placedOrder: newOrder, checkoutItems } });
        setOrderStatus('idle');
      } catch (err) {
        console.error('Order failed', err);
        const message = err?.message || t('checkout.couldNotPlace');
        toast.error(message.includes('Insufficient stock')
          ? t('checkout.itemsOutOfStock')
          : message.includes('Payment') || message.includes('payment') || message.includes('Razorpay') || message.includes('another method')
            ? t('checkout.onlinePaymentFailed')
            : message);
        setOrderStatus('idle');
      }
    }
  };

  const renderStepper = () => (
    <div className={`px-4 py-3.5 sticky top-14 z-40 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]' : 'bg-[#f0f3f6]'}`}>
      <div className="flex items-center justify-between relative max-w-sm mx-auto">
        {/* Connecting Lines */}
        <div className="absolute top-3.5 left-[15%] right-[15%] h-[2.5px] bg-slate-200 -z-0">
          <div className={`h-full ${primaryBg} transition-all duration-500`} style={{ width: currentStep === 2 ? '50%' : currentStep === 3 ? '100%' : '0%' }}></div>
        </div>

        {/* Step 1: Address */}
        <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]' : 'bg-[#f0f3f6]'}`}>
          <div className={`w-7 h-7 rounded-full ${primaryBg} text-white flex items-center justify-center text-[11px] font-black shadow-xs`}>
            <CheckCircle2 size={15} />
          </div>
          <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">{t('address.title')}</span>
        </div>

        {/* Step 2: Order Summary */}
        <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]' : 'bg-[#f0f3f6]'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-xs ${currentStep >= 2 ? `${primaryBg} text-white` : 'bg-white text-slate-400'}`}>
            {currentStep > 2 ? <CheckCircle2 size={15} /> : '2'}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${currentStep === 2 ? primaryText : 'text-slate-450'}`}>{t('checkout.orderSummary')}</span>
        </div>

        {/* Step 3: Payment */}
        <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]' : 'bg-[#f0f3f6]'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-xs ${currentStep === 3 ? `${primaryBg} text-white` : 'bg-white text-slate-400'}`}>
            3
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${currentStep === 3 ? primaryText : 'text-slate-450'}`}>{t('checkout.paymentMethod')}</span>
        </div>
      </div>
    </div>
  );

  const renderOrderSummary = () => (
    <div className="animate-in fade-in slide-in-from-right duration-300 px-4 space-y-4">
      {/* Deliver To */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-100/50 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">{t('checkout.selectAddress')}</h3>
          <button 
            onClick={() => navigate('/profile/addresses')}
            className={`${primaryText} text-[11px] font-black uppercase border border-slate-150 px-4 py-1.5 rounded-full hover:bg-slate-50 active:scale-95 transition-transform`}
          >
            {t('address.edit')}
          </button>
        </div>
        <p className="text-[13.5px] font-black text-slate-800">
          {address.name} <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-1 font-black uppercase">{t('sidebar.home').toUpperCase()}</span>
        </p>
        <p className="text-[12.5px] text-slate-500 font-medium leading-relaxed mt-1.5">{address.address}</p>
        {!defaultAddress && (
          <div className="mt-3 flex flex-col gap-2">
            {canUseLiveLocation && (
              <button
                type="button"
                onClick={useLiveLocationAsAddress}
                disabled={savingLiveAddress}
                className={`${primaryText} text-[12px] font-black uppercase border border-slate-200 px-4 py-2 rounded-full active:scale-95 transition-transform disabled:opacity-60 text-left`}
              >
                {savingLiveAddress ? 'Saving…' : `Use my current location — ${liveLocation.shortLabel || liveLocation.formattedAddress}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/profile/addresses')}
              className="text-[12px] font-black uppercase text-slate-500 underline text-left"
            >
              Add a new address
            </button>
          </div>
        )}
        <p className="text-[12.5px] text-slate-800 font-black mt-2 tracking-tight">{address.phone}</p>
        {isEcommerceFlow && defaultAddress?.pincode && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {checkingServiceability ? (
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {t('checkout.checkingCourier', { pin: defaultAddress.pincode })}
              </p>
            ) : courierServiceable === false ? (
              <p className="text-[11px] font-black text-red-600 uppercase tracking-wide">
                {t('checkout.courierUnavailablePin', { pin: defaultAddress.pincode })}
              </p>
            ) : courierServiceable ? (
              <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <Truck size={14} />
                {t('checkout.courierAvailablePin', { pin: defaultAddress.pincode })}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Product Items */}
      <div className="space-y-3">
        {checkoutItems.map((item, idx) => (
          <div key={idx} className="bg-white rounded-[24px] p-4 border border-slate-100/50 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[16px] p-1.5 flex-shrink-0 flex items-center justify-center">
                <img src={item.image || item.img} className="w-full h-full object-contain mix-blend-multiply" alt="product" loading="lazy" decoding="async" onError={handleImageError} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13.5px] font-black text-slate-800 line-clamp-1 leading-snug">{item.name}</h4>
                {item.brand && (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{item.brand}</p>
                )}
                {item.rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center bg-green-700 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">
                      {item.rating} <Star size={7} fill="white" className="ml-0.5" />
                    </div>
                    {item.reviewCount > 0 && (
                      <span className="text-[10.5px] text-slate-400 font-bold">({item.reviewCount} {t('home.ratingsTitle').toLowerCase()})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[16px] font-black text-slate-900">{formatPrice(item.price)}</span>
                  {item.oldPrice && <span className="text-[13px] text-slate-405 line-through">{t('product.mrp')} {formatPrice(item.oldPrice)}</span>}
                  {item.discount && (
                    <span className="border border-[#e47911] text-[#e47911] text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                      {tName(item.discount)}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 ml-auto font-bold">{t('common.quantity') || 'Qty'}: {item.qty || 1}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3.5 border-t border-slate-50 mt-4">
              <Truck size={16} className={primaryText} />
              <p className="text-[12px] text-slate-800 font-medium">
                {item.deliveryEtaText ? (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>⚡ {t('checkout.quick')}</span> {t('checkout.deliveryIn', { time: item.deliveryEtaText })}
                  </>
                ) : item.deliveryPromiseMinutes ? (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>⚡ {t('checkout.quick')}</span> {t('checkout.deliveryIn', { time: `${item.deliveryPromiseMinutes} ${t('checkout.mins')}` })}
                  </>
                ) : (isQuickShopFlow || isFreshGroceryFlow) && !STANDARD_TABS.has(item.marketplaceTab) ? (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>⚡ {t('checkout.quick')}</span> {t('checkout.deliveryIn', { time: `15-30 ${t('checkout.mins')}` })}
                  </>
                ) : (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>{t('checkout.standard')}</span> {t('checkout.deliveryText') || 'Estimated delivery in 2-4 business days'}
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-100/50 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-3">{t('cart.applyCoupon')}</h3>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder={t('checkout.enterCode')}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold uppercase"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            className={`px-4 py-2.5 rounded-xl text-white text-[11px] font-black uppercase ${primaryBg}`}
          >
            {t('auto.apply')}
          </button>
        </div>
        {couponApplied && couponDiscount > 0 && (
          <p className="text-[11px] font-bold text-green-700 mt-2">{t('x.couponSaved', { amount: formatPrice(couponDiscount) })}</p>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-3.5 mb-28">
        <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
          <span>{t('product.mrp')}</span>
          <span className="text-slate-800 font-black">{formatPrice(totalOldPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
          <span>{t('checkout.deliveryCharges') || 'Delivery Charges'}</span>
          <span className={deliveryFee === 0 ? "text-emerald-600 font-black uppercase text-xs" : "text-slate-800 font-black"}>
            {deliveryFee === 0 ? (t('cart.free') || 'FREE') : formatPrice(deliveryFee)}
          </span>
        </div>
        {platformFee > 0 && (
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('checkout.platformFees') || 'Platform Fee'}</span>
            <span className="text-slate-800 font-black">{formatPrice(platformFee)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('checkout.taxesGst')}</span>
            <span className="text-slate-800 font-black">{formatPrice(taxAmount)}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between items-center text-[13px] text-green-700 font-bold">
            <span>{t('cart.couponDiscount')}</span>
            <span className="font-black">-{formatPrice(couponDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
          <span>{t('checkout.productDiscount') || 'Product Discount'}</span>
          <span className="text-green-750 font-black">-{formatPrice(totalOldPrice - totalPrice)}</span>
        </div>
        <div className="border-t border-dashed border-slate-200 my-2" />
        <div className="flex justify-between items-center text-[14.5px] font-black text-slate-800">
          <span>{t('cart.totalAmount')}</span>
          <span className="text-[18px] text-slate-900">{formatPrice(payableTotal)}</span>
        </div>
        
        <div className="bg-emerald-50/50 px-4 py-2.5 rounded-full border border-emerald-100 flex items-center justify-center gap-2 mt-4 shadow-2xs">
           <Zap size={13} className="text-emerald-700 fill-emerald-700" />
           <p className="text-[11.5px] font-black text-emerald-800">{t('cart.savings')} {formatPrice(totalOldPrice - totalPrice)}!</p>
        </div>

        <p className="text-[10px] text-slate-404 text-center leading-relaxed font-bold pt-2">
          {t('auth.termsText')} <span className={`${primaryText} underline`}>{t('auth.termsOfUse')}</span> {t('auth.and')} <span className={`${primaryText} underline`}>{t('auth.privacyPolicy')}</span>
        </p>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="animate-in fade-in slide-in-from-right duration-300 pb-32">
      {/* Price Summary Card */}
      <div className="bg-[#f4faf6] px-4 py-4 border border-[#e1f0e7] shadow-[0_4px_16px_rgba(8,66,36,0.02)] mx-4 mt-2 rounded-[24px]">
        <div className="flex justify-between items-center">
          <span className="text-[13.5px] font-black text-slate-600">{t('cart.totalAmount')}</span>
          <span className="text-[18px] font-black text-slate-900 tracking-tight">{formatPrice(payableTotal)}</span>
        </div>
      </div>

      {/* Payment Options Accordions */}
      <div className="mt-5 px-4 space-y-3">
        {import.meta.env.DEV && (
          <div className="bg-blue-50 border border-blue-200 rounded-[20px] px-4 py-3 text-[11.5px] font-semibold text-blue-900 leading-relaxed">
            Razorpay test mode: UPI/Netbanking fail ho to <span className="font-black">{t('auto.card')}</span> use karo —
            <span className="font-mono"> 4111 1111 1111 1111</span>, koi bhi future expiry/CVV.
            UPI test: <span className="font-mono">success@razorpay</span>
          </div>
        )}

        {/* UPI Option */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
           <div 
            onClick={() => setSelectedPayment(selectedPayment === 'UPI' ? '' : 'UPI')}
            className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
           >
             <div className="flex items-center gap-3.5">
                <div className={`w-8 h-6 border ${primaryBorder} rounded-md flex items-center justify-center text-[7.5px] font-black tracking-tight ${primaryText} bg-pink-50/30 uppercase`}>UPI</div>
                <h3 className="text-[14px] font-black text-slate-850">{t('checkout.upiOptions')}</h3>
             </div>
             <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedPayment === 'UPI' ? 'rotate-90' : ''}`} />
           </div>

           {selectedPayment === 'UPI' && (
             <div className="px-4 pb-5 pt-1 animate-in slide-in-from-top duration-200">
                <div className="border border-slate-100 rounded-2xl p-4 shadow-2xs bg-white space-y-5">
                    {/* Paytm */}
                    <div className="flex items-start gap-3.5 cursor-pointer" onClick={() => setSelectedUpi('paytm')}>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${selectedUpi === 'paytm' ? primaryBorder : 'border-slate-300'}`}>
                          {selectedUpi === 'paytm' && <div className={`w-2.5 h-2.5 ${primaryBg} rounded-full`}></div>}
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center justify-between">
                             <span className="text-[13.5px] font-black text-slate-850">Paytm</span>
                             <span className={`text-[11px] font-black tracking-widest ${primaryText} uppercase`}>Paytm</span>
                          </div>
                          {selectedUpi === 'paytm' && (
                             <button
                                onClick={handleContinue}
                                className={`w-full ${primaryBgHover} text-white py-3.5 rounded-full font-black uppercase text-[12px] tracking-widest mt-4 shadow-md active:scale-95 transition-transform`}
                             >
                               {t('checkout.pay')} {formatPrice(payableTotal)}
                             </button>
                          )}
                       </div>
                    </div>

                    <div className="h-[1px] bg-slate-50" />

                    {/* PhonePe */}
                    <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setSelectedUpi('phonepe')}>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUpi === 'phonepe' ? primaryBorder : 'border-slate-300'}`}>
                          {selectedUpi === 'phonepe' && <div className={`w-2.5 h-2.5 ${primaryBg} rounded-full`}></div>}
                       </div>
                       <div className="flex-1 flex items-center justify-between">
                          <span className="text-[13.5px] font-black text-slate-850">PhonePe</span>
                          <div className="w-6 h-6 bg-purple-750 rounded-full flex items-center justify-center text-white text-[9px] font-black">पे</div>
                       </div>
                    </div>
                </div>
             </div>
           )}
        </div>

        {/* Credit / Debit Card */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
           <div 
            onClick={() => setSelectedPayment(selectedPayment === 'CARD' ? '' : 'CARD')}
            className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
           >
             <div className="flex items-center gap-3.5">
                <CreditCard size={18} className="text-slate-800" />
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-black text-slate-850">{t('checkout.cardOption')}</h3>
                </div>
             </div>
             <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedPayment === 'CARD' ? 'rotate-90' : ''}`} />
           </div>

           {selectedPayment === 'CARD' && (
             <div className="px-4 pb-5 pt-1 animate-in slide-in-from-top duration-200">
               <div className="border border-slate-100 rounded-2xl p-5 bg-white">
                 {import.meta.env.DEV && (
                   <p className="text-[11.5px] text-slate-500 font-bold leading-relaxed mb-4">
                     Razorpay test card: <span className="font-mono text-slate-800">4111 1111 1111 1111</span> — any future expiry, any CVV.
                   </p>
                 )}
                 <button
                   onClick={handleContinue}
                   className={`w-full ${primaryBgHover} text-white py-3.5 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
                 >
                   {t('checkout.payWithCard')}
                 </button>
               </div>
             </div>
           )}
        </div>

        {/* Cash on Delivery */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
           <div 
            onClick={() => setSelectedPayment(selectedPayment === 'COD' ? '' : 'COD')}
            className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
           >
             <div className="flex items-center gap-3.5">
                <IndianRupee size={18} className="text-slate-800" />
                <h3 className="text-[14px] font-black text-slate-850">{t('checkout.cod')}</h3>
             </div>
             <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedPayment === 'COD' ? 'rotate-90' : ''}`} />
           </div>

           {selectedPayment === 'COD' && (
             <div className="px-4 pb-5 pt-1 animate-in slide-in-from-top duration-200">
                <div className="border border-slate-100 rounded-2xl p-5 bg-white">
                  <p className="text-[11.5px] text-slate-400 font-bold leading-relaxed mb-4">
                    {t('checkout.codFeeNote')}
                  </p>
                  <button 
                    onClick={handleContinue}
                    className={`w-full ${primaryBgHover} text-white py-3.5 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
                  >
                    {t('checkout.placeOrder')}
                  </button>
                </div>
             </div>
           )}
        </div>

        {/* Gift Card */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
           <div className="px-4 py-4 flex items-center justify-between">
             <div className="flex items-center gap-3.5">
                <ShieldCheck size={18} className="text-slate-800" />
                <h3 className="text-[13.5px] font-black text-slate-850">{t('checkout.giftCard')}</h3>
             </div>
             <button className={`${primaryText} text-[11px] font-black uppercase tracking-wider`}>{t('checkout.addCard')}</button>
           </div>
        </div>
      </div>

      {/* Trust Message */}
      <div className="mt-8 mb-20 text-center px-8">
         <p className="text-[14px] font-black text-slate-450 tracking-tight">{t('checkout.happyCustomers')}</p>
      </div>
    </div>
  );

  if (orderStatus !== 'idle') {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    const estDeliveryStr = deliveryDate.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center w-full fixed inset-0 z-[1000] px-4 py-6 overflow-y-auto transition-colors duration-300 ${
        isFreshGroceryFlow ? 'bg-gradient-to-b from-[color:var(--fg-light,#FFF0A0)]/45 via-[#FFFDF3]/95 to-white/95 backdrop-blur-xs' : 'bg-[#f0f3f6]'
      }`}>
        {orderStatus === 'processing' ? (
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl max-w-sm w-full text-center flex flex-col items-center">
            <Loader2 size={48} className={`${primaryText} animate-spin mb-6`} />
            <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('checkout.processingOrder')}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">{t('checkout.doNotClose')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-6 border border-slate-100/50 shadow-xl max-w-md w-full text-center animate-in zoom-in duration-500 space-y-6">
            <div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-100 mx-auto">
                <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('checkout.orderPlaced')}</h2>
              {placedOrder && (
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {t('orders.orderId')}: {placedOrder.id}
                </p>
              )}
            </div>

            {/* Product & Order Details Card */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-left space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl p-1.5 flex-shrink-0 flex items-center justify-center">
                  <img src={firstItem.image || firstItem.img} className="w-full h-full object-contain mix-blend-multiply" alt="product" loading="lazy" decoding="async" onError={handleImageError} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13.5px] font-black text-slate-800 line-clamp-2 leading-snug">{firstItem.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[14px] font-black text-slate-900">{formatPrice(firstItem.price)}</span>
                    <span className="text-[11px] text-slate-400 font-bold">{t('common.quantity')}: {firstItem.qty || 1}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 flex items-center gap-2">
                <Truck size={16} className={primaryText} />
                <p className="text-[12.5px] text-slate-705 font-medium">
                  {t('checkout.estimatedDelivery')}: <span className={`font-black ${primaryText}`}>{estDeliveryStr}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={() => navigate(`/vendor/profile/orders/${placedOrder?.id || ''}`)}
                className={`w-full ${primaryBgHover} text-white py-4 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
              >
                {t('orders.track')}
              </button>
              <button 
                onClick={() => navigate(shopNowLink)}
                className="w-full bg-white border-2 border-slate-200 text-slate-750 hover:bg-slate-50 py-4 rounded-full font-black uppercase text-[12px] tracking-widest active:scale-95 transition-transform"
              >
                {t('checkout.continueShopping')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans text-slate-850 pb-28 transition-colors duration-300 relative ${
      isFreshGroceryFlow ? 'bg-[color:var(--fg-light,#FFF8EE)]' : 'bg-[#f0f3f6]'
    }`}>
      {/* Global Repeating Mithila Art Page Background Texture */}
      {(isFreshGroceryFlow || !(isMithilakFlow || isQuickShopFlow)) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between transition-colors duration-300 relative z-10 ${
        isFreshGroceryFlow 
          ? 'bg-[color:var(--fg-primary,#D9A21B)] text-white' 
          : isMithilakFlow 
            ? 'bg-[color:var(--ml-primary,#207C8A)] text-white' 
            : isQuickShopFlow 
              ? 'bg-gradient-to-r from-[color:var(--qs-primary,#F26522)] to-[color:var(--qs-accent,#FF7A00)] text-white' 
              : 'bg-[#f0f3f6]'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform border border-slate-100/50"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-800" />
          </button>
          <h1 className={`text-[17px] font-black tracking-tight ${isFreshGroceryFlow || isMithilakFlow || isQuickShopFlow ? 'text-white' : 'text-slate-800'}`}>{t('checkout.orderSummaryTitle')}</h1>
        </div>
      </div>

      {renderStepper()}

      <main className="max-w-xl mx-auto">
        {currentStep === 2 ? renderOrderSummary() : renderPayment()}
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 px-5 py-3.5 flex items-center justify-between z-50 shadow-[0_10px_30px_rgba(8,66,36,0.08)] rounded-[24px]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('cart.totalAmount')}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-black text-slate-900">
              {formatPrice(payableTotal)}
            </span>
          </div>
        </div>
        <button 
          onClick={handleContinue}
          disabled={isEcommerceFlow && (checkingServiceability || courierServiceable === false)}
          className={`${primaryBgHover} text-white rounded-full px-8 py-3.5 font-black uppercase text-[12px] tracking-widest shadow-[0_4px_16px_rgba(8,66,36,0.22)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {currentStep === 3 ? t('checkout.placeOrder') : t('auth.continue')}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
