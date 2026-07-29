import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Smartphone, MapPin, 
  ShoppingBag, Star, MessageSquare, Wallet,
  Clock, ArrowLeft, ShieldAlert, CheckCircle2,
  ChevronRight, Calendar, ExternalLink, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usersApi } from '../../services/api';
import { mapUser } from '../../utils/mappers';

const CustomerDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Orders');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await usersApi.getById(userId);
      if (cancelled) return;
      if (!error && data) {
        setCustomer(mapUser(data.user || data));
      } else {
        setCustomer(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const tabs = ['Orders', 'Wishlist', 'Reviews', 'Support', 'Wallet'];

  const stats = [
    { label: 'Total Orders', value: String(customer?.orders ?? 0), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'LTV (Revenue)', value: customer?.totalSpent ?? '₹0', icon: Wallet, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Status', value: customer?.status ?? 'Active', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Member Since', value: customer?.joined ?? '—', icon: Clock, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-bold">Loading customer details...</div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <ArrowLeft size={20} />
           </button>
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-100 uppercase">
                 {(customer?.name || 'U').charAt(0)}
              </div>
              <div>
                 <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-900 font-montserrat uppercase tracking-tight">{customer?.name || 'Customer'}</h1>
                    <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[9px] font-black uppercase tracking-widest">{customer?.status || 'Active'}</span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Customer ID: #{userId || customer?.id || '—'} • Member since {customer?.joined || '—'}</p>
              </div>
           </div>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
              <ShieldAlert size={16} />
              Block Account
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-100 hover:scale-105 transition-all">
              <Wallet size={16} />
              Add Credit
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Sidebar: Profile Summary */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Contact Information</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">
                        <Mail size={18} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{customer?.email || '—'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">
                        <Smartphone size={18} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{customer?.phone || '—'}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <MapPin size={18} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Address</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5 leading-relaxed">Address not available</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <User size={100} />
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Admin Notes</p>
                  <p className="text-[11px] opacity-80 mt-4 leading-relaxed font-medium italic">
                     "Customer is highly active in the Fashion category. Responds well to festive discounts."
                  </p>
                  <button className="mt-4 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:underline">Edit Note</button>
               </div>
            </div>
         </div>

         {/* Main Content: Stats & Activity */}
         <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                     <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 shadow-inner`}>
                        <stat.icon size={20} />
                     </div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                     <p className="text-xl font-black text-slate-900 font-roboto">{stat.value}</p>
                  </div>
               ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
               <div className="flex border-b border-slate-50 overflow-x-auto no-scrollbar">
                  {tabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                        activeTab === tab 
                        ? 'text-blue-600 border-blue-600 bg-blue-50/20' 
                        : 'text-slate-400 border-transparent hover:text-slate-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {activeTab === 'Orders' && (
                    <div className="space-y-4">
                       {[
                         { id: 'OD87459', date: '10 May 2026', total: '₹4,500', status: 'Delivered', items: 2 },
                         { id: 'OD87458', date: '02 May 2026', total: '₹12,200', status: 'Delivered', items: 5 },
                         { id: 'OD87457', date: '25 Apr 2026', total: '₹3,400', status: 'Cancelled', items: 1 },
                       ].map((order) => (
                         <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                  <ShoppingBag size={18} />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Order #{order.id}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{order.date} • {order.items} Items</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right">
                                  <p className="text-sm font-black text-slate-900 font-roboto">{order.total}</p>
                                  <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${order.status === 'Cancelled' ? 'text-red-500' : 'text-green-500'}`}>{order.status}</p>
                               </div>
                               <button className="p-2 bg-white text-slate-300 rounded-lg group-hover:text-blue-500 transition-all">
                                  <ExternalLink size={16} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                  {activeTab !== 'Orders' && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-40">
                       <LayoutGrid size={48} />
                       <p className="text-[10px] font-black uppercase tracking-widest text-center">Activity history for {activeTab}<br/>is being synchronized...</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
