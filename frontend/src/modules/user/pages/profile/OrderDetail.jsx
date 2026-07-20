import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ChevronRight, Copy, CheckCircle2, 
  Truck, Wallet, Download, MapPin, User, Phone, Package, Calendar, Clock, ReceiptText
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAccountStore from '../../../../store/useAccountStore';
import { parsePrice, formatPrice } from '../../../../shared/utils/priceFormatter';
import { useTranslation } from 'react-i18next';
import { getOrderById } from '../../services/ordersApi';
import { mapOrderDetail } from '../../utils/mappers';

const OrderDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const orders = useAccountStore((state) => state.orders);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getOrderById(orderId);
        if (!cancelled) setOrder(mapOrderDetail(data));
      } catch {
        if (!cancelled) {
          const fallback = orders.find((o) => o.id === orderId) || orders[0];
          setOrder(fallback || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, orders]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading order...</div>;
  }

  if (!order) return null;

  const orderTotalPrice = order.items.reduce((acc, item) => {
    return acc + parsePrice(item.price);
  }, 0);

  const orderTotalOldPrice = order.items.reduce((acc, item) => {
    return acc + parsePrice(item.oldPrice || parsePrice(item.price) * 1.2);
  }, 0);

  const handleDownloadInvoice = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert('Invoice download started...');
    }, 1500);
  };

  const deliveryUpdates = [
    { title: "Order Confirmed", date: "Thu, 9th Apr '26", desc: "Your Order has been placed and confirmed.", active: true },
    { title: "Shipped", date: "Fri, 10th Apr '26", desc: "Item picked up and shipped via Ekart Logistics - FMPP3903353206", active: true },
    { title: "Out For Delivery", date: "Mon, 13th Apr '26", desc: "Your package is with the delivery partner and out for delivery.", active: true },
    { title: "Delivered", date: "Mon, 13th Apr '26", desc: "Your item has been successfully delivered.", active: true },
  ];

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#f3e8ff]/60 via-[#faf5ff] to-[#f5f3ff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#ff2a5f] to-[#ff7e5f]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  return (
    <div className={`min-h-screen pb-20 font-sans text-slate-800 relative transition-colors duration-300 ${pageBg}`}>
      {/* Global Repeating Mithila Art Page Background Texture */}
      {!(isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-45 px-4 py-4 flex items-center justify-between border-b relative z-10 transition-colors duration-300 ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={`p-1 -ml-1 hover:bg-slate-50 rounded-full transition-colors ${headerTextColor}`}>
            <ArrowLeft size={22} />
          </button>
          <h1 className={`text-[17px] font-black tracking-tight ${headerTextColor}`}>Track Order</h1>
        </div>
        <span className="text-[11px] font-black text-[#3E5A44] bg-[#FFF8EE] px-3 py-1 rounded-full border border-emerald-100/50">
          ORDER ID: #{order.id}
        </span>
      </div>

      <div className="relative z-10">

      <div className="w-full mx-auto px-4 pt-5 space-y-5 pb-24">
        {/* Modern Live Status Card */}
        <div className="bg-gradient-to-br from-[#3E5A44] to-[#042112] rounded-3xl p-6 text-white shadow-[0_8px_30px_rgba(8,66,36,0.12)] relative overflow-hidden border border-emerald-800/30">
          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/15 flex-shrink-0">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Current Status</span>
              <h2 className="text-[18px] font-black tracking-tight mt-0.5">{order.status}</h2>
              <p className="text-[11.5px] font-medium text-emerald-100/70 mt-1 leading-normal">
                Estimated Delivery: <span className="text-yellow-400 font-bold">{order.date}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Shipment Stepper */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-5 flex items-center gap-2">
            <Clock size={16} className="text-[#3E5A44]" />
            Shipment Timeline
          </h3>
          <div className="space-y-6 pl-1.5">
            {deliveryUpdates.map((update, index) => {
              const isLast = index === deliveryUpdates.length - 1;
              return (
                <div key={index} className="relative flex gap-5">
                  {/* Vertical Line Connector */}
                  {!isLast && (
                    <div className="absolute left-[11px] top-[24px] bottom-[-28px] w-[2px] bg-slate-100" />
                  )}
                  
                  {/* Dot */}
                  <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    update.active 
                      ? 'bg-emerald-50 text-[#3E5A44] border-2 border-[#3E5A44]' 
                      : 'bg-slate-50 text-slate-300 border-2 border-slate-200'
                  }`}>
                    <CheckCircle2 size={12} className={update.active ? 'text-[#3E5A44]' : 'text-slate-300'} />
                  </div>

                  <div className="flex-1 -mt-0.5 pb-2">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="text-[13px] font-black text-slate-800 leading-none">{update.title}</h4>
                      <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{update.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{update.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Items Details Card */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-5 py-4.5 border-b border-slate-100 flex items-center gap-2">
            <Package size={16} className="text-[#3E5A44]" />
            <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Order Items</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-5 flex gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 p-1.5 border border-slate-100/80">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 py-0.5">
                  <h4 className="text-[13px] font-black text-slate-850 leading-snug line-clamp-2">{item.name}</h4>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Qty: 1</p>
                  <p className="text-[13px] font-black text-[#3E5A44] mt-1.5">{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Delivery Address Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="text-[14px] font-black text-slate-800 tracking-tight flex items-center gap-2">
            <MapPin size={16} className="text-[#3E5A44]" />
            Delivery Details
          </h3>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
              <User size={15} />
            </div>
            <div>
              <h4 className="text-[13px] font-black text-slate-800">Recipient</h4>
              <p className="text-[12px] text-slate-500 mt-0.5">Mukesh Jinodiya</p>
              <p className="text-[11.5px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <Phone size={11} /> 9302841832
              </p>
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-50 pt-4">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
              <MapPin size={15} />
            </div>
            <div>
              <h4 className="text-[13px] font-black text-slate-800">Address</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
                83 kishan pura mataji mandir, sector no. 5, new hars...
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-5 py-4.5 border-b border-slate-100 flex items-center gap-2">
            <ReceiptText size={16} className="text-[#3E5A44]" />
            <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Price Details</h3>
          </div>
          <div className="p-5 space-y-3.5 border-b border-slate-100">
            <div className="flex justify-between items-center text-[12.5px] font-medium text-slate-500">
              <span>Listing Price</span>
              <span className="font-bold text-slate-700">{formatPrice(orderTotalOldPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-[12.5px] font-medium text-slate-500">
              <span>Special Discount</span>
              <span className="font-bold text-[#3E5A44]">- {formatPrice(orderTotalOldPrice - orderTotalPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-[12.5px] font-medium text-slate-500">
              <span>Delivery Charges</span>
              <span className="font-bold text-slate-700">₹16</span>
            </div>
            <div className="pt-3.5 border-t border-dashed border-slate-100 flex justify-between items-center text-[14px] font-black text-slate-800">
              <span>Total Paid Amount</span>
              <span className="text-[#3E5A44]">{formatPrice(orderTotalPrice + 16)}</span>
            </div>
          </div>
          <div className="bg-slate-50/50 px-5 py-4 flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Payment Mode</span>
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-100 shadow-2xs">
              <Wallet size={14} className="text-[#3E5A44]" />
              <span className="text-[12px] font-bold text-slate-800">Cash On Delivery</span>
            </div>
          </div>
        </div>

        {/* Invoice Download Action */}
        <div className="pt-2">
          <button 
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className={`w-full bg-white hover:bg-slate-50/60 active:bg-slate-50 text-slate-800 border border-slate-100 py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.01)] ${isDownloading ? 'opacity-50' : ''}`}
          >
            <Download size={18} className={isDownloading ? "animate-bounce text-[#3E5A44]" : "text-[#3E5A44]"} />
            <span className="text-[13.5px] font-black uppercase tracking-wider">
              {isDownloading ? 'Downloading...' : 'Download Invoice'}
            </span>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default OrderDetail;
