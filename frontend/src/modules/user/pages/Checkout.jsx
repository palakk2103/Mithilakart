import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, ShieldCheck, 
  Star, Truck, CheckCircle, Zap, Loader2, IndianRupee, CreditCard
} from 'lucide-react';
import { parsePrice, formatPrice } from '../../../shared/utils/priceFormatter';
import useAccountStore from '../../../store/useAccountStore';
import { createOrder, initiatePayment, verifyPayment, validateCoupon } from '../services/ordersApi';
import { checkShippingServiceability } from '../services/shippingApi';
import { getAddresses } from '../services/userApi';
import { fetchCartItems, getMarketplaceTab, clearCart, dispatchCartUpdated } from '../utils/cartUtils';
import { openRazorpayCheckout } from '../../../shared/services/razorpay';
import { toast } from 'react-hot-toast';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import useTabTheme from '../../../shared/hooks/useTabTheme';

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
  const { addOrder, savedAddresses, selectedAddressId } = useAccountStore();

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
  const [loading, setLoading] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [courierServiceable, setCourierServiceable] = useState(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);

  const isEcommerceFlow = !isQuickShopFlow && !isFreshGroceryFlow;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (location.state?.product) {
        if (!cancelled) {
          setCheckoutItems([location.state.product]);
          setLoading(false);
        }
        return;
      }

      try {
        const { items, cart } = await fetchCartItems();
        if (!cancelled) {
          setCheckoutItems(items.length ? items : []);
          setDeliveryFee(Number(cart?.deliveryCharge ?? cart?.shippingFee ?? 0) || 0);
        }
      } catch {
        if (!cancelled) {
          setCheckoutItems([]);
          setDeliveryFee(0);
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
    name: 'Guest',
    type: 'HOME',
    address: 'No address provided',
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

  const payableTotal = Math.max(0, totalPrice + deliveryFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
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
      toast.success(result?.message || 'Coupon applied');
    } catch (err) {
      setCouponDiscount(0);
      setCouponApplied(false);
      toast.error(err?.message || 'Invalid coupon');
    }
  };

  const handleContinue = async () => {
    if (currentStep === 2) {
      if (isEcommerceFlow && courierServiceable === false) {
        toast.error('Courier delivery is not available for this pincode. Please choose another address.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (isEcommerceFlow && courierServiceable === false) {
        toast.error('Courier delivery is not available for this pincode.');
        return;
      }
      setOrderStatus('processing');

      try {
        const addressId = defaultAddress?.id || defaultAddress?._id;
        if (!addressId) {
          throw new Error('Please add a delivery address before checkout');
        }

        const paymentMethod = PAYMENT_METHOD_MAP[selectedPayment] || 'upi';

        // Detect cart commerce flow and marketplace tab from cart items
        let resolvedFlow = isMithilakFlow ? 'mithilak' : isQuickShopFlow ? 'quick_shop' : isFreshGroceryFlow ? 'fresh_grocery' : getCommerceFlow();
        let resolvedTab = getMarketplaceTab();

        const hasQuickItem = checkoutItems.some((it) =>
          it.marketplaceTab === 'quick_shop' ||
          it.commerceFlow === 'quick_shop' ||
          it.commerceFlows?.includes('quick_shop')
        );
        const hasGroceryItem = checkoutItems.some((it) =>
          it.marketplaceTab === 'groceries_fresh' ||
          it.commerceFlow === 'fresh_grocery' ||
          it.commerceFlows?.includes('fresh_grocery')
        );
        const hasMithilakItem = checkoutItems.some((it) =>
          it.marketplaceTab === 'mithilak' ||
          it.commerceFlow === 'mithilak' ||
          it.commerceFlows?.includes('mithilak')
        );

        if (hasQuickItem) {
          resolvedFlow = 'quick_shop';
          resolvedTab = 'quick_shop';
        } else if (hasGroceryItem) {
          resolvedFlow = 'fresh_grocery';
          resolvedTab = 'groceries_fresh';
        } else if (hasMithilakItem) {
          resolvedFlow = 'mithilak';
          resolvedTab = 'mithilak';
        }

        const result = await createOrder({
          addressId,
          paymentMethod,
          commerceFlow: resolvedFlow,
          marketplaceTab: resolvedTab,
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
            throw new Error('Online payment is unavailable. Please choose Cash on Delivery.');
          }
        }

        if (paymentMethod !== 'cod' && paymentStatus !== 'paid') {
          throw new Error('Payment was not completed');
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
        await clearCart();
        dispatchCartUpdated();
        navigate('/order-confirmation', { state: { placedOrder: newOrder, checkoutItems } });
        setOrderStatus('idle');
      } catch (err) {
        console.error('Order failed', err);
        const message = err?.message || 'Could not place order. Please try again.';
        toast.error(message.includes('Insufficient stock')
          ? 'Some items are out of stock. Please update your cart and try again.'
          : message.includes('Payment') || message.includes('payment') || message.includes('Razorpay') || message.includes('another method')
            ? 'Online payment failed. Please use Cash on Delivery (COD) for testing.'
            : message);
        setOrderStatus('idle');
      }
    }
  };

  const renderStepper = () => (
    <div className={`px-4 py-3.5 sticky top-14 z-40 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[#FFF8EE]' : 'bg-[#f0f3f6]'}`}>
      <div className="flex items-center justify-between relative max-w-sm mx-auto">
        {/* Connecting Lines */}
        <div className="absolute top-3.5 left-[15%] right-[15%] h-[2.5px] bg-slate-200 -z-0">
          <div className={`h-full ${primaryBg} transition-all duration-500`} style={{ width: currentStep === 2 ? '50%' : currentStep === 3 ? '100%' : '0%' }}></div>
        </div>

        {/* Step 1: Address */}
        <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[#FFF8EE]' : 'bg-[#f0f3f6]'}`}>
          <div className={`w-7 h-7 rounded-full ${primaryBg} text-white flex items-center justify-center text-[11px] font-black shadow-xs`}>
            <CheckCircle2 size={15} />
          </div>
          <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">{t('address.title')}</span>
        </div>

        {/* Step 2: Order Summary */}
        <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[#FFF8EE]' : 'bg-[#f0f3f6]'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-xs ${currentStep >= 2 ? `${primaryBg} text-white` : 'bg-white text-slate-400'}`}>
            {currentStep > 2 ? <CheckCircle2 size={15} /> : '2'}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${currentStep === 2 ? primaryText : 'text-slate-450'}`}>{t('checkout.orderSummary')}</span>
        </div>

        {/* Step 3: Payment */}
        <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${isFreshGroceryFlow ? 'bg-[#FFF8EE]' : 'bg-[#f0f3f6]'}`}>
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
        <p className="text-[12.5px] text-slate-800 font-black mt-2 tracking-tight">{address.phone}</p>
        {isEcommerceFlow && defaultAddress?.pincode && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {checkingServiceability ? (
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Checking courier delivery to {defaultAddress.pincode}…
              </p>
            ) : courierServiceable === false ? (
              <p className="text-[11px] font-black text-red-600 uppercase tracking-wide">
                Courier delivery unavailable for pincode {defaultAddress.pincode}
              </p>
            ) : courierServiceable ? (
              <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <Truck size={14} />
                Courier delivery available to {defaultAddress.pincode}
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
                <img src={item.image || item.img} className="w-full h-full object-contain mix-blend-multiply" alt="product" />
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
                      {item.discount}
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
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>⚡ Quick</span> Delivery in {item.deliveryEtaText}
                  </>
                ) : item.deliveryPromiseMinutes ? (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>⚡ Quick</span> Delivery in {item.deliveryPromiseMinutes} mins
                  </>
                ) : isQuickShopFlow ? (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>⚡ Quick</span> Delivery in 15-30 mins
                  </>
                ) : (
                  <>
                    <span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>Standard</span> {t('checkout.deliveryText') || 'Estimated delivery in 2-4 business days'}
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-100/50 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-3">Apply Coupon</h3>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold uppercase"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            className={`px-4 py-2.5 rounded-xl text-white text-[11px] font-black uppercase ${primaryBg}`}
          >
            Apply
          </button>
        </div>
        {couponApplied && couponDiscount > 0 && (
          <p className="text-[11px] font-bold text-green-700 mt-2">Coupon applied — saved {formatPrice(couponDiscount)}</p>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-3.5 mb-28">
        <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
          <span>{t('product.mrp')}</span>
          <span className="text-slate-800 font-black">{formatPrice(totalOldPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
          <span>{t('checkout.platformFees') || 'Platform Fees'}</span>
          <span className="text-slate-800 font-black">{formatPrice(deliveryFee)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between items-center text-[13px] text-green-700 font-bold">
            <span>Coupon Discount</span>
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
          <span className="text-[13.5px] font-black text-slate-600">Total Amount</span>
          <span className="text-[18px] font-black text-slate-900 tracking-tight">{formatPrice(payableTotal)}</span>
        </div>
      </div>

      {/* Payment Options Accordions */}
      <div className="mt-5 px-4 space-y-3">
        {import.meta.env.DEV && (
          <div className="bg-blue-50 border border-blue-200 rounded-[20px] px-4 py-3 text-[11.5px] font-semibold text-blue-900 leading-relaxed">
            Razorpay test mode: UPI/Netbanking fail ho to <span className="font-black">Card</span> use karo —
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
                <h3 className="text-[14px] font-black text-slate-850">UPI Options</h3>
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
                               Pay {formatPrice(payableTotal)}
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
                  <h3 className="text-[14px] font-black text-slate-850">Credit / Debit / ATM Card</h3>
                </div>
             </div>
             <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedPayment === 'CARD' ? 'rotate-90' : ''}`} />
           </div>

           {selectedPayment === 'CARD' && (
             <div className="px-4 pb-5 pt-1 animate-in slide-in-from-top duration-200">
               <div className="border border-slate-100 rounded-2xl p-5 bg-white">
                 <p className="text-[11.5px] text-slate-500 font-bold leading-relaxed mb-4">
                   Razorpay test card: <span className="font-mono text-slate-800">4111 1111 1111 1111</span> — any future expiry, any CVV.
                 </p>
                 <button
                   onClick={handleContinue}
                   className={`w-full ${primaryBgHover} text-white py-3.5 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
                 >
                   Pay with Card
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
                <h3 className="text-[14px] font-black text-slate-850">Cash on Delivery</h3>
             </div>
             <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedPayment === 'COD' ? 'rotate-90' : ''}`} />
           </div>

           {selectedPayment === 'COD' && (
             <div className="px-4 pb-5 pt-1 animate-in slide-in-from-top duration-200">
                <div className="border border-slate-100 rounded-2xl p-5 bg-white">
                  <p className="text-[11.5px] text-slate-400 font-bold leading-relaxed mb-4">
                    A Cash on Delivery handling fee may apply and will be shown in your order total before you place the order.
                  </p>
                  <button 
                    onClick={handleContinue}
                    className={`w-full ${primaryBgHover} text-white py-3.5 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
                  >
                    Place Order
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
                <h3 className="text-[13.5px] font-black text-slate-850">Mithilakart Gift Card</h3>
             </div>
             <button className={`${primaryText} text-[11px] font-black uppercase tracking-wider`}>Add Card</button>
           </div>
        </div>
      </div>

      {/* Trust Message */}
      <div className="mt-8 mb-20 text-center px-8">
         <p className="text-[14px] font-black text-slate-450 tracking-tight">35 Crore happy customers and counting!</p>
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
        isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/45 via-[#FFFDF3]/95 to-white/95 backdrop-blur-xs' : 'bg-[#f0f3f6]'
      }`}>
        {orderStatus === 'processing' ? (
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl max-w-sm w-full text-center flex flex-col items-center">
            <Loader2 size={48} className={`${primaryText} animate-spin mb-6`} />
            <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Processing Your Order</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">Please do not close this window</p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-6 border border-slate-100/50 shadow-xl max-w-md w-full text-center animate-in zoom-in duration-500 space-y-6">
            <div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-100 mx-auto">
                <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Placed Successfully!</h2>
              {placedOrder && (
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Order ID: {placedOrder.id}
                </p>
              )}
            </div>

            {/* Product & Order Details Card */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-left space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl p-1.5 flex-shrink-0 flex items-center justify-center">
                  <img src={firstItem.image || firstItem.img} className="w-full h-full object-contain mix-blend-multiply" alt="product" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13.5px] font-black text-slate-800 line-clamp-2 leading-snug">{firstItem.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[14px] font-black text-slate-900">{formatPrice(firstItem.price)}</span>
                    <span className="text-[11px] text-slate-400 font-bold">Qty: {firstItem.qty || 1}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 flex items-center gap-2">
                <Truck size={16} className={primaryText} />
                <p className="text-[12.5px] text-slate-705 font-medium">
                  Estimated Delivery: <span className={`font-black ${primaryText}`}>{estDeliveryStr}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={() => navigate(`/vendor/profile/orders/${placedOrder?.id || ''}`)}
                className={`w-full ${primaryBgHover} text-white py-4 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
              >
                Track Order
              </button>
              <button 
                onClick={() => navigate(shopNowLink)}
                className="w-full bg-white border-2 border-slate-200 text-slate-750 hover:bg-slate-50 py-4 rounded-full font-black uppercase text-[12px] tracking-widest active:scale-95 transition-transform"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans text-slate-850 pb-28 transition-colors duration-300 relative ${
      isFreshGroceryFlow ? 'bg-[#FFF8EE]' : 'bg-[#f0f3f6]'
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
          ? 'bg-[#D9A21B] text-white' 
          : isMithilakFlow 
            ? 'bg-[#207C8A] text-white' 
            : isQuickShopFlow 
              ? 'bg-gradient-to-r from-[#F26522] to-[#FF7A00] text-white' 
              : 'bg-[#f0f3f6]'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform border border-slate-100/50"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-800" />
          </button>
          <h1 className={`text-[17px] font-black tracking-tight ${isFreshGroceryFlow || isMithilakFlow || isQuickShopFlow ? 'text-white' : 'text-slate-800'}`}>Order Summary</h1>
        </div>
      </div>

      {renderStepper()}

      <main className="max-w-xl mx-auto">
        {currentStep === 2 ? renderOrderSummary() : renderPayment()}
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 px-5 py-3.5 flex items-center justify-between z-50 shadow-[0_10px_30px_rgba(8,66,36,0.08)] rounded-[24px]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Amount</span>
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
          {currentStep === 3 ? 'Place Order' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
