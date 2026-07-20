/**
 * Notifications Page
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ShoppingCart, RotateCcw, Star, Package, DollarSign, CheckCheck, Check } from 'lucide-react';
import { PageHeader } from '../../components/common';
import { Button, Badge } from '../../components/ui';
import { getNotifications, markAsRead, markAllRead } from '../../services/sellerApi';
import { getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const typeConfig = {
  order: { icon: ShoppingCart, bg: 'bg-blue-50', color: 'text-blue-600' },
  return: { icon: RotateCcw, bg: 'bg-orange-50', color: 'text-orange-600' },
  review: { icon: Star, bg: 'bg-amber-50', color: 'text-amber-600' },
  inventory: { icon: Package, bg: 'bg-red-50', color: 'text-red-600' },
  payment: { icon: DollarSign, bg: 'bg-green-50', color: 'text-green-600' },
};

const tabs = ['all', 'order', 'return', 'review', 'inventory', 'payment'];

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications();
      setNotifications(data?.notifications || []);
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error(err?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err?.message || 'Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread notifications`}>
        {unreadCount > 0 && (
          <Button variant="secondary" icon={CheckCheck} size="sm" onClick={handleMarkAllRead}>Mark All Read</Button>
        )}
      </PageHeader>

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {tab}
            {tab === 'all' && unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.map((notif, i) => {
          const config = typeConfig[notif.type] || typeConfig.order;
          const Icon = config.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                notif.read ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/50'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${config.bg} flex-shrink-0`}>
                <Icon size={18} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{notif.title}</p>
                  {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-gray-400 mt-1.5">{getRelativeTime(new Date(notif.createdAt))}</p>
              </div>
              {!notif.read && (
                <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                  className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 flex-shrink-0" title="Mark as read">
                  <Check size={14} />
                </button>
              )}
            </motion.div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <Bell size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
