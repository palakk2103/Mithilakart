import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Wallet, CreditCard, TrendingUp, RotateCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { reportsApi } from '../../services/api';
import { mapRefundReportData } from '../../utils/mappers';

const COLORS = ['#3b82f6', '#8b5cf6'];

const RefundReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await reportsApi.getRefundReport();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setReportData([]);
      } else {
        setError(null);
        setReportData(mapRefundReportData(data));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalRefunds = reportData.reduce((s, r) => s + r.total, 0);
  const totalAmount = reportData.reduce((s, r) => s + r.amount, 0);
  const totalWallet = reportData.reduce((s, r) => s + r.wallet, 0);
  const totalSource = reportData.reduce((s, r) => s + r.source, 0);
  const pieData = [{ name: 'Wallet', value: totalWallet }, { name: 'Source', value: totalSource }];

  const stats = [
    { label: 'Total Refunds', value: totalRefunds.toString(), icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Amount', value: `₹${(totalAmount/100000).toFixed(1)}L`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Wallet Refunds', value: totalWallet.toString(), icon: Wallet, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Source Refunds', value: totalSource.toString(), icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Refund Report</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Refund volumes, method distribution, and amount trends.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-8">Refund Amount Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.length ? reportData : [{ month: '—', amount: 0 }]}>
                <defs><linearGradient id="refAmtGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#refAmtGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-6 text-center">Refund Method Split</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value">
                  {pieData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}} /><span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{item.name}</span></div>
                <span className="text-sm font-black text-slate-900 font-roboto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50"><h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Monthly Refund Data</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Month</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Wallet</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Amount</th></tr></thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900 font-montserrat">{row.month}</td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">{row.total}</td>
                  <td className="px-6 py-5 font-bold text-indigo-500">{row.wallet}</td>
                  <td className="px-6 py-5 font-bold text-violet-500">{row.source}</td>
                  <td className="px-6 py-5 font-black text-slate-900 font-roboto">₹{row.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RefundReport;
