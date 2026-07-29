import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEarnings } from '../services/deliveryApi';
import useDeliveryStore from '../../../store/useDeliveryStore';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatOrderDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const isToday = new Date().toDateString() === date.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today, ${time}` : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const buildWeeklyData = (items = []) => {
  const weekly = DAY_LABELS.map((day) => ({ day, earning: 0, orders: 0 }));
  items.forEach((item) => {
    const date = new Date(item.creditedAt || item.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const idx = (date.getDay() + 6) % 7;
    weekly[idx].earning += item.amount || 0;
    weekly[idx].orders += 1;
  });
  return weekly;
};

const mapHistoryItem = (item = {}) => ({
  id: item.orderId?._id || item.orderId || item._id,
  customer: item.orderId?.shippingAddress?.name || 'Customer',
  date: formatOrderDate(item.creditedAt || item.createdAt),
  base: item.amount || 0,
  bonus: 0,
  net: item.amount || 0,
  status: item.status === 'credited' ? 'Processed' : 'Pending',
});

const DeliveryEarnings = () => {
  const [period, setPeriod] = useState('This Week');
  const [weeklyData, setWeeklyData] = useState(DAY_LABELS.map((day) => ({ day, earning: 0, orders: 0 })));
  const [history, setHistory] = useState([]);
  const { profile, fetchProfile } = useDeliveryStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getEarnings();
        const items = Array.isArray(data) ? data : (data?.items || []);
        setWeeklyData(buildWeeklyData(items));
        setHistory(items.map(mapHistoryItem));
      } catch {
        // keep empty defaults
      }
    };
    load();
  }, []);

  const totalWeek = weeklyData.reduce((sum, d) => sum + d.earning, 0);
  const totalOrders = weeklyData.reduce((sum, d) => sum + d.orders, 0);
  const maxEarning = Math.max(...weeklyData.map(d => d.earning), 1);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const todayLabel = DAY_LABELS[todayIdx];

  return (
    <div className="pt-5 px-4 pb-8 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">{profile.city || 'Delivery Zone'}</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-600 shadow-sm">
          {period} <ChevronDown size={14} />
        </button>
      </div>

      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-2xl shadow-blue-100">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total This Week</p>
        <p className="text-4xl font-black tracking-tight">₹{totalWeek.toLocaleString()}</p>
        <div className="flex items-center gap-4 mt-4">
          <div><p className="text-[10px] opacity-60 font-bold uppercase">Orders</p><p className="text-xl font-black">{totalOrders}</p></div>
          <div className="w-px h-8 bg-white/20" />
          <div><p className="text-[10px] opacity-60 font-bold uppercase">Avg/Order</p><p className="text-xl font-black">₹{totalOrders > 0 ? Math.round(totalWeek / totalOrders) : 0}</p></div>
          <div className="w-px h-8 bg-white/20" />
          <div><p className="text-[10px] opacity-60 font-bold uppercase">Payout</p><p className="text-xs font-black mt-1 bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Pending</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Daily Breakdown</h3>
        <div className="flex items-end gap-2 h-28">
          {weeklyData.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[9px] font-black text-slate-400">₹{d.earning}</p>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.earning / maxEarning) * 80}px` }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                className={`w-full rounded-t-lg ${d.day === todayLabel ? 'bg-blue-600' : 'bg-blue-100'}`}
              />
              <p className="text-[10px] font-bold text-slate-400">{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Breakdown</h3>
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-8 border border-slate-100 shadow-sm text-center">
              <p className="text-[11px] text-slate-400 font-bold uppercase">No earnings yet</p>
            </div>
          ) : (
            history.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl px-4 py-3.5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.customer}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{item.id} • {item.date}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">Base ₹{item.base}</span>
                      {item.bonus > 0 && (
                        <span className="text-[10px] text-green-500 font-bold">+Bonus ₹{item.bonus}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-green-600">+₹{item.net}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.status === 'Processed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryEarnings;
