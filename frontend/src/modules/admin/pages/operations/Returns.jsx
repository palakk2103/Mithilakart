import React, { useState, useEffect } from 'react';
import { returnsApi } from '../../services/api';
import { extractList, mapReturn } from '../../utils/mappers';
import { 
  RotateCcw, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, Clock, Truck, 
  DollarSign, Package, User, Calendar,
  AlertCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await returnsApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setReturns([]);
      } else {
        setError(null);
        setReturns(extractList(data).map(mapReturn));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleApprove = async (returnId) => {
    const { error: apiError } = await returnsApi.approve(returnId);
    if (!apiError) {
      setReturns((prev) =>
        prev.map((r) => (r.id === returnId ? { ...r, status: 'Approved' } : r))
      );
    }
  };

  const tabs = ['All', 'Requested', 'Approved', 'Pick-up', 'Received', 'Refunded'];

  const StatusBadge = ({ status }) => {
    const styles = {
      'Requested': 'bg-amber-50 text-amber-600 border-amber-100',
      'Approved': 'bg-blue-50 text-blue-600 border-blue-100',
      'Pick-up Scheduled': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'Received': 'bg-purple-50 text-purple-600 border-purple-100',
      'Refunded': 'bg-green-50 text-green-600 border-green-100',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-50 text-slate-400'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Returns & Refunds</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Manage product returns, inspection status and refund processing.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Requests', value: '18', icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: '12', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Refunded Today', value: '₹24,500', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg Resolution', value: '2.4 Days', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Return ID</th>
                <th className="px-6 py-4">Order & Item</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Refund Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {returns.map((item, i) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-xs font-black text-blue-600 font-roboto">{item.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                       <p className="text-sm font-bold text-slate-900 leading-none">{item.item}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Order #{item.orderId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                       <AlertCircle size={14} className="text-amber-500" />
                       {item.reason}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{item.amount}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button
                         onClick={() => handleApprove(item.id)}
                         className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                       >
                          Manage
                       </button>
                       <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                          <MoreVertical size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;
