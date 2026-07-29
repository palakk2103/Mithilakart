/**
 * Topbar Component
 * Top navigation bar with search, notifications, profile, and theme toggle.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Search, Bell, Sun, Moon, ChevronRight,
  User, Settings, LogOut, X,
} from 'lucide-react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNotifications } from '../../services/sellerApi';
import { getRelativeTime } from '../../utils/formatters';
import { SIDEBAR_MENU } from '../../constants';
import useSellerOrderStream from '../../hooks/useSellerOrderStream';

const Topbar = ({ onMenuClick }) => {
  const { seller, logout } = useSellerAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data?.notifications || []);
        setUnreadCount(data?.unreadCount ?? (data?.notifications || []).filter((n) => !n.read).length);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifications();
  }, []);

  useSellerOrderStream(() => {
    getNotifications()
      .then((data) => {
        setNotifications(data?.notifications || []);
        setUnreadCount(data?.unreadCount ?? 0);
      })
      .catch(() => {});
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname.replace('/seller/', '').replace('/seller', '');
    if (!path || path === 'dashboard') return null;
    const parts = path.split('/').filter(Boolean);
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
  };

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    for (const group of SIDEBAR_MENU) {
      for (const item of group.items) {
        if (item.path === path) return item.name;
      }
    }
    return 'Dashboard';
  };

  // Search navigation links
  const allLinks = SIDEBAR_MENU.flatMap((g) => g.items).filter((i) => i.path !== '#logout');
  const filteredLinks = searchQuery
    ? allLinks.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--seller-topbar-bg,#fff)] border-b border-[var(--seller-border-light,#F3F4F6)] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        {/* Page Title + Breadcrumb */}
        <div className="hidden sm:block">
          <h2 className="text-base font-semibold text-[var(--seller-text,#111827)]">{getPageTitle()}</h2>
          {getBreadcrumb() && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--seller-subtext,#6B7280)]">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/seller/dashboard')}>Home</span>
              {getBreadcrumb().map((part, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={10} />
                  <span className={i === getBreadcrumb().length - 1 ? 'text-[var(--seller-text,#111827)] font-medium' : ''}>{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length > 0); }}
            onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            placeholder="Quick navigate..."
            className="w-52 lg:w-72 pl-9 pr-8 py-2 text-sm bg-[var(--seller-sidebar-hover,#F3F4F6)] border border-transparent
                       rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-200 focus:bg-white
                       outline-none transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X size={14} className="text-gray-400" />
            </button>
          )}

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
              >
                {filteredLinks.length > 0 ? filteredLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => { navigate(link.path); setSearchQuery(''); setShowSearch(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
                  >
                    <Search size={14} className="text-gray-400" />
                    {link.name}
                  </button>
                )) : (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No results found</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} className="text-gray-500" /> : <Sun size={18} className="text-amber-400" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative p-2.5 rounded-xl transition-colors ${
              showNotifications ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.read ? 'bg-gray-200' : 'bg-blue-500'}`} />
                        <div>
                          <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">{getRelativeTime(new Date(n.createdAt))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { navigate('/seller/notifications'); setShowNotifications(false); }}
                  className="w-full py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                >
                  View All Notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">
                {seller?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <span className="hidden lg:block text-sm font-medium text-[var(--seller-text,#111827)]">
              {seller?.name?.split(' ')[0] || 'Seller'}
            </span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{seller?.name || 'Seller'}</p>
                  <p className="text-xs text-gray-400">{seller?.email || 'seller@example.com'}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { navigate('/seller/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User size={16} /> Profile
                  </button>
                  <button
                    onClick={() => { navigate('/seller/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button
                    onClick={async () => { await logout(); navigate('/seller/login'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
