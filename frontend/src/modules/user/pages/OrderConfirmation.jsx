import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, ArrowLeft } from 'lucide-react';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import ElectronicsImg from '../../../assets/products/product04.jpg';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const primaryBgHover = isMithilakFlow 
    ? 'bg-[#207C8A] hover:bg-[#1a6874]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c49218]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d9561b]' 
        : 'bg-[#6FAE4A] hover:bg-[#5b953d]';

  const primaryText = isMithilakFlow 
    ? 'text-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'text-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'text-[#F26522]' 
        : 'text-[#6FAE4A]';

  const shopNowLink = isMithilakFlow 
    ? '/mithilak' 
    : isFreshGroceryFlow 
      ? '/fresh-grocery' 
      : isQuickShopFlow 
        ? '/quick-shop' 
        : '/home';

  const { placedOrder, checkoutItems } = location.state || {};

  const defaultProduct = {
    name: 'EVOFOX Blaze Wired Ambidextrous Gaming Mouse',
    price: 622,
    image: ElectronicsImg,
    qty: 1
  };

  const orderDetails = placedOrder || {
    id: 'OD123456789',
    status: 'Confirmed',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  const items = checkoutItems || [defaultProduct];
  const firstItem = items[0] || defaultProduct;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const estDeliveryStr = deliveryDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center w-full px-4 py-6 overflow-y-auto transition-colors duration-300 ${
      isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/45 via-[#FFFDF3]/95 to-white' : 'bg-[#f0f3f6]'
    }`}>
      {/* Background Texture */}
      {(isFreshGroceryFlow || !(isMithilakFlow || isQuickShopFlow)) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      <div className="bg-white rounded-[32px] p-6 border border-slate-100/50 shadow-xl max-w-md w-full text-center relative z-10 animate-in zoom-in duration-500 space-y-6">
        <div>
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-100 mx-auto">
            <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Placed Successfully!</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Order ID: {orderDetails.id}
          </p>
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
            onClick={() => navigate(`/profile/orders/${orderDetails.id}`)}
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
    </div>
  );
};

export default OrderConfirmation;
