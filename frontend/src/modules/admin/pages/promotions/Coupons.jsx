import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Filter, MoreVertical, 
  Download, CheckCircle2, XCircle, Clock, 
  Trash2, Edit2, Percent, Tag, Calendar,
  ArrowUpRight, Users, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { couponsApi } from '../../services/api';
import { extractList, formatDate, titleCaseStatus } from '../../utils/mappers';

const mapAdminCoupon = (coupon = {}) => {
  const now = Date.now();
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null;
  let status = 'Active';
  if (!coupon.isActive) status = 'Paused';
  else if (expiresAt && expiresAt < now) status = 'Expiring';
  else if (expiresAt && expiresAt - now < 7 * 24 * 60 * 60 * 1000) status = 'Expiring';

  return {
    id: coupon._id || coupon.id,
    code: coupon.code || '—',
    type: titleCaseStatus(coupon.type || 'percentage'),
    value: coupon.type === 'percentage' || coupon.type === 'percent'
      ? `${coupon.value}%`
      : `₹${Number(coupon.value || 0).toLocaleString('en-IN')}`,
    minOrder: coupon.minOrderAmount ? `₹${Number(coupon.minOrderAmount).toLocaleString('en-IN')}` : '₹0',
    expiry: formatDate(coupon.expiresAt),
    usage: coupon.usageCount ?? 0,
    status,
  };
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await couponsApi.getAll({ limit: 50 });
      if (cancelled) return;
      if (!error) {
        setCoupons(extractList(data).map(mapAdminCoupon));
      } else {
        setCoupons([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const StatusBadge = ({ status }) => {
    const styles = {
      'Active': 'bg-green-50 text-green-600 border-green-100',
      'Expiring': 'bg-amber-50 text-amber-600 border-amber-100',
      'Paused': 'bg-slate-50 text-slate-400 border-slate-100',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Coupon Manager</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Create and manage promotional discounts and marketing offers.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Coupons', value: '12', icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total Redeemed', value: '4.5k', icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Revenue Saved', value: '₹1.2L', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Avg Usage', value: '375', icon: ArrowUpRight, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
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

      {/* Table & Filters */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search by coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="px-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Coupon Info</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Min. Order</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">Loading coupons...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No coupons found</p>
                    <p className="text-xs text-slate-400 mt-2">Create a coupon to start offering discounts.</p>
                  </td>
                </tr>
              ) : coupons.filter((coupon) => !searchQuery || coupon.code.toLowerCase().includes(searchQuery.toLowerCase())).map((coupon) => (
                <tr key={coupon.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-black shadow-inner">
                          <Tag size={18} />
                       </div>
                       <div>
                          <p className="font-black text-slate-900 font-montserrat leading-tight uppercase tracking-widest">{coupon.code}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{coupon.type}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-blue-600 font-roboto text-base">{coupon.value}</td>
                  <td className="px-6 py-5 font-bold text-slate-700">{coupon.minOrder}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                      <Calendar size={12} className="text-slate-300" />
                      {coupon.expiry}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-100">
                      {coupon.usage.toLocaleString()} Times
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={coupon.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal Placeholder */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-white h-full rounded-[32px] shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-slate-900 font-montserrat uppercase">Create New Coupon</h2>
                <button onClick={() => setIsAdding(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Coupon Code</label>
                  <input type="text" placeholder="e.g. SUMMER2026" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 transition-all outline-none uppercase" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Discount Type</label>
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 outline-none appearance-none">
                      <option>Percentage (%)</option>
                      <option>Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Value</label>
                    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Min. Order Requirement</label>
                  <input type="number" placeholder="₹0" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Usage Limit per User</label>
                  <input type="number" placeholder="1" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Expiry Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-3">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button className="flex-1 py-4 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">Publish Coupon</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
