import React, { useEffect, useState } from 'react';
import { 
  DollarSign, TrendingUp, Wallet, ArrowUpRight, 
  ArrowDownRight, PieChart as PieIcon, Download,
  Calendar, CreditCard, Landmark, Receipt
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { financeApi } from '../../services/api';
import { extractList, formatCurrency, mapEarningsTrend, mapPlatformEarnings } from '../../utils/mappers';

const EarningStat = ({ title, value, sub, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
        <Icon size={24} />
      </div>
      <div className="flex items-center gap-1 text-[11px] font-black text-green-500 uppercase tracking-widest">
        <ArrowUpRight size={14} />
        +12.4%
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
    <h3 className="text-3xl font-black text-slate-900 font-roboto leading-none">{value}</h3>
    <p className="text-[11px] text-slate-400 font-medium mt-3">{sub}</p>
  </div>
);

const PlatformEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await financeApi.getEarnings();
      if (cancelled) return;
      if (!error && data) {
        const mapped = mapPlatformEarnings(data);
        setEarnings(mapped);
        setTrend(mapEarningsTrend(data));
        setTransactions(extractList(data.items || data.records || data.transactions).map((row, index) => ({
          id: row.id || row._id || `TXN${8745 + index}`,
          source: row.source || row.orderNumber || row.description || 'Platform',
          type: row.type || 'Sales Commission',
          gross: formatCurrency(row.gross ?? row.grossAmount ?? row.amount ?? 0),
          comm: formatCurrency(row.commission ?? row.netAmount ?? 0),
          status: row.status ? String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1) : 'Settled',
        })));
      } else {
        setEarnings(null);
        setTrend([]);
        setTransactions([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Platform Earnings</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Financial oversight of platform commissions, GMV, and vendor payouts.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Receipt size={16} />
            Invoices
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
            <Download size={16} />
            Finance Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EarningStat 
          title="Net Commission" 
          value={formatCurrency(earnings?.netCommission ?? 0)} 
          sub="Platform earnings after payouts" 
          icon={Landmark} 
          color="text-blue-600" 
          bg="bg-blue-50" 
        />
        <EarningStat 
          title="Gross Merchandise" 
          value={formatCurrency(earnings?.grossMerchandise ?? 0)} 
          sub="Total sales value" 
          icon={DollarSign} 
          color="text-green-600" 
          bg="bg-green-50" 
        />
        <EarningStat 
          title="Pending Payouts" 
          value={formatCurrency(earnings?.pendingPayouts ?? 0)} 
          sub={`${earnings?.payoutCount ?? 0} payout records`} 
          icon={Wallet} 
          color="text-amber-600" 
          bg="bg-amber-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Earnings Breakdown</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Commission
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-indigo-200" />
                  Vendor Share
               </div>
            </div>
          </div>
          <div className="flex-1 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.length ? trend : [{ day: 'Total', platform: 0, vendors: 0 }]}>
                <defs>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="vendors" stroke="#e2e8f0" strokeWidth={2} fill="#f8fafc" />
                <Area type="monotone" dataKey="platform" stroke="#3b82f6" strokeWidth={4} fill="url(#colorComm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
           <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-8 font-montserrat">Revenue Streams</h3>
           <div className="space-y-6 flex-1">
              {[
                { name: 'Fashion Commission', value: '₹18,450', percent: 75, color: 'bg-blue-500' },
                { name: 'Electronics Fees', value: '₹12,200', percent: 60, color: 'bg-green-500' },
                { name: 'Subscription Plans', value: '₹8,500', percent: 45, color: 'bg-amber-500' },
                { name: 'Marketing Services', value: '₹6,130', percent: 30, color: 'bg-indigo-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-center">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.name}</p>
                      <p className="text-xs font-black text-slate-900 font-roboto">{item.value}</p>
                   </div>
                   <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-10 p-5 bg-blue-500 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-blue-100">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Landmark size={80} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Settled this month</p>
              <h4 className="text-2xl font-black mt-1 font-roboto">{formatCurrency(earnings?.netCommission ?? 0)}</h4>
              <button className="mt-4 w-full py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">
                 View History
              </button>
           </div>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Recent Revenue Log</h3>
            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View Ledger</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="px-8 py-4">Ref ID</th>
                     <th className="px-8 py-4">Source</th>
                     <th className="px-8 py-4">Type</th>
                     <th className="px-8 py-4">Gross Amt</th>
                     <th className="px-8 py-4">Comm. (10%)</th>
                     <th className="px-8 py-4">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-600">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm font-bold">No revenue transactions found</td>
                    </tr>
                  ) : transactions.map((txn, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-5 font-black text-blue-600 font-roboto">{txn.id}</td>
                       <td className="px-8 py-5 text-slate-900">{txn.source}</td>
                       <td className="px-8 py-5 uppercase tracking-tighter text-slate-400">{txn.type}</td>
                       <td className="px-8 py-5 font-black text-slate-900 font-roboto">{txn.gross}</td>
                       <td className="px-8 py-5 font-black text-green-600 font-roboto">{txn.comm}</td>
                       <td className="px-8 py-5">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${txn.status === 'Settled' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                             {txn.status}
                          </span>
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

export default PlatformEarnings;
