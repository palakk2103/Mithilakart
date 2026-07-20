import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, 
  DollarSign, ArrowUpRight, ArrowDownRight, Activity,
  Filter, Calendar, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { analyticsApi } from '../services/api';
import { formatCurrency, mapAnalyticsCategoryShare, mapAnalyticsRevenue } from '../utils/mappers';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, change, icon: Icon, isPositive }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 font-roboto">{value}</h3>
    </div>
  </motion.div>
);

const Analytics = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [categoryShare, setCategoryShare] = useState([]);
  const [userSummary, setUserSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [salesRes, revenueRes, usersRes, productsRes] = await Promise.all([
        analyticsApi.getSalesAnalytics({ days: 180 }),
        analyticsApi.getRevenueAnalytics({ period: '6months' }),
        analyticsApi.getUserAnalytics(),
        analyticsApi.getProductAnalytics(),
      ]);
      if (cancelled) return;

      const salesRows = mapAnalyticsRevenue(salesRes.data || revenueRes.data);
      setRevenueData(salesRows.length ? salesRows : mapAnalyticsRevenue(revenueRes.data));
      setCategoryShare(mapAnalyticsCategoryShare(productsRes.data));
      setUserSummary(usersRes.data || null);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalRevenue = revenueData.reduce((sum, row) => sum + (row.rev || 0), 0);
  const totalOrders = revenueData.reduce((sum, row) => sum + (row.orders || 0), 0);
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const activeBuyers = userSummary?.activeUsers ?? userSummary?.count ?? 0;

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Market Analytics</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">In-depth platform performance, user acquisition, and sales intelligence.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-3 shadow-sm flex-1 sm:flex-none">
             <Calendar size={16} className="text-slate-400" />
             <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Last 6 Months</span>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex-1 sm:flex-none">
            <Download size={16} />
            Generate PDF
          </button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Net Revenue" value={formatCurrency(totalRevenue)} change="+18.5%" icon={DollarSign} isPositive={true} />
        <StatCard title="Conversion Rate" value={totalOrders ? `${Math.min(99, Math.round((totalOrders / Math.max(activeBuyers, 1)) * 100) / 10)}%` : '0%'} change="+2.1%" icon={Activity} isPositive={true} />
        <StatCard title="Active Buyers" value={Number(activeBuyers).toLocaleString('en-IN')} change="+8.4%" icon={Users} isPositive={true} />
        <StatCard title="Avg Order Value" value={formatCurrency(avgOrderValue)} change="-1.2%" icon={ShoppingBag} isPositive={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Revenue & Order Growth</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Revenue
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Orders
                 </div>
              </div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={revenueData.length ? revenueData : [{ month: '—', rev: 0, orders: 0 }]}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                    <Tooltip 
                       contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                    />
                    <Area type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Category Share */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
           <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-8 font-montserrat text-center">Catalog Performance</h3>
           <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={categoryShare.length ? categoryShare : [{ name: 'No Data', value: 1 }]}
                       cx="50%"
                       cy="50%"
                       innerRadius={65}
                       outerRadius={85}
                       paddingAngle={8}
                       dataKey="value"
                    >
                       {categoryShare.length ? categoryShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       )) : (
                          <Cell fill="#cbd5e1" />
                       )}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                 <p className="text-2xl font-black text-slate-900">+24%</p>
              </div>
           </div>
           <div className="mt-8 space-y-3">
              {(categoryShare.length ? categoryShare : [{ name: 'No Data', value: 0 }]).map((item, i) => (
                 <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}} />
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 font-roboto">{item.value}%</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Top Vendors */}
         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Top Performing Vendors</h3>
               <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
               {[
                 { name: 'Fashion Hub', rev: '₹4.5L', growth: '+22%', orders: 450, color: 'text-green-500' },
                 { name: 'Elite Electronics', rev: '₹3.2L', growth: '+15%', orders: 120, color: 'text-green-500' },
                 { name: 'Glow Cosmetics', rev: '₹2.8L', growth: '+8%', orders: 340, color: 'text-green-500' },
                 { name: 'Modern Home', rev: '₹2.1L', growth: '-2%', orders: 95, color: 'text-red-500' },
               ].map((vendor, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-slate-400 border border-slate-100">
                          {vendor.name.charAt(0)}
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900 font-montserrat leading-none">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{vendor.orders} Orders</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900 font-roboto leading-none">{vendor.rev}</p>
                       <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${vendor.color}`}>{vendor.growth}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Retention Map */}
         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-8 font-montserrat">User Retention Analysis</h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData.length ? revenueData : [{ month: '—', orders: 0 }]}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                     <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                     />
                     <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl flex items-start gap-3">
               <Activity size={20} className="text-blue-500 mt-1" />
               <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                  Platform retention has improved by <strong>5.4%</strong> since April. Top retention factor is <strong>Fashion category</strong> repeat buys.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
