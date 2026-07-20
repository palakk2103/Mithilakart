import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, CheckCircle2, XCircle, 
  Clock, Download, Filter, Search, MoreVertical,
  Banknote, Landmark, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { payoutsApi } from '../services/api';
import { extractList, formatCurrency, titleCaseStatus } from '../utils/mappers';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Processing': 'bg-blue-50 text-blue-600 border-blue-100',
    'Settled': 'bg-green-50 text-green-600 border-green-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  );
};

const Payouts = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [payouts, setPayouts] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const tabs = ['All', 'Pending', 'Processing', 'Settled', 'Rejected'];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await payoutsApi.getAll({ limit: 100 });
      if (cancelled) return;
      if (!error && data) {
        const rows = extractList(data).map((row, index) => ({
          id: row.id || row._id || row.payoutNumber || `PAY${String(index + 1).padStart(3, '0')}`,
          vendor: row.vendor || row.vendorName || row.sellerName || 'Vendor',
          amount: Number(row.amount ?? row.netAmount ?? 0),
          status: titleCaseStatus(row.status || 'pending'),
          date: row.date
            ? new Date(row.date).toISOString().split('T')[0]
            : (row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : '—'),
          method: row.method || row.payoutMethod || 'Bank Transfer',
          bank: row.bank || row.bankName || '—',
        }));
        setPayouts(rows);
        const settled = rows.filter((p) => p.status === 'Settled');
        const pending = rows.filter((p) => p.status === 'Pending' || p.status === 'Processing');
        setEarnings({
          netCommission: settled.reduce((sum, p) => sum + p.amount, 0),
          grossMerchandise: rows.reduce((sum, p) => sum + p.amount, 0),
          pendingPayouts: pending.reduce((sum, p) => sum + p.amount, 0),
          payoutCount: rows.length,
        });
      } else {
        setEarnings(null);
        setPayouts([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredPayouts = payouts.filter((p) => activeTab === 'All' || p.status === activeTab);

  const quickStats = earnings ? [
    { label: 'Total Settled', value: formatCurrency(earnings.netCommission), sub: 'Platform commission', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pending Requests', value: formatCurrency(earnings.pendingPayouts), sub: `${earnings.payoutCount} payout records`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Gross Merchandise', value: formatCurrency(earnings.grossMerchandise), sub: 'Total sales value', icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Open Payouts', value: String(filteredPayouts.length), sub: 'In current view', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ] : [
    { label: 'Total Settled', value: '₹0', sub: 'Last 30 days', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pending Requests', value: '₹0', sub: 'No data', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg Payout Time', value: '—', sub: 'No data', icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Failed Settlements', value: '₹0', sub: 'Requires review', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Vendor Payouts</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Manage settlement requests and financial disbursements to platform partners.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Payout History
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
            <ShieldCheck size={16} />
            Bulk Settle
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search by Vendor or Payout ID..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Payout ID</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Request Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredPayouts.map((payout, i) => (
                  <motion.tr 
                    key={payout.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5 font-black text-blue-600 text-xs font-roboto">{payout.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 uppercase tracking-tighter">
                            {payout.vendor.charAt(0)}
                         </div>
                         <p className="text-sm font-bold text-slate-900">{payout.vendor}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900 font-roboto">₹{payout.amount.toLocaleString()}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <Landmark size={14} className="text-slate-300" />
                         <div>
                            <p className="text-[10px] font-bold text-slate-700">{payout.method}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{payout.bank}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={payout.status} />
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{payout.date}</td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2">
                          <button className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Settle</button>
                          <button className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                             <MoreVertical size={14} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payouts;
