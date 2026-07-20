import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../services/api';
import { mapSalesReportData } from '../../utils/mappers';
import { 
  DollarSign, TrendingUp, ShoppingBag, Calendar,
  Download, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const SalesReport = () => {
  const [period, setPeriod] = useState('6months');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const days = period === '30days' ? 30 : period === '1year' ? 365 : 180;
      const { data, error: apiError } = await reportsApi.getSalesReport({ days });
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setReportData([]);
      } else {
        setError(null);
        setReportData(mapSalesReportData(data));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [period]);

  const summaryStats = [
    { label: 'Total Revenue', value: reportData.length ? `₹${reportData.reduce((s, r) => s + (r.revenue || 0), 0).toLocaleString()}` : '₹0', change: '+18.5%', isPositive: true, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Orders', value: reportData.length ? reportData.reduce((s, r) => s + (r.orders || 0), 0).toLocaleString() : '0', change: '+12.3%', isPositive: true, icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Avg Order Value', value: reportData.length ? `₹${Math.round(reportData.reduce((s, r) => s + (r.avgOrderValue || 0), 0) / reportData.length).toLocaleString()}` : '₹0', change: '-2.1%', isPositive: false, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Growth Rate', value: '24.5%', change: '+5.4%', isPositive: true, icon: ArrowUpRight, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Sales Report</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Revenue performance, order trends, and sales intelligence.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-3 shadow-sm flex-1 sm:flex-none">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="text-[11px] font-black text-slate-700 uppercase tracking-widest bg-transparent outline-none cursor-pointer"
            >
              <option value="30days">Last 30 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex-1 sm:flex-none">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
          >
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
                <span className={`text-[10px] font-black ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Revenue Trend</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Revenue
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.length ? reportData : [{ month: '—', revenue: 0 }]}>
                <defs>
                  <linearGradient id="salesRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#salesRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Order Volume</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.length ? reportData : [{ month: '—', orders: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900 font-montserrat">{row.month}</td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">₹{row.revenue.toLocaleString()}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">{row.orders.toLocaleString()}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">₹{row.avgOrderValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
