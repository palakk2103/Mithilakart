/**
 * Return Management Page
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { PageHeader, StatusBadge, SearchFilter } from '../../components/common';
import { Card, Button } from '../../components/ui';
import { ConfirmModal } from '../../components/common';
import { getReturns, approveReturn, rejectReturn } from '../../services/sellerApi';
import { formatCurrency, formatDate, getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'all', label: 'All', icon: RotateCcw },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

const ReturnList = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState({ open: false, type: null, item: null });
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReturns();
      setReturns(data?.returns || []);
    } catch (err) {
      setError(err?.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filtered = useMemo(() => {
    let result = [...returns];
    if (activeTab !== 'all') result = result.filter((r) => r.status === activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.orderId?.toLowerCase().includes(q) || r.customer?.name?.toLowerCase().includes(q));
    }
    return result;
  }, [returns, activeTab, searchQuery]);

  const handleAction = (type, item) => setConfirmAction({ open: true, type, item });

  const confirmHandler = async () => {
    try {
      const { type, item } = confirmAction;
      if (type === 'approve') {
        await approveReturn(item.id);
      } else {
        await rejectReturn(item.id);
      }
      const action = type === 'approve' ? 'approved' : 'rejected';
      toast.success(`Return #${item?.id} has been ${action}`);
      setConfirmAction({ open: false, type: null, item: null });
      fetchReturns();
    } catch (err) {
      toast.error(err?.message || 'Failed to process return');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Returns & Refunds" subtitle={`${returns.length} return requests`} />

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <SearchFilter searchValue={searchQuery} onSearchChange={setSearchQuery} placeholder="Search by order ID or customer..." />

      <div className="space-y-4">
        {filtered.map((ret, i) => (
          <motion.div key={ret.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-gray-200 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-blue-600">#{ret.id}</span>
                    <StatusBadge status={ret.status} />
                    <span className="text-xs text-gray-400">Order #{ret.orderId}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{ret.product?.title || ret.productTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">Customer: {ret.customer?.name || ret.customerName} • Requested: {getRelativeTime(new Date(ret.requestedAt))}</p>
                  <p className="text-xs text-gray-500 mt-1">Reason: <span className="text-gray-700">{ret.reason}</span></p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">Refund: {formatCurrency(ret.refundAmount || 0)}</p>
                </div>
                {ret.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button variant="success" size="sm" icon={CheckCircle} onClick={() => handleAction('approve', ret)}>Approve</Button>
                    <Button variant="danger" size="sm" icon={XCircle} onClick={() => handleAction('reject', ret)}>Reject</Button>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {ret.timeline && ret.timeline.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Timeline</p>
                  <div className="space-y-2">
                    {ret.timeline.map((entry, j) => (
                      <div key={j} className="flex items-center gap-3 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-gray-500">{formatDate(entry.date, 'long')}</span>
                        <span className="text-gray-700">{entry.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <RotateCcw size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No return requests found</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmAction.open}
        onClose={() => setConfirmAction({ open: false, type: null, item: null })}
        onConfirm={confirmHandler}
        type={confirmAction.type === 'approve' ? 'save' : 'warning'}
        title={confirmAction.type === 'approve' ? 'Approve Return' : 'Reject Return'}
        message={`Are you sure you want to ${confirmAction.type} this return request?`}
        confirmLabel={confirmAction.type === 'approve' ? 'Approve' : 'Reject'}
      />
    </div>
  );
};

export default ReturnList;
