import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, ShieldCheck, 
  Star, Truck, CheckCircle, Zap, Loader2, IndianRupee, CreditCard
} from 'lucide-react';
import { parsePrice, formatPrice } from '../../../shared/utils/priceFormatter';
import useAccountStore from '../../../store/useAccountStore';
import ElectronicsImg from '../../../assets/products/product04.jpg';
import ShippingUnavailable from '../components/common/ShippingUnavailable';


const Checkout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2); // 1: Address, 2: Order Summary, 3: Payment
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const [selectedUpi, setSelectedUpi] = useState('paytm');
  const [orderStatus, setOrderStatus] = useState('idle'); // 'idle', 'processing', 'success'
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isShippingUnavailable, setIsShippingUnavailable] = useState(false);
  const addOrder = useAccountStore((state) => state.addOrder);


  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';
  const primaryBg = isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : (isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]');
  const primaryBgHover = isMithilakFlow ? 'bg-[#207C8A] hover:bg-[#1a6874]' : isFreshGroceryFlow ? 'bg-[#D9A21B] hover:bg-[#c49218]' : (isQuickShopFlow ? 'bg-[#F26522] hover:bg-[#d9561b]' : 'bg-[#6FAE4A] hover:bg-[#5b953d]');
  const primaryText = isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#D9A21B]' : (isQuickShopFlow ? 'text-[#F26522]' : 'text-[#6FAE4A]');
  const primaryBorder = isMithilakFlow ? 'border-[#207C8A]' : isFreshGroceryFlow ? 'border-[#D9A21B]' : (isQuickShopFlow ? 'border-[#F26522]' : 'border-[#6FAE4A]');
  const shopNowLink = isMithilakFlow ? '/mithilak' : isFreshGroceryFlow ? '/fresh-grocery' : (isQuickShopFlow ? '/quick-shop' : '/home');

  const defaultProduct = {
    name: 'EVOFOX Blaze Wired Ambidextrous Gaming Mouse',
    price: 622,
    oldPrice: 1299,
    discount: '52%',
    image: ElectronicsImg,
    rating: '4.5',
    reviews: '5,960',
    qty: 1
  };

  const [checkoutItems, setCheckoutItems] = useState([defaultProduct]);

  useEffect(() => {
    if (location.state?.product) {
      setCheckoutItems([location.state.product]);
    } else {
      try {
        const items = JSON.parse(localStorage.getItem('userCart') || '[]');
        if (items.length > 0) {
          setCheckoutItems(items);
        } else {
          setCheckoutItems([defaultProduct]);
        }
      } catch (e) {
        setCheckoutItems([defaultProduct]);
      }
    }
  }, [location.state]);

  const totalPrice = checkoutItems.reduce((acc, item) => {
    return acc + parsePrice(item.price) * parsePrice(item.qty || 1);
  }, 0);

  const totalOldPrice = checkoutItems.reduce((acc, item) => {
    return acc + parsePrice(item.oldPrice || item.price) * parsePrice(item.qty || 1);
  }, 0);

  const firstItem = checkoutItems[0] || defaultProduct;

  // Read address from localStorage (saved by Cart's address modal)
  const savedAddr = localStorage.getItem('cartAddress');
  const address = savedAddr ? { ...JSON.parse(savedAddr), type: 'HOME' } : {
    name: 'Guest',
    type: 'HOME',
    address: 'No address provided',
    phone: '—'
  };

  // Auth guard — redirect unauthenticated users to login
  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const handleContinue = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setOrderStatus('processing');
      
      const newOrder = {
        id: `OD${Math.floor(Math.random() * 1000000000)}`,
        status: 'Confirmed',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: checkoutItems.map(item => ({
          name: item.name,
          price: item.price,
          image: item.image || item.img
        }))
      };

      setTimeout(() => {
        addOrder(newOrder);
        setPlacedOrder(newOrder);
        setOrderStatus('success');
        localStorage.removeItem('userCart');
        window.dispatchEvent(new Event('cartUpdated'));
      }, 2000);
    }
  };

  const renderStepper = () => {
    const stepperBg = isMithilakFlow ? 'bg-[#F5F9FA]' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isQuickShopFlow ? 'bg-[#FFF9F5]' : 'bg-[#F6F8F3]';
    return (
      <div className={`px-4 py-3.5 sticky top-14 z-40 transition-colors duration-300 ${stepperBg}`}>
        <div className="flex items-center justify-between relative max-w-sm mx-auto">
          {/* Connecting Lines */}
          <div className="absolute top-3.5 left-[15%] right-[15%] h-[2.5px] bg-slate-200 -z-0">
            <div className={`h-full ${primaryBg} transition-all duration-500`} style={{ width: currentStep === 2 ? '50%' : currentStep === 3 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 1: Address */}
          <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${stepperBg}`}>
            <div className={`w-7 h-7 rounded-full ${primaryBg} text-white flex items-center justify-center text-[11px] font-black shadow-xs`}>
              <CheckCircle2 size={15} />
            </div>
            <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">{t('address.title')}</span>
          </div>

          {/* Step 2: Order Summary */}
          <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${stepperBg}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-xs ${currentStep >= 2 ? `${primaryBg} text-white` : 'bg-white text-slate-400'}`}>
              {currentStep > 2 ? <CheckCircle2 size={15} /> : '2'}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${currentStep === 2 ? primaryText : 'text-slate-450'}`}>{t('checkout.orderSummary')}</span>
          </div>

          {/* Step 3: Payment */}
          <div className={`flex flex-col items-center gap-1 z-10 px-2 transition-colors duration-300 ${stepperBg}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-xs ${currentStep === 3 ? `${primaryBg} text-white` : 'bg-white text-slate-400'}`}>
              3
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${currentStep === 3 ? primaryText : 'text-slate-450'}`}>{t('checkout.paymentMethod')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderSummary = (isDesktop = false) => (
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
        {isShippingUnavailable ? (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <ShippingUnavailable onChangeLocation={() => setIsShippingUnavailable(false)} />
          </div>
        ) : (
          <>
            <p className="text-[13.5px] font-black text-slate-800">
              {address.name} <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-1 font-black uppercase">{t('sidebar.home').toUpperCase()}</span>
            </p>
            <p className="text-[12.5px] text-slate-500 font-medium leading-relaxed mt-1.5">{address.address}</p>
            <p className="text-[12.5px] text-slate-800 font-black mt-2 tracking-tight">{address.phone}</p>
            <div className="mt-3 flex justify-end">
              <button 
                type="button"
                onClick={() => setIsShippingUnavailable(true)}
                className="text-[9px] text-red-500 font-black uppercase tracking-wider hover:underline"
              >
                Simulate Shipping Unavailable
              </button>
            </div>
          </>
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{item.brand || 'Premium Brand'}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center bg-green-700 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">
                    {item.rating || '4.3'} <Star size={7} fill="white" className="ml-0.5" />
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-bold">({item.reviews || '120'} {t('home.ratingsTitle').toLowerCase()})</span>
                </div>
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
              <p className="text-[12px] text-slate-800 font-medium"><span className={`italic font-black text-[10px] uppercase tracking-tighter mr-1 ${primaryText}`}>Quick</span> {t('checkout.deliveryText') || 'Delivery in 2 days'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Price Summary */}
      {!isDesktop && (
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-3.5 mb-28">
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('product.mrp')}</span>
            <span className="text-slate-800 font-black">{formatPrice(totalOldPrice)}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('checkout.platformFees') || 'Platform Fees'}</span>
            <span className="text-slate-800 font-black">₹19</span>
          </div>
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('checkout.productDiscount') || 'Product Discount'}</span>
            <span className="text-green-750 font-black">-{formatPrice(totalOldPrice - totalPrice)}</span>
          </div>
          <div className="border-t border-dashed border-slate-200 my-2" />
          <div className="flex justify-between items-center text-[14.5px] font-black text-slate-800">
            <span>{t('cart.totalAmount')}</span>
            <span className="text-[18px] text-slate-900">{formatPrice(totalPrice + 19)}</span>
          </div>
          
          <div className="bg-emerald-50/50 px-4 py-2.5 rounded-full border border-emerald-100 flex items-center justify-center gap-2 mt-4 shadow-2xs">
             <Zap size={13} className="text-emerald-700 fill-emerald-700" />
             <p className="text-[11.5px] font-black text-emerald-800">{t('cart.savings')} {formatPrice(totalOldPrice - totalPrice)}!</p>
          </div>

          <p className="text-[10px] text-slate-404 text-center leading-relaxed font-bold pt-2">
            {t('auth.termsText')} <span className={`${primaryText} underline`}>{t('auth.termsOfUse')}</span> {t('auth.and')} <span className={`${primaryText} underline`}>{t('auth.privacyPolicy')}</span>
          </p>
        </div>
      )}
    </div>
  );

  const renderPayment = (isDesktop = false) => (
    <div className={`animate-in fade-in slide-in-from-right duration-300 ${isDesktop ? '' : 'pb-32'}`}>
      {/* Price Summary Card */}
      {!isDesktop && (
        <div className="bg-[#f4faf6] px-4 py-4 border border-[#e1f0e7] shadow-[0_4px_16px_rgba(8,66,36,0.02)] mx-4 mt-2 rounded-[24px]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13.5px] font-black text-slate-600">Total Amount</span>
          <span className="text-[18px] font-black text-slate-900 tracking-tight">{formatPrice(totalPrice + 19)}</span>
        </div>
        <div className="flex justify-between items-center mb-3 border-t border-slate-200/50 pt-3">
          <span className="text-[13px] text-slate-400 font-bold border-b border-dashed border-slate-350">Bank cashback</span>
          <span className="text-[14px] font-black text-green-705">-₹50</span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-100 pt-3">
          <span className="text-[13.5px] font-black text-slate-650">Final Amount</span>
          <span className="text-[17px] font-black text-slate-800">{formatPrice(totalPrice + 19 - 50)}</span>
        </div>
      </div>
      )}

      {/* Cashback Banner */}
      <div className="bg-emerald-50/40 px-4 py-3 border border-emerald-100 mx-4 mt-3 rounded-[20px] flex items-center justify-between shadow-2xs">
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-emerald-800">5% Cashback Applied</span>
          <span className="text-[11px] text-emerald-700/80 font-semibold">Claimed automatically with payment offers</span>
        </div>
        <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-full shadow-2xs border border-slate-100">
           <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center text-[7px] font-black text-orange-600 italic">IC</div>
           <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-[7px] font-black text-emerald-800 italic">M</div>
           <span className="text-[9.5px] font-black text-slate-400 ml-0.5">+3</span>
        </div>
      </div>

      {/* Payment Options Accordions */}
      <div className="mt-5 px-4 space-y-3">
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
                          <div className="flex items-center gap-1 mt-1">
                             <CheckCircle size={10} className="text-green-700" />
                             <span className="text-[10.5px] text-green-700 font-black">₹50 cashback applicable. Tap for info</span>
                          </div>
                          {selectedUpi === 'paytm' && (
                             <button 
                                onClick={handleContinue}
                                className={`w-full ${primaryBgHover} text-white py-3.5 rounded-full font-black uppercase text-[12px] tracking-widest mt-4 shadow-md active:scale-95 transition-transform`}
                             >
                               Pay {formatPrice(totalPrice + 19 - 50)}
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
                  <p className="text-[10px] text-green-700 font-black mt-0.5">Get upto 5% cashback • 2 offers available</p>
                </div>
             </div>
             <ChevronRight size={18} className={`text-slate-400 transition-transform ${selectedPayment === 'CARD' ? 'rotate-90' : ''}`} />
           </div>
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
                    Due to handling costs, a nominal fee of ₹9 will be charged for orders placed using this option. Avoid this fee by paying online now.
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
                onClick={() => navigate(`/profile/orders/${placedOrder?.id || ''}`)}
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

  const renderDesktopPriceSummary = () => {
    if (currentStep === 2) {
      return (
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-3.5">
          <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-2">Price Details</h3>
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('product.mrp')}</span>
            <span className="text-slate-800 font-black">{formatPrice(totalOldPrice)}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('checkout.platformFees') || 'Platform Fees'}</span>
            <span className="text-slate-800 font-black">₹19</span>
          </div>
          <div className="flex justify-between items-center text-[13px] text-slate-500 font-bold">
            <span>{t('checkout.productDiscount') || 'Product Discount'}</span>
            <span className="text-green-755 font-black">-{formatPrice(totalOldPrice - totalPrice)}</span>
          </div>
          <div className="border-t border-dashed border-slate-200 my-2" />
          <div className="flex justify-between items-center text-[14.5px] font-black text-slate-800">
            <span>{t('cart.totalAmount')}</span>
            <span className="text-[18px] text-slate-900">{formatPrice(totalPrice + 19)}</span>
          </div>
          
          <div className="bg-emerald-50/50 px-4 py-2.5 rounded-full border border-emerald-100 flex items-center justify-center gap-2 mt-4 shadow-2xs">
             <Zap size={13} className="text-emerald-700 fill-emerald-700" />
             <p className="text-[11.5px] font-black text-emerald-800">{t('cart.savings')} {formatPrice(totalOldPrice - totalPrice)}!</p>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleContinue}
              className={`${primaryBgHover} w-full text-white rounded-full py-3.5 font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
            >
              Continue
            </button>
          </div>

          <p className="text-[10px] text-slate-404 text-center leading-relaxed font-bold pt-2">
            {t('auth.termsText')} <span className={`${primaryText} underline`}>{t('auth.termsOfUse')}</span> {t('auth.and')} <span className={`${primaryText} underline`}>{t('auth.privacyPolicy')}</span>
          </p>
        </div>
      );
    } else {
      return (
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100/50 space-y-3.5">
          <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider mb-2">Price Details</h3>
          <div className="bg-[#f4faf6] px-4 py-4 border border-[#e1f0e7] rounded-[24px] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13.5px] font-black text-slate-600">Total Amount</span>
              <span className="text-[18px] font-black text-slate-900 tracking-tight">{formatPrice(totalPrice + 19)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/50 pt-3">
              <span className="text-[13px] text-slate-400 font-bold border-b border-dashed border-slate-350">Bank cashback</span>
              <span className="text-[14px] font-black text-green-705">-₹50</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-[13.5px] font-black text-slate-650">Final Amount</span>
              <span className="text-[17px] font-black text-slate-800">{formatPrice(totalPrice + 19 - 50)}</span>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleContinue}
              className={`${primaryBgHover} w-full text-white rounded-full py-3.5 font-black uppercase text-[12px] tracking-widest shadow-md active:scale-95 transition-transform`}
            >
              Place Order
            </button>
          </div>

          <p className="text-[10px] text-slate-404 text-center leading-relaxed font-bold pt-2">
            {t('auth.termsText')} <span className={`${primaryText} underline`}>{t('auth.termsOfUse')}</span> {t('auth.and')} <span className={`${primaryText} underline`}>{t('auth.privacyPolicy')}</span>
          </p>
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen font-sans text-slate-850 pb-28 transition-colors duration-300 relative ${
      isMithilakFlow ? 'bg-[#F5F9FA]' : isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isQuickShopFlow ? 'bg-[#FFF9F5]' : 'bg-[#F6F8F3]'
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
        isMithilakFlow
          ? 'bg-[#207C8A] border-transparent text-white shadow-sm'
          : isFreshGroceryFlow
            ? 'bg-[#D9A21B] border-transparent text-white shadow-sm'
            : isQuickShopFlow
              ? 'bg-[#F26522] border-transparent text-white shadow-sm'
              : 'bg-[#FCF7EE]/90 border-b border-[#F3E3CD]/60 text-[#6FAE4A]'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-800 active:scale-95 transition-transform border border-slate-100/50"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-800" />
          </button>
          <h1 className={`text-[17px] font-black tracking-tight ${
            (isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white' : 'text-slate-805'
          }`}>Order Summary</h1>
        </div>
      </div>

      {renderStepper()}

      {/* Mobile-first main view */}
      <main className="max-w-xl mx-auto md:hidden">
        {currentStep === 2 ? renderOrderSummary(false) : renderPayment(false)}
      </main>

      {/* Responsive split screen layout for Tablet & Desktop */}
      <main className="hidden md:block max-w-5xl lg:max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left Column: Address, Products or Payment details */}
          <div className="md:col-span-2 space-y-6">
            {currentStep === 2 ? renderOrderSummary(true) : renderPayment(true)}
          </div>

          {/* Right Column: Pricing Summary Card with Checkout Action Buttons */}
          <div className="md:col-span-1 sticky top-24">
            {renderDesktopPriceSummary()}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Action Bar (Mobile Only) */}
      <div className="fixed bottom-3 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 px-5 py-3.5 flex items-center justify-between z-50 shadow-[0_10px_30px_rgba(8,66,36,0.08)] rounded-[24px] md:hidden">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Amount</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-black text-slate-900">
              {currentStep === 3 ? formatPrice(totalPrice + 19 - 50) : formatPrice(totalPrice + 19)}
            </span>
          </div>
        </div>
        <button 
          onClick={handleContinue}
          className={`${primaryBgHover} text-white rounded-full px-8 py-3.5 font-black uppercase text-[12px] tracking-widest shadow-[0_4px_16px_rgba(8,66,36,0.22)] active:scale-95 transition-transform`}
        >
          {currentStep === 3 ? 'Place Order' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
