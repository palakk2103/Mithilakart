import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellersApi } from '../services/api';
import { extractList, mapVendor } from '../utils/mappers';
import { 
  Filter, MoreVertical, ExternalLink, 
  UserCheck, UserX, Ban, MessageSquare, CheckCircle2,
  XCircle, Clock, Store, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'All', label: 'All', icon: Store, color: 'bg-slate-100 text-slate-600' },
  { key: 'Pending', label: 'Pending', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { key: 'Approved', label: 'Active', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
  { key: 'Blocked', label: 'Rejected', icon: XCircle, color: 'bg-red-50 text-red-600' },
  { key: 'Suspended', label: 'Suspended', icon: Ban, color: 'bg-orange-50 text-orange-600' },
];

const VendorList = () => {
  const navigate = useNavigate();
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const { data, error: apiError } = await sellersApi.getAll();
    if (apiError) {
      setError(apiError);
      setAllVendors([]);
    } else {
      setError(null);
      setAllVendors(extractList(data).map(mapVendor));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = allVendors.filter(v => 
    (filterStatus === 'All' || v.status === filterStatus) &&
    (v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     v.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusCounts = {
    All: allVendors.length,
    Pending: allVendors.filter(v => v.status === 'Pending').length,
    Approved: allVendors.filter(v => v.status === 'Approved').length,
    Blocked: allVendors.filter(v => v.status === 'Blocked').length,
    Suspended: allVendors.filter(v => v.status === 'Suspended').length,
  };

  const handleQuickApprove = async (e, vendorId) => {
    e.stopPropagation();
    setActionLoadingId(vendorId);
    const { error: apiError } = await sellersApi.approve(vendorId);
    if (apiError) {
      toast.error(apiError);
    } else {
      toast.success('Vendor approved successfully!');
      setAllVendors(prev => prev.map(v => 
        v.id === vendorId ? { ...v, status: 'Approved' } : v
      ));
    }
    setActionLoadingId(null);
  };

  const handleQuickReject = async (e, vendorId) => {
    e.stopPropagation();
    setActionLoadingId(vendorId);
    const { error: apiError } = await sellersApi.reject(vendorId, 'Rejected by admin');
    if (apiError) {
      toast.error(apiError);
    } else {
      toast.success('Vendor rejected.');
      setAllVendors(prev => prev.map(v => 
        v.id === vendorId ? { ...v, status: 'Blocked' } : v
      ));
    }
    setActionLoadingId(null);
  };

  const handleQuickSuspend = async (e, vendorId) => {
    e.stopPropagation();
    setActionLoadingId(vendorId);
    const { error: apiError } = await sellersApi.suspend(vendorId);
    if (apiError) {
      toast.error(apiError);
    } else {
      toast.success('Vendor suspended.');
      setAllVendors(prev => prev.map(v => 
        v.id === vendorId ? { ...v, status: 'Suspended' } : v
      ));
    }
    setActionLoadingId(null);
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      Approved: 'bg-green-50 text-green-600 border-green-100',
      Pending: 'bg-amber-50 text-amber-600 border-amber-100',
      Suspended: 'bg-orange-50 text-orange-600 border-orange-100',
      Blocked: 'bg-red-50 text-red-600 border-red-100'
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[status] || colors.Blocked}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat">Vendor Directory</h2>
          <p className="text-slate-400 font-medium text-sm mt-1 font-raleway">Manage and monitor all platform partners.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-80">
            <SearchInput 
              type="text" 
              placeholder="Search vendor, email or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchVendors}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh list"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {statusCounts[tab.key] > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                filterStatus === tab.key 
                  ? 'bg-white/20 text-white' 
                  : tab.key === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {statusCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending Alert Banner */}
      {statusCounts.Pending > 0 && filterStatus !== 'Pending' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
        >
          <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
            <Clock size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {statusCounts.Pending} vendor{statusCounts.Pending > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-xs text-amber-600 mt-0.5">New seller registrations need your review</p>
          </div>
          <button 
            onClick={() => setFilterStatus('Pending')}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all"
          >
            Review Now
          </button>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors', value: allVendors.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: statusCounts.Approved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Approval', value: statusCounts.Pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Suspended', value: statusCounts.Suspended, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Vendor / ID</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Owner / Contact</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor, index) => (
                    <motion.tr 
                      key={vendor.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-sm border border-slate-100 group-hover:border-blue-200 transition-colors text-sm">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm group-hover:text-blue-500 transition-colors">{vendor.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {vendor.id?.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-700 text-sm">{vendor.owner}</p>
                        <p className="text-xs text-slate-400 font-medium">{vendor.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-900 text-sm">₹{vendor.revenue?.toLocaleString() || 0}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-500">{vendor.joined}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-1.5">
                          {vendor.status === 'Pending' && (
                            <>
                              <button 
                                onClick={(e) => handleQuickApprove(e, vendor.id)}
                                disabled={actionLoadingId === vendor.id}
                                className="p-2 bg-green-50 border border-green-100 rounded-xl text-green-600 hover:bg-green-100 transition-all shadow-sm disabled:opacity-50"
                                title="Approve Vendor"
                              >
                                <UserCheck size={16} />
                              </button>
                              <button 
                                onClick={(e) => handleQuickReject(e, vendor.id)}
                                disabled={actionLoadingId === vendor.id}
                                className="p-2 bg-red-50 border border-red-100 rounded-xl text-red-500 hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
                                title="Reject Vendor"
                              >
                                <UserX size={16} />
                              </button>
                            </>
                          )}
                          {vendor.status === 'Approved' && (
                            <button 
                              onClick={(e) => handleQuickSuspend(e, vendor.id)}
                              disabled={actionLoadingId === vendor.id}
                              className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500 hover:bg-orange-100 transition-all shadow-sm disabled:opacity-50"
                              title="Suspend Vendor"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/vendors/${vendor.id}`); }}
                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                            title="View Details"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <Store size={28} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">
                          {loading ? 'Loading vendors...' : 'No vendors found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-8 py-5 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400">
            Showing {filteredVendors.length} of {allVendors.length} vendors
            {filterStatus !== 'All' && <span className="text-slate-500"> • Filtered by: {filterStatus}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
