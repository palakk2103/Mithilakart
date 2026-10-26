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
    <header className="sticky top-0 z-30 h-14 bg-[var(--seller-topbar-bg,#fff)] border-b border-[var(--seller-border-light,#F3F4F6)] px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3 select-none">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={18} className="text-slate-600" />
        </button>

        {/* Page Title + Breadcrumb */}
        <div className="min-w-0">
          <h2 className="text-[13.5px] sm:text-[14.5px] font-bold text-[var(--seller-text,#111827)] truncate">{getPageTitle()}</h2>
          {getBreadcrumb() && (
            <div className="hidden sm:flex items-center gap-1 text-[10.5px] text-[var(--seller-subtext,#6B7280)]">
              <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/seller/dashboard')}>Home</span>
              {getBreadcrumb().map((part, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={9} className="text-slate-400" />
                  <span className={i === getBreadcrumb().length - 1 ? 'text-[var(--seller-text,#111827)] font-medium truncate' : 'truncate'}>{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length > 0); }}
            onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            placeholder="Quick search..."
            className="w-40 lg:w-56 pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200/80
                       rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white
                       outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X size={12} className="text-slate-400" />
            </button>
          )}

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
              >
                {filteredLinks.length > 0 ? filteredLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => { navigate(link.path); setSearchQuery(''); setShowSearch(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <Search size={12} className="text-slate-400" />
                    <span className="truncate">{link.name}</span>
                  </button>
                )) : (
                  <p className="px-3 py-4 text-xs text-slate-400 text-center">No results found</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} className="text-slate-500" /> : <Sun size={16} className="text-amber-400" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              showNotifications ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-500'
            }`}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute 1 top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {unreadCount} new
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${n.read ? 'bg-slate-300' : 'bg-blue-500'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs ${n.read ? 'text-slate-600' : 'text-slate-900 font-semibold'} truncate`}>{n.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{n.message}</p>
                          <span className="text-[9.5px] text-slate-400 mt-0.5 block">{getRelativeTime(new Date(n.createdAt))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { navigate('/seller/notifications'); setShowNotifications(false); }}
                  className="w-full py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 cursor-pointer"
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
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-2xs">
              <span className="text-[11px] font-bold">
                {seller?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <span className="hidden lg:block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
              {seller?.name?.split(' ')[0] || 'Seller'}
            </span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{seller?.name || 'Seller'}</p>
                  <p className="text-[10.5px] text-slate-400 truncate">{seller?.email || 'seller@example.com'}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate('/seller/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <User size={14} className="text-slate-400" /> Profile
                  </button>
                  <button
                    onClick={() => { navigate('/seller/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Settings size={14} className="text-slate-400" /> Settings
                  </button>
                  <button
                    onClick={async () => { await logout(); navigate('/seller/login'); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={14} /> Logout
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
