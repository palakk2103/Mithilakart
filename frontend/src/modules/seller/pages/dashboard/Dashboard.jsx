/**
 * Seller Dashboard Page
 * Complete dashboard with stats, charts, recent orders, and quick actions.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, DollarSign, Wallet, Star, Users,
  TrendingUp, AlertTriangle, ArrowRight, Plus, BarChart3, Ticket,
  Eye, Clock, CheckCircle2, XCircle, RotateCcw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { StatCard, PageHeader, StatusBadge } from '../../components/common';
import { Card } from '../../components/ui';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getRelativeTime } from '../../utils/formatters';
import {
  getDashboard, getOrders, getProducts, getReviews, getSalesAnalytics, getInventory,
} from '../../services/sellerApi';
import { CHART_COLORS } from '../../constants';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboard, ordersRes, productsRes, reviewsRes, salesMonthly, salesWeekly, inventory] = await Promise.all([
        getDashboard(),
        getOrders(),
        getProducts(),
        getReviews(),
        getSalesAnalytics('monthly'),
        getSalesAnalytics('weekly'),
        getInventory(),
      ]);

      setStats(dashboard || {});
      setRecentOrders((ordersRes?.orders || []).slice(0, 5));
      setTopProducts(
        [...(productsRes?.products || [])].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5)
      );
      const reviewsList = reviewsRes?.reviews || [];
      setLatestReviews(reviewsList.slice(0, 3));
      setReviewCount(reviewsRes?.total ?? reviewsList.length);

      const monthly = Array.isArray(salesMonthly)
        ? salesMonthly
        : salesMonthly?.monthly ?? salesMonthly?.data ?? [];
      const weekly = Array.isArray(salesWeekly)
        ? salesWeekly
        : salesWeekly?.weekly ?? salesWeekly?.data ?? [];
      setMonthlySalesData(monthly);
      setWeeklySalesData(weekly);

      const categories = salesMonthly?.categories ?? salesMonthly?.categoryBreakdown ?? [];
      setCategorySalesData(Array.isArray(categories) ? categories : []);

      setInventoryAlerts(inventory?.alerts || []);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      <PageHeader title="Dashboard" subtitle="Overview of your store performance and fulfillment metrics">
        <button
          onClick={() => navigate('/seller/products/add')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg
                     shadow-xs hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={15} /> Add Product
        </button>
      </PageHeader>

      {/* ─── Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard title="Today's Orders" value={stats.todayOrders || 0} subtitle="orders received today" icon={ShoppingCart} iconBg="bg-blue-50" iconColor="text-blue-600" trend="up" trendValue="+12%" delay={0} />
        <StatCard title="Revenue" value={formatCurrency(stats.revenue || 0)} subtitle="total revenue this month" icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" trend="up" trendValue="+18%" delay={1} />
        <StatCard title="Wallet Balance" value={formatCurrency(stats.walletBalance || 0)} subtitle="available for withdrawal" icon={Wallet} iconBg="bg-purple-50" iconColor="text-purple-600" delay={2} />
        <StatCard title="Avg. Rating" value={stats.averageRating || 0} subtitle={`based on ${reviewCount || 0} reviews`} icon={Star} iconBg="bg-amber-50" iconColor="text-amber-500" trend="up" trendValue="+0.2" delay={3} />
      </div>

      {/* ─── Quick Stats Row ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
        {[
          { label: 'Pending', value: stats.pendingOrders || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: stats.completedOrders || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Cancelled', value: stats.cancelledOrders || 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Returns', value: stats.returns || 0, icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="bg-white rounded-xl border border-slate-100 p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs"
          >
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon size={16} className={item.color} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{item.value}</p>
              <p className="text-[10.5px] text-slate-400 font-semibold mt-1 truncate">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Charts Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Sales Chart */}
        <Card title="Monthly Sales" subtitle="Revenue & orders trend" className="lg:col-span-2">
          <div className="h-[260px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Sales Pie */}
        <Card title="Category Breakdown" subtitle="Sales by category">
          <div className="h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categorySalesData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {categorySalesData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Weekly Orders Chart + Quick Actions ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Weekly Orders" subtitle="Orders this week" className="lg:col-span-2">
          <div className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                <Bar dataKey="orders" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" subtitle="Shortcuts to common tasks">
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Add Product', icon: Plus, path: '/seller/products/add', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'View Orders', icon: ShoppingCart, path: '/seller/orders', color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Analytics', icon: BarChart3, path: '/seller/analytics', color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Coupons', icon: Ticket, path: '/seller/coupons', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Inventory', icon: Package, path: '/seller/inventory', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Earnings', icon: Wallet, path: '/seller/earnings', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${action.bg} hover:scale-105 active:scale-95 transition-all`}
              >
                <action.icon size={22} className={action.color} />
                <span className="text-xs font-semibold text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Recent Orders + Low Stock ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card
          title="Recent Orders"
          headerAction={
            <button onClick={() => navigate('/seller/orders')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          }
        >
          <div className="space-y-3 mt-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/seller/orders/${order.id}`)}
                className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                    <ShoppingCart size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                    <p className="text-xs text-gray-400">{order.customer?.name || 'Customer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.finalAmount || order.totalAmount || 0)}</p>
                  <StatusBadge status={order.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Inventory Alerts */}
        <Card
          title="Inventory Alerts"
          headerAction={
            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              {inventoryAlerts.length} alerts
            </span>
          }
        >
          <div className="space-y-3 mt-4">
            {inventoryAlerts.map((alert) => (
              <div key={alert.productId || alert.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.status === 'out' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <AlertTriangle size={18} className={alert.status === 'out' ? 'text-red-500' : 'text-amber-500'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{alert.title || alert.name}</p>
                    <p className="text-xs text-gray-400">
                      {alert.stock === 0 ? 'Out of stock' : `${alert.stock} units remaining`}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors">
                  Restock
                </button>
              </div>
            ))}

            {/* Top Selling Products */}
            <div className="pt-4 mt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Selling Products</p>
              {topProducts.slice(0, 3).map((product, i) => (
                <div key={product.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-600">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 font-medium line-clamp-1">{product.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{product.sales || 0} sold</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Latest Reviews ─────────────────────────────── */}
      <Card
        title="Latest Reviews"
        headerAction={
          <button onClick={() => navigate('/seller/reviews')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {latestReviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{getRelativeTime(new Date(review.createdAt))}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{review.text}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-900">{review.customer || review.customerName}</p>
                <p className="text-[10px] text-gray-400 truncate ml-2">{review.productTitle}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
