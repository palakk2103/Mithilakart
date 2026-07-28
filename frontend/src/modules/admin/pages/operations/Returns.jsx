import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { returnsApi, refundsApi } from '../../services/api';
import { extractList, mapReturn } from '../../utils/mappers';
import {
  RotateCcw, MoreVertical,
  CheckCircle2, XCircle, Clock,
  DollarSign, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'seller_approved', label: 'Seller Approved' },
  { key: 'admin_approved', label: 'Admin Approved' },
  { key: 'refunded', label: 'Refunded' },
];

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const { data, error: apiError } = await returnsApi.getAll();
    if (apiError) {
      setError(apiError);
      setReturns([]);
    } else {
      setError(null);
      setReturns(extractList(data).map(mapReturn));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const filteredReturns = useMemo(() => {
    if (activeTab === 'all') return returns;
    return returns.filter((r) => r.rawStatus === activeTab);
  }, [returns, activeTab]);

  const stats = useMemo(() => [
    { label: 'Open Requests', value: returns.filter((r) => r.rawStatus === 'requested').length, icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Seller Approved', value: returns.filter((r) => r.rawStatus === 'seller_approved').length, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ready to Refund', value: returns.filter((r) => r.rawStatus === 'admin_approved').length, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Refunded', value: returns.filter((r) => r.rawStatus === 'refunded').length, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ], [returns]);

  const handleApprove = async (returnId) => {
    setActionLoading(returnId);
    const { error: apiError } = await returnsApi.approve(returnId);
    if (apiError) {
      toast.error(apiError);
    } else {
      toast.success('Return approved');
      await fetchReturns();
    }
    setActionLoading(null);
  };

  const handleReject = async (returnId) => {
    setActionLoading(returnId);
    const { error: apiError } = await returnsApi.reject(returnId, 'Rejected by admin');
    if (apiError) {
      toast.error(apiError);
    } else {
      toast.success('Return rejected');
      await fetchReturns();
    }
    setActionLoading(null);
  };

  const handleProcessRefund = async (returnId) => {
    setActionLoading(returnId);
    const { error: apiError } = await refundsApi.process({ returnId, method: 'wallet' });
    if (apiError) {
      toast.error(apiError);
    } else {
      toast.success('Refund processed to wallet');
      await fetchReturns();
    }
    setActionLoading(null);
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      Requested: 'bg-amber-50 text-amber-600 border-amber-100',
      'Seller Approved': 'bg-blue-50 text-blue-600 border-blue-100',
      'Admin Approved': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      Refunded: 'bg-green-50 text-green-600 border-green-100',
      'Seller Rejected': 'bg-red-50 text-red-600 border-red-100',
      'Admin Rejected': 'bg-red-50 text-red-600 border-red-100',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-50 text-slate-400'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Returns & Refunds</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Manage product returns, inspection status and refund processing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-red-500 font-semibold">{error}</div>
        )}

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
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-bold">Loading returns...</td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-300">
                    <RotateCcw size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">No returns found</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item) => (
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
                        {['requested', 'seller_approved'].includes(item.rawStatus) && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {item.rawStatus === 'admin_approved' && (
                          <button
                            onClick={() => handleProcessRefund(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                          >
                            Refund Wallet
                          </button>
                        )}
                        {['requested', 'seller_approved'].includes(item.rawStatus) && (
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;
