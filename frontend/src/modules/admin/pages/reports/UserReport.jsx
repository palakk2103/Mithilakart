import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, Download, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { reportsApi } from '../../services/api';
import { mapUserReportData } from '../../utils/mappers';

const UserReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await reportsApi.getUserReport();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setReportData([]);
      } else {
        setError(null);
        setReportData(mapUserReportData(data));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { label: 'Total Users', value: reportData.reduce((s, r) => s + (r.activeUsers || 0), 0).toLocaleString() || '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'New This Month', value: '650', icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Active Users', value: '4,500', icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Retention Rate', value: '72%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">User Report</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">User acquisition, retention trends, and growth analytics.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-8">User Growth Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.length ? reportData : [{ month: '—', activeUsers: 0, newUsers: 0 }]}>
                <defs>
                  <linearGradient id="userNewGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="userActiveGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Area type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#userActiveGrad)" />
                <Area type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#userNewGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-500" /> Active Users</div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-blue-500" /> New Users</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat mb-8">Returning Users</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.length ? reportData : [{ month: '—', returningUsers: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Bar dataKey="returningUsers" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50"><h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Monthly User Data</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Month</th><th className="px-6 py-4">New Users</th><th className="px-6 py-4">Active Users</th><th className="px-6 py-4">Returning</th></tr></thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900 font-montserrat">{row.month}</td>
                  <td className="px-6 py-5 font-black text-blue-500 font-roboto">+{row.newUsers}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">{row.activeUsers.toLocaleString()}</td>
                  <td className="px-6 py-5 font-bold text-slate-600">{row.returningUsers.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserReport;
