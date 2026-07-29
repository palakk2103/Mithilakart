import React, { useState, useEffect } from 'react';
import { dashboardApi, sellersApi, reportsApi } from '../services/api';
import { extractList, mapDashboardStats, mapPendingVendor, mapRevenueChart } from '../utils/mappers';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [systemStats, setSystemStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeVendors: 0,
    platformCommission: 0,
  });
  const [pendingVendors, setPendingVendors] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryData, setCategoryData] = useState([]);

  const fetchDashboard = async () => {
    setLoading(true);
    const [statsRes, revenueRes, vendorsRes, inventoryRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRevenueChart('7d'),
      sellersApi.getAll({ kycStatus: 'pending' }),
      reportsApi.getInventoryReport({ limit: 10 }),
    ]);

    if (statsRes.error && revenueRes.error && vendorsRes.error) {
      setError(statsRes.error || revenueRes.error);
    } else {
      setError(null);
      if (statsRes.data) setSystemStats(mapDashboardStats(statsRes.data));
      if (revenueRes.data) setSalesData(mapRevenueChart(revenueRes.data));
      if (vendorsRes.data) {
        setPendingVendors(extractList(vendorsRes.data).map(mapPendingVendor));
      }
      if (inventoryRes.data) {
        const rows = extractList(inventoryRes.data);
        setCategoryData(
          rows.slice(0, 4).map((row) => ({
            name: row.category || row.name || 'Category',
            value: row.count ?? row.stock ?? row.value ?? 0,
          }))
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const StatCard = ({ title, value, change, icon: Icon, isPositive }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium font-raleway">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1 font-roboto">{value}</h3>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat">System Overview</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Real-time performance metrics and platform health.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-blue-100 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all">
            Download Report
          </button>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${systemStats.totalRevenue.toLocaleString()}`} change="+12.5%" icon={DollarSign} isPositive={true} />
        <StatCard title="Total Orders" value={systemStats.totalOrders.toLocaleString()} change="+5.2%" icon={ShoppingBag} isPositive={true} />
        <StatCard title="Active Vendors" value={systemStats.activeVendors} change="+8.1%" icon={Users} isPositive={true} />
        <StatCard title="Platform Comm." value={`₹${systemStats.platformCommission.toLocaleString()}`} change="-2.4%" icon={TrendingUp} isPositive={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Revenue Trend</h3>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-black/5">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData.length ? salesData : [{ name: '—', sales: 0 }]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-6 font-montserrat">Category Share</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {categoryData.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}} />
                  <span className="text-sm font-bold text-blue-700 font-raleway">{item.name}</span>
                </div>
                <span className="text-sm font-black text-blue-900 font-roboto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-montserrat">Pending Approvals</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              {pendingVendors.length} New Requests
            </span>
          </div>
          <div className="space-y-4">
            {pendingVendors.map((vendor) => (
              <div key={vendor.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-900 shadow-sm border border-slate-100 shrink-0">
                    {vendor.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm truncate">{vendor.name}</h4>
                    <p className="text-xs text-slate-400 font-medium truncate">{vendor.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <AlertCircle size={20} />
                  </button>
                  <button className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-4 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
            View All Requests
          </button>
        </div>

        {/* Live Activity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-6 font-montserrat">Live Activity</h3>
          <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {[
              { title: 'New Payout Request', desc: 'Elite Electronics requested ₹50,000', time: '2 mins ago', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50' },
              { title: 'New Product Upload', desc: 'Fashion Hub added "Summer Dress"', time: '15 mins ago', icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50' },
              { title: 'Order Disputed', desc: 'Order #OD1234 by Customer ID #542', time: '1 hour ago', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
              { title: 'Vendor Verified', desc: 'Global Tech verification completed', time: '2 hours ago', icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            ].map((activity, i) => (
              <div key={i} className="relative flex gap-6">
                <div className={`z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.bg} ${activity.color} shadow-sm border border-white`}>
                  <activity.icon size={18} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm leading-none">{activity.title}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1.5">{activity.desc}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Clock size={10} />
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
