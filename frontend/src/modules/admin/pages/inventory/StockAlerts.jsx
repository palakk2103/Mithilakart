import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Search, Filter, MoreVertical, 
  RefreshCcw, Package, AlertCircle, TrendingDown,
  ShoppingBag, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import SearchInput from '../../../../shared/components/SearchInput';
import { reportsApi } from '../../services/api';
import { extractList, mapStockAlert } from '../../utils/mappers';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await reportsApi.getInventoryReport({ lowStock: true });
      if (cancelled) return;
      if (!error) {
        const rows = extractList(data.items || data.products || data);
        setAlerts(rows.map(mapStockAlert));
      } else {
        setAlerts([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const outOfStock = alerts.filter((item) => item.status === 'Out of Stock').length;
  const critical = alerts.filter((item) => item.status === 'Critical').length;
  const low = alerts.filter((item) => item.status === 'Low').length;

  const StatusBadge = ({ status }) => {
    const styles = {
      'Critical': 'bg-red-50 text-red-600 border-red-100',
      'Low': 'bg-amber-50 text-amber-600 border-amber-100',
      'Out of Stock': 'bg-slate-900 text-white border-slate-900',
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Inventory Alerts</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Monitor low-stock items and prevent out-of-stock situations.</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all">
          <RefreshCcw size={16} />
          Bulk Restock Request
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         {[
           { label: 'Out of Stock', value: String(outOfStock).padStart(2, '0'), icon: AlertCircle, color: 'text-slate-900', bg: 'bg-slate-100' },
           { label: 'Critical Level', value: String(critical).padStart(2, '0'), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
           { label: 'Low Stock Items', value: String(low).padStart(2, '0'), icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                 <stat.icon size={28} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                 <p className="text-2xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="w-full sm:max-w-md">
               <SearchInput type="text" placeholder="Search by product or vendor..." />
            </div>
           <div className="flex gap-3 justify-end">
              <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all border border-slate-100 w-full sm:w-auto flex items-center justify-center">
                 <Filter size={18} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Threshold</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">Loading inventory alerts...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">No stock alerts found</td>
                </tr>
              ) : alerts.map((item, i) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <ShoppingBag size={20} />
                       </div>
                       <div>
                          <p className="font-black text-slate-900 font-montserrat uppercase tracking-tight leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{item.category}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600">{item.vendor}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${item.stock === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                       <span className="font-black text-slate-900 font-roboto">{item.stock} Units</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-400 font-roboto">{item.threshold} Units</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                          Restock
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

export default StockAlerts;
