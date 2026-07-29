import React, { useState, useEffect } from 'react';
import { ShoppingBag, Download, CheckCircle2, XCircle, Clock, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { reportsApi } from '../../services/api';
import { mapOrderReportData } from '../../utils/mappers';

const OrderReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await reportsApi.getOrderReport({ days: 180 });
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setReportData([]);
      } else {
        setError(null);
        setReportData(mapOrderReportData(data));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { label: 'Total Orders', value: reportData.reduce((s, r) => s + (r.total || 0), 0).toLocaleString() || '0', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Completed', value: reportData.reduce((s, r) => s + (r.completed || 0), 0).toLocaleString() || '0', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Cancelled', value: reportData.reduce((s, r) => s + (r.cancelled || 0), 0).toLocaleString() || '0', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Returned', value: reportData.reduce((s, r) => s + (r.returned || 0), 0).toLocaleString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Order Report</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Order lifecycle analysis, fulfillment rates, and cancellation trends.</p>
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
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-8">Order Status Distribution</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.length ? reportData : [{ month: '—', completed: 0, cancelled: 0, returned: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
              <Legend wrapperStyle={{fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'}} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="returned" name="Returned" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50"><h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Monthly Breakdown</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Month</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Completed</th><th className="px-6 py-4">Cancelled</th><th className="px-6 py-4">Returned</th><th className="px-6 py-4">Completion Rate</th></tr></thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900 font-montserrat">{row.month}</td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{row.total.toLocaleString()}</td>
                  <td className="px-6 py-5 font-bold text-green-600">{row.completed.toLocaleString()}</td>
                  <td className="px-6 py-5 font-bold text-red-500">{row.cancelled}</td>
                  <td className="px-6 py-5 font-bold text-amber-500">{row.returned}</td>
                  <td className="px-6 py-5"><span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[9px] font-black uppercase tracking-widest">{Math.round((row.completed/row.total)*100)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderReport;
