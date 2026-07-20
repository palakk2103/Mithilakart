import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../services/api';
import { mapOrderDetail, titleCaseStatus } from '../../utils/mappers';
import { 
  ArrowLeft, Package, User, MapPin, 
  CreditCard, Truck, Calendar, Clock,
  Download, Printer, AlertCircle, ChevronRight,
  ShieldCheck, Smartphone, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('Confirmed');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    const { data, error: apiError } = await ordersApi.getById(orderId);
    if (apiError) {
      setError(apiError);
      setOrderData(null);
    } else {
      setError(null);
      const mapped = mapOrderDetail(data);
      setOrderData(mapped);
      setStatus(mapped.status);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!orderId) return;
    const nextStatus = status === 'Confirmed' ? 'packed' : 'confirmed';
    const { data, error: apiError } = await ordersApi.updateStatus(orderId, nextStatus);
    if (!apiError && data) {
      const mapped = mapOrderDetail(data);
      setOrderData(mapped);
      setStatus(mapped.status);
    } else if (!apiError) {
      setStatus(titleCaseStatus(nextStatus));
    }
  };

  const items = orderData?.items || [
    { id: 1, name: 'Premium Leather Satchel', price: '₹4,500', qty: 1, img: 'https://via.placeholder.com/100' },
  ];

  const timeline = orderData?.timeline || [
    { status: 'Pending', date: 'Pending', desc: 'Waiting for order data', completed: false },
  ];

  const customer = orderData?.customer || {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    address: '123, Sector 44, Gurgaon, Haryana - 122003',
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <ArrowLeft size={20} />
           </button>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-2xl font-black text-slate-900 font-montserrat uppercase tracking-tight">Order #{orderId || 'OD87459'}</h1>
                 <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest">{status}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Placed on {orderData?.placedAt || 'May 10, 2026 • 10:30 AM'}</p>
           </div>
        </div>
        <div className="flex gap-3">
           <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <Printer size={20} />
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all">
              <Download size={18} />
              Invoice
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Side: Items & Summary */}
         <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                  <Package size={18} className="text-blue-500" />
                  <h3 className="text-sm font-black text-slate-900 font-montserrat uppercase tracking-widest">Order Items ({orderData?.itemCount || items.length})</h3>
               </div>
               <div className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 flex items-center gap-6">
                       <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex-shrink-0 overflow-hidden">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-black text-slate-900 font-montserrat uppercase tracking-tight text-sm">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">SKU: CO-4589-LX</p>
                          <div className="flex items-center gap-6 mt-4">
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</p>
                                <p className="text-sm font-black text-slate-900 font-roboto">{item.price}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                                <p className="text-sm font-black text-slate-900 font-roboto">× {item.qty}</p>
                             </div>
                             <div className="ml-auto text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-sm font-black text-blue-600 font-roboto">{item.price}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-8 bg-slate-50/50 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <span>Subtotal</span>
                     <span className="text-slate-900">{orderData?.subtotal || '₹5,000'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <span>Delivery Charges</span>
                     <span className="text-green-500">{orderData?.deliveryCharge || 'FREE'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <span>Tax (GST 18%)</span>
                     <span className="text-slate-900">{orderData?.tax || '₹900'}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                     <p className="text-sm font-black text-slate-900 font-montserrat uppercase tracking-widest">Order Total</p>
                     <p className="text-2xl font-black text-blue-600 font-roboto">{orderData?.total || '₹5,900'}</p>
                  </div>
               </div>
            </div>

            {/* Payment & Shipping Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                     <CreditCard size={18} className="text-blue-500" />
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Payment Details</h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
                        <Smartphone size={20} className="text-slate-400" />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{orderData?.paymentMethod || 'UPI Payment'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Txn ID: 874592031</p>
                     </div>
                     <span className="ml-auto px-2 py-0.5 bg-green-50 text-green-500 border border-green-100 rounded text-[8px] font-black uppercase">{orderData?.paymentStatus || 'Success'}</span>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                     <Truck size={18} className="text-blue-500" />
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Shipping Method</h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
                        <ShieldCheck size={20} className="text-slate-400" />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Express Delivery</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Est. Delivery: 12 May</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Side: Customer & Timeline */}
         <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <User size={18} className="text-blue-500" />
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Customer Profile</h3>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl font-black border border-blue-100 shadow-inner">
                     {customer.name.charAt(0)}
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-slate-900 font-montserrat uppercase tracking-tight">{customer.name}</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Customer since 2024</p>
                  </div>
               </div>
               <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
                     <Mail size={14} className="text-slate-300" />
                     {customer.email}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
                     <Smartphone size={14} className="text-slate-300" />
                     {customer.phone}
                  </div>
                  <div className="flex items-start gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                     <MapPin size={14} className="text-slate-300 mt-0.5" />
                     {customer.address}
                  </div>
               </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-500" />
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Order Timeline</h3>
               </div>
               <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {timeline.map((step, i) => (
                    <div key={i} className="flex gap-6 relative">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step.completed ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                          {step.completed ? <ShieldCheck size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                       </div>
                       <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>{step.status}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{step.date}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{step.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button
                 onClick={handleUpdateStatus}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all flex items-center justify-center gap-2"
               >
                  Update Order Status
                  <ChevronRight size={14} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default OrderDetail;
