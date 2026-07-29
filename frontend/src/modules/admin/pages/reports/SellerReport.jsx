import React, { useState, useEffect } from 'react';
import { Store, Download, Calendar, TrendingUp, ShoppingBag, RotateCcw, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { reportsApi } from '../../services/api';
import { mapSellerReportData } from '../../utils/mappers';
import { StatusBadge } from '../../components/ui';

const SellerReport = () => {
  const [sellerData, setSellerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await reportsApi.getSellerReport();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setSellerData([]);
      } else {
        setError(null);
        setSellerData(mapSellerReportData(data));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { label: 'Total Sellers', value: sellerData.length.toString(), icon: Store, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Avg Seller Revenue', value: '₹2.8L', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Avg Orders/Seller', value: '243', icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Avg Rating', value: '4.2', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const chartData = sellerData.map(s => ({ name: s.name, sales: parseInt(String(s.totalSales).replace(/[₹,]/g, ''), 10) || 0, orders: s.orders }));

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Seller Report</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Seller performance metrics, revenue distribution, and platform contribution.</p>
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
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-8">Revenue by Seller</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} width={120} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
              <Bar dataKey="sales" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50"><h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Seller Breakdown</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Seller</th><th className="px-6 py-4">Total Sales</th><th className="px-6 py-4">Orders</th><th className="px-6 py-4">Returns</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Commission</th><th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {sellerData.map((seller, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-black text-xs">{seller.name.charAt(0)}</div><div><p className="font-bold text-slate-900 font-montserrat">{seller.name}</p><p className="text-[10px] text-slate-400 font-bold">{seller.id}</p></div></div></td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{seller.totalSales}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">{seller.orders}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">{seller.returns}</td>
                  <td className="px-6 py-5"><span className="flex items-center gap-1 font-black text-amber-500"><Star size={12} />{seller.rating}</span></td>
                  <td className="px-6 py-5 font-bold text-slate-600">{seller.commission}</td>
                  <td className="px-6 py-5"><StatusBadge status={seller.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerReport;
