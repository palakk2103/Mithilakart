import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sellersApi } from '../../services/api';
import { extractList, mapSellerDetail } from '../../utils/mappers';
import { 
  Store, Mail, Phone, MapPin, 
  ShoppingBag, Star, DollarSign, Clock,
  ArrowLeft, ShieldAlert, CheckCircle2, 
  Calendar, FileText, Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/ui';

const defaultSeller = {
  id: '',
  storeName: 'Store',
  owner: '—',
  email: '—',
  phone: '—',
  address: '—',
  status: 'Pending',
  kycStatus: 'Pending',
  pan: '—',
  gst: '—',
  bankAccount: '—',
  totalSales: '₹0',
  totalOrders: 0,
  totalProducts: 0,
  avgRating: 0,
  documents: [],
  topProducts: [],
  recentOrders: [],
};

const SellerDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(defaultSeller);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Storefront');

  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [sellerRes, earningsRes, productsRes, ordersRes] = await Promise.all([
        sellersApi.getById(vendorId),
        sellersApi.getEarnings(vendorId),
        sellersApi.getProducts(vendorId),
        sellersApi.getOrders(vendorId),
      ]);
      if (cancelled) return;
      if (sellerRes.error) {
        setError(sellerRes.error);
      } else {
        setError(null);
        setSeller(mapSellerDetail(sellerRes.data, {
          earnings: earningsRes.data?.total ?? 0,
          products: extractList(productsRes.data),
          orders: extractList(ordersRes.data),
          productCount: extractList(productsRes.data).length,
          orderCount: extractList(ordersRes.data).length,
        }));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [vendorId]);

  const tabs = ['Storefront', 'Products', 'Orders', 'Documents'];

  const stats = [
    { label: 'Total Earnings', value: seller.totalSales, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Products', value: seller.totalProducts.toString(), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Orders Fulfilled', value: seller.totalOrders.toString(), icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Store Rating', value: seller.avgRating.toString(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Back button & profile banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-100 uppercase">
              {seller.storeName.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 font-montserrat uppercase tracking-tight">{seller.storeName}</h1>
                <StatusBadge status={seller.status} />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Seller ID: #{vendorId || seller.id} • KYC Status: <span className="text-green-500">{seller.kycStatus}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
            <ShieldAlert size={16} />
            Suspend Partner
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
            <CheckCircle2 size={16} />
            Verify Account
          </button>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-slate-400 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-8"
            >
              {activeTab === 'Storefront' && (
                <div className="space-y-6">
                  <h3 className="text-base font-black text-slate-900 uppercase font-montserrat tracking-tight border-b border-slate-50 pb-3">Store Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Business Owner</p>
                      <p className="text-sm font-bold text-slate-800">{seller.owner}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PAN ID</p>
                      <p className="text-sm font-bold text-slate-800">{seller.pan}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Email</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Mail size={14} className="text-slate-400" />{seller.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GSTIN</p>
                      <p className="text-sm font-bold text-slate-800">{seller.gst}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Phone</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Phone size={14} className="text-slate-400" />{seller.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payout Destination</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2">{seller.bankAccount}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Physical Address</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><MapPin size={14} className="text-slate-400" />{seller.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Products' && (
                <div className="space-y-6">
                  <h3 className="text-base font-black text-slate-900 uppercase font-montserrat tracking-tight border-b border-slate-50 pb-3">Store Top Catalog</h3>
                  <div className="space-y-4">
                    {seller.topProducts.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{p.sales} Sales</p>
                        </div>
                        <p className="text-sm font-black text-slate-900 font-roboto">{p.revenue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Orders' && (
                <div className="space-y-6">
                  <h3 className="text-base font-black text-slate-900 uppercase font-montserrat tracking-tight border-b border-slate-50 pb-3">Recent Sales Actions</h3>
                  <div className="space-y-4">
                    {seller.recentOrders.map((o, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Order #{o.id}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{o.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 font-roboto">{o.amount}</p>
                          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest block mt-1">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Documents' && (
                <div className="space-y-6">
                  <h3 className="text-base font-black text-slate-900 uppercase font-montserrat tracking-tight border-b border-slate-50 pb-3">Uploaded Legal Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seller.documents.map((d, i) => (
                      <div key={i} className="p-5 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{d.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Uploaded on {d.uploadedAt}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                          d.status === 'Verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SellerDetail;
