import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { refundsApi } from '../../services/api';
import { extractList, mapRefund } from '../../utils/mappers';
import { toast } from 'react-hot-toast';
import { 
  RotateCcw, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, Clock, Truck, 
  DollarSign, Eye, Download, ShieldAlert,
  Wallet, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge, Pagination, ConfirmDialog } from '../../components/ui';

const Refunds = () => {
  const [refundsList, setRefundsList] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [confirmType, setConfirmType] = useState(null); // 'approve' | 'reject'
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRefunds = async () => {
    setFetchLoading(true);
    const { data, error: apiError } = await refundsApi.getAll();
    if (apiError) {
      setError(apiError);
      setRefundsList([]);
    } else {
      setError(null);
      setRefundsList(extractList(data).map(mapRefund));
    }
    setFetchLoading(false);
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const itemsPerPage = 10;
  const tabs = ['All', 'Pending', 'Approved', 'Processing', 'Completed', 'Rejected'];

  const filteredRefunds = refundsList.filter(ref => {
    const matchesTab = activeTab === 'All' || ref.status === activeTab;
    const matchesSearch = ref.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ref.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ref.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const paginatedRefunds = filteredRefunds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleActionClick = (refund, type) => {
    setSelectedRefund(refund);
    setConfirmType(type);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedRefund?.returnId || selectedRefund.returnId === '—') {
      toast.error('Missing return ID for this refund');
      setIsConfirmOpen(false);
      return;
    }

    setLoading(true);
    const { error: apiError } = await refundsApi.process({
      returnId: selectedRefund.returnId,
      method: confirmType === 'approve' ? 'wallet' : 'wallet',
    });

    if (!apiError) {
      await fetchRefunds();
    }

    setLoading(false);
    setIsConfirmOpen(false);
  };

  const stats = [
    { label: 'Total Claims', value: refundsList.length.toString(), icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Approvals', value: refundsList.filter(r => r.status === 'Pending').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Refunds', value: refundsList.filter(r => r.status === 'Completed').length.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected Claims', value: refundsList.filter(r => r.status === 'Rejected').length.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Refund Management</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Process wallet refunds, gateway source reversals, and view historical adjustments.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-roboto">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tabs & Search */}
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search by Refund ID, Order ID, or Customer..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            <button className="h-[52px] px-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest w-full sm:w-auto">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Refund ID</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              <AnimatePresence>
                {paginatedRefunds.length > 0 ? paginatedRefunds.map((ref, i) => (
                  <motion.tr 
                    key={ref.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <span className="text-xs font-black text-blue-600 font-roboto">{ref.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-600">{ref.orderId}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{ref.user}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ref.date}</p>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900 font-roboto">{ref.amount}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${ref.method === 'Wallet' ? 'text-indigo-600' : 'text-violet-600'}`}>
                        {ref.method === 'Wallet' ? <Wallet size={12} /> : <Landmark size={12} />}
                        {ref.method}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">{ref.reason}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={ref.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      {['Pending', 'Processing'].includes(ref.status) && ref.returnId && ref.returnId !== '—' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleActionClick(ref, 'approve')}
                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleActionClick(ref, 'reject')}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center text-slate-300">
                      <RotateCcw size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">No refunds found</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginatedRefunds.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRefunds.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        type={confirmType === 'approve' ? 'approve' : 'reject'}
        title={confirmType === 'approve' ? 'Approve Refund Claim' : 'Reject Refund Claim'}
        message={confirmType === 'approve' ? `Are you sure you want to approve refund of ${selectedRefund?.amount} to ${selectedRefund?.user}?` : `Are you sure you want to reject the refund claim for ${selectedRefund?.user}?`}
        loading={loading}
      />
    </div>
  );
};

export default Refunds;
