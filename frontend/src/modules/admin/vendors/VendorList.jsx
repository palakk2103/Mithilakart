import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellersApi } from '../services/api';
import { extractList, mapVendor } from '../utils/mappers';
import { 
  Search, Filter, MoreVertical, ExternalLink, 
  UserCheck, UserX, Ban, MessageSquare, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VendorList = () => {
  const navigate = useNavigate();
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await sellersApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setAllVendors([]);
      } else {
        setError(null);
        setAllVendors(extractList(data).map(mapVendor));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredVendors = allVendors.filter(v => 
    (filterStatus === 'All' || v.status === filterStatus) &&
    (v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      Approved: 'bg-green-50 text-green-600',
      Pending: 'bg-amber-50 text-amber-600',
      Suspended: 'bg-red-50 text-red-600',
      Blocked: 'bg-slate-100 text-slate-500'
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[status] || colors.Blocked}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
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
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors', value: allVendors.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: allVendors.filter(v => v.status === 'Approved').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'New This Month', value: 12, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Top Performers', value: 8, color: 'text-amber-600', bg: 'bg-amber-50' }
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
                {filteredVendors.map((vendor, index) => (
                  <motion.tr 
                    key={vendor.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-sm border border-slate-100 group-hover:border-blue-200 transition-colors">
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm group-hover:text-blue-500 transition-colors">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-700 text-sm">{vendor.owner}</p>
                      <p className="text-xs text-slate-400 font-medium">{vendor.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={vendor.status} />
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 text-sm">₹{vendor.revenue?.toLocaleString() || 0}</p>
                      <p className="text-[10px] text-green-500 font-black uppercase tracking-tight">+15% this month</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-500">{vendor.joined}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                          <MessageSquare size={18} />
                        </button>
                        <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                          <ExternalLink size={18} />
                        </button>
                        <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-8 py-6 bg-blue-50/10 border-t border-blue-50 flex justify-between items-center">
          <p className="text-xs font-bold text-blue-400">Showing 1 to {filteredVendors.length} of {allVendors.length} vendors</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-blue-100 rounded-xl text-xs font-black text-blue-300 cursor-not-allowed">Previous</button>
            <button className="px-4 py-2 bg-white border border-blue-100 rounded-xl text-xs font-black text-blue-900 hover:bg-blue-50 shadow-sm transition-all">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
