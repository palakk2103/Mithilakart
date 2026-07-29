import React, { useState, useEffect } from 'react';
import { Package, Download, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { reportsApi } from '../../services/api';
import { mapInventoryReportData } from '../../utils/mappers';
import { StatusBadge } from '../../components/ui';

const InventoryReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await reportsApi.getInventoryReport();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setReportData([]);
      } else {
        setError(null);
        setReportData(mapInventoryReportData(data));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalProducts = reportData.reduce((sum, c) => sum + c.totalProducts, 0);
  const totalOOS = reportData.reduce((sum, c) => sum + c.outOfStock, 0);
  const totalLow = reportData.reduce((sum, c) => sum + c.lowStock, 0);

  const stats = [
    { label: 'Total Products', value: totalProducts.toString(), icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'In Stock', value: reportData.reduce((s, c) => s + c.inStock, 0).toString(), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Low Stock', value: totalLow.toString(), icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Out of Stock', value: totalOOS.toString(), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Inventory Report</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Stock levels, category distribution, and inventory health overview.</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
          <Download size={16} /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}><stat.icon size={22} /></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p><p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-8">Stock Distribution by Category</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.length ? reportData : [{ category: '—', inStock: 0, lowStock: 0, outOfStock: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
              <Legend wrapperStyle={{fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'}} />
              <Bar dataKey="inStock" name="In Stock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey="lowStock" name="Low Stock" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey="outOfStock" name="Out of Stock" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50"><h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Category Breakdown</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Category</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">In Stock</th><th className="px-6 py-4">Low Stock</th><th className="px-6 py-4">Out of Stock</th><th className="px-6 py-4">Health</th></tr></thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {reportData.map((row, i) => {
                const healthPct = Math.round((row.inStock / row.totalProducts) * 100);
                return (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-900 font-montserrat">{row.category}</td>
                    <td className="px-6 py-5 font-black text-slate-900 font-roboto">{row.totalProducts}</td>
                    <td className="px-6 py-5 font-bold text-green-600">{row.inStock}</td>
                    <td className="px-6 py-5 font-bold text-amber-500">{row.lowStock}</td>
                    <td className="px-6 py-5 font-bold text-red-500">{row.outOfStock}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                          <div className={`h-full rounded-full ${healthPct > 80 ? 'bg-green-500' : healthPct > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${healthPct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{healthPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
