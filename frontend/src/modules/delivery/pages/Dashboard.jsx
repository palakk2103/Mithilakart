import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  TrendingUp, Package, CheckCircle2, Clock, 
  ChevronRight, MapPin, ArrowRight, Zap, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboard, getOrders, getEarnings } from '../services/deliveryApi';
import useDeliveryStore from '../../../store/useDeliveryStore';
import useDeliverySocket from '../hooks/useDeliverySocket';

const formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
};

const mapOrderRow = (assignment = {}) => {
  const order = assignment.order || assignment.orderId || {};
  const shipping = order.shippingAddress || order.addressSnapshot || assignment.shippingAddress || {};
  return {
    id: order.id || order._id || assignment.orderId || assignment._id,
    orderNumber: order.orderNumber,
    customer: shipping.name || order.customerName || assignment.customerName || 'Customer',
    address: formatAddress(shipping) || order.address || assignment.address || '—',
    items: order.itemCount || assignment.items || 1,
    distance: assignment.distance || '—',
    earning: assignment.earningAmount ?? assignment.earning ?? 0,
    status: assignment.status,
  };
};

const EarningsChart = ({ weeklyTotal, weeklyValues, currentDay }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = weeklyValues?.length === 7 ? weeklyValues : [0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...values, 1);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Performance</h3>
          <p className="text-lg font-black text-slate-900 mt-0.5">₹{Number(weeklyTotal || 0).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          <TrendingUp size={12} />
          <span>+12%</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-2 h-24 px-1">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full relative flex items-end justify-center h-full">
               <motion.div 
                 initial={{ height: 0 }}
                 animate={{ height: `${(v / maxVal) * 100}%` }}
                 transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }}
                 className={`w-full max-w-[8px] rounded-full transition-colors ${i === currentDay ? 'bg-blue-600' : 'bg-slate-100 group-hover:bg-slate-200'}`}
               />
               {i === currentDay && v > 0 && (
                 <div className="absolute -top-6 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                   ₹{v}
                 </div>
               )}
            </div>
            <span className={`text-[8px] font-bold ${i === currentDay ? 'text-blue-600' : 'text-slate-400'}`}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ShiftTimer = ({ isOnline }) => {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    let interval = null;
    if (isOnline) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isOnline]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between text-white overflow-hidden relative">
      <div className="relative z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Shift Time</p>
        <p className="text-2xl font-mono font-black mt-1 tabular-nums">{formatTime(seconds)}</p>
      </div>
      <div className="relative z-10 text-right">
        <div className={`w-2 h-2 rounded-full ml-auto mb-1 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
        <p className="text-[10px] font-bold text-slate-400">{isOnline ? 'Recording' : 'Paused'}</p>
      </div>
      {isOnline && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-blue-600/20 blur-3xl rounded-full"
        />
      )}
    </div>
  );
};

const CircularProgress = ({ current, total, label }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-12 h-12 -rotate-90">
          <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
          <motion.circle 
            cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-blue-600"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-black text-slate-900">{current}</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-bold text-slate-900">Goal: {total} deliveries</p>
      </div>
    </div>
  );
};

const buildWeeklyFromEarnings = (items = []) => {
  const values = [0, 0, 0, 0, 0, 0, 0];
  items.forEach((item) => {
    const date = new Date(item.creditedAt || item.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const dayIdx = (date.getDay() + 6) % 7;
    values[dayIdx] += item.amount || 0;
  });
  return values;
};

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { isOnline } = useOutletContext();
  const { profile, fetchProfile } = useDeliveryStore();
  const [dashboard, setDashboard] = React.useState(null);
  const [activeOrder, setActiveOrder] = React.useState(null);
  const [pendingOrders, setPendingOrders] = React.useState([]);
  const [recentDeliveries, setRecentDeliveries] = React.useState([]);
  const [weeklyValues, setWeeklyValues] = React.useState([0, 0, 0, 0, 0, 0, 0]);

  const loadDashboardData = React.useCallback(async () => {
    try {
      const [dashResult, ordersResult, earningsResult] = await Promise.allSettled([
        getDashboard(),
        getOrders(),
        getEarnings(),
      ]);

      const dash = dashResult.status === 'fulfilled' ? dashResult.value : {};
      const ordersRes = ordersResult.status === 'fulfilled' ? ordersResult.value : null;
      const earningsRes = earningsResult.status === 'fulfilled' ? earningsResult.value : null;

      setDashboard(dash || {});

      if (ordersRes) {
        const pending = (ordersRes?.available || []).map(mapOrderRow);
        const assigned = (ordersRes?.assigned || []).map(mapOrderRow);
        const inProgress = assigned.find((o) => ['accepted', 'picked_up', 'assigned'].includes(o.status));

        setPendingOrders(pending);
        setActiveOrder(inProgress || null);
      }

      const earningsItems = Array.isArray(earningsRes) ? earningsRes : (earningsRes?.items || []);
      setWeeklyValues(buildWeeklyFromEarnings(earningsItems));
      setRecentDeliveries(
        earningsItems.slice(0, 3).map((item) => ({
          id: item.orderId?._id || item.orderId || item._id,
          customer: item.orderId?.shippingAddress?.name || 'Customer',
          address: formatAddress(item.orderId?.shippingAddress) || '—',
          earning: item.amount || 0,
          time: item.creditedAt ? new Date(item.creditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          status: 'delivered',
        }))
      );
    } catch {
      // keep UI defaults on error
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, isOnline]);

  useDeliverySocket(() => {
    loadDashboardData();
  });

  const stats = [
    { label: "Today's Earnings", value: `₹${dashboard?.totalEarnings ?? 0}`, sub: activeOrder ? `+₹${activeOrder.earning} active` : '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Avg. Time', value: '22 min', sub: 'per delivery', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Orders Left', value: String(pendingOrders.length), sub: 'new nearby', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const weeklyTotal = weeklyValues.reduce((sum, v) => sum + v, 0);
  const currentDay = (new Date().getDay() + 6) % 7;
  const displayName = profile.fullName || 'Partner';

  return (
    <div className="space-y-4 px-4 pt-5 pb-24">
      <ShiftTimer isOnline={isOnline} />

      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 text-blue-700 px-5 py-4 rounded-2xl flex items-center gap-3 border border-blue-100"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap size={16} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider">Ready to earn?</p>
            <p className="text-[10px] text-blue-600/70 font-bold">Go online to see new delivery orders</p>
          </div>
          <ArrowRight size={16} className="opacity-50" />
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hi, {displayName.split(' ')[0]} 👋</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{profile.city || 'Delivery Zone'}</p>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
          <User size={20} />
        </div>
      </div>

      <CircularProgress current={dashboard?.completedDeliveries ?? 0} total={10} label="Daily Goal Progress" />

      {isOnline && pendingOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">New Orders</h2>
            <button
              onClick={() => navigate('/delivery/orders')}
              className="text-blue-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          {pendingOrders.slice(0, 3).map((order) => (
            <motion.button
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/delivery/orders')}
              className="w-full bg-white rounded-3xl p-4 text-left border border-amber-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">New Assignment</p>
                  <p className="text-base font-black text-slate-900">{order.customer}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">#{order.orderNumber || order.id}</p>
                </div>
                <p className="text-lg font-black text-green-600">+₹{order.earning}</p>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <MapPin size={13} />
                <span className="truncate">{order.address}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {isOnline && activeOrder && (
        <motion.button
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate(`/delivery/orders/${activeOrder.id}`)}
          className="w-full bg-blue-600 text-white rounded-3xl p-5 text-left shadow-xl shadow-blue-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Delivery</span>
              </div>
              <p className="text-lg font-black leading-tight">{activeOrder.customer}</p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-full">
              <span className="text-xs font-black">+₹{activeOrder.earning}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-bold mb-4">
            <MapPin size={13} />
            <span className="truncate">{activeOrder.address}</span>
            <span className="opacity-60 whitespace-nowrap">• {activeOrder.distance}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-full">In Transit</span>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
              View Details <ArrowRight size={14} />
            </div>
          </div>
        </motion.button>
      )}

      <EarningsChart weeklyTotal={weeklyTotal} weeklyValues={weeklyValues} currentDay={currentDay} />

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-3 border border-slate-50 shadow-sm"
          >
            <div className={`w-7 h-7 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
              <stat.icon size={14} />
            </div>
            <p className="text-sm font-black text-slate-900 leading-none">{stat.value}</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h2>
          <button onClick={() => navigate('/delivery/orders')} className="text-blue-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            History <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {recentDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-6 border border-slate-50 shadow-sm text-center">
              <p className="text-[11px] text-slate-400 font-bold uppercase">No recent deliveries</p>
            </div>
          ) : (
            recentDeliveries.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl px-4 py-3.5 border border-slate-50 shadow-sm flex items-center gap-4">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{d.customer}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{d.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-green-600">+₹{d.earning}</p>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5">{d.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
