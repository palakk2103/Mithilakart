import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, LogOut,
  Bell, Search, Menu, ShieldCheck, Briefcase, Layers, Star,
  Truck, Store, Key, Settings, ChevronDown, ChevronRight,
  UserPlus, DollarSign, BarChart3, HelpCircle, FileText, Image, LayoutGrid, Layout,
  Tag, Zap, MessageSquare, RotateCcw, Inbox,
  Banknote, Percent, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchInput from '../../../shared/components/SearchInput';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/dashboard/activities', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        });
        const body = await res.json();
        const items = body?.data?.activities || body?.data || [];
        if (!cancelled && Array.isArray(items)) {
          setNotifications(items.slice(0, 5).map((item, idx) => ({
            id: item.id || idx,
            title: item.message || item.title || 'Activity',
            time: item.time || item.createdAt || '',
            type: item.type || 'info',
            read: Boolean(item.read),
          })));
        }
      } catch {
        if (!cancelled) setNotifications([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const quickLinks = [
    { name: 'Banner Manager', path: '/admin/storefront/banners' },
    { name: 'Customer Database', path: '/admin/users' },
    { name: 'Inventory Stock', path: '/admin/inventory/all' },
    { name: 'System Settings', path: '/admin/settings' },
  ];

  const filteredLinks = quickLinks.filter(link => 
    link.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSubMenu = (name) => {
    setOpenMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const menuGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
        { name: 'Customers', path: '/admin/users', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'STOREFRONT',
      items: [
        { name: 'Banner Manager', path: '/admin/storefront/banners', icon: <Image size={18} /> },
        { name: 'Category Chips', path: '/admin/storefront/chips', icon: <LayoutGrid size={18} /> },
        { 
          name: 'Home Sections', 
          icon: <Layout size={18} />,
          subItems: [
            { name: 'Trending This Week', path: '/admin/storefront/sections/trending-this-week' },
            { name: "Today's Special Deals", path: '/admin/storefront/sections/todays-special-deals' },
            { name: 'Top Selection', path: '/admin/storefront/sections/top-selection' },
            { name: 'Brands in Spotlight', path: '/admin/storefront/sections/brands-in-spotlight' },
            { name: 'Best Quality Guaranteed', path: '/admin/storefront/sections/best-quality-guaranteed' },
          ]
        },
        { name: 'Category Manager', path: '/admin/categories', icon: <Layers size={18} /> },
      ]
    },
    {
      title: 'BUSINESS OPS',
      items: [
        {
          name: 'Inventory',
          icon: <Package size={18} />,
          subItems: [
            { name: 'Stock Levels', path: '/admin/inventory/all' },
            { name: 'Add Product', path: '/admin/inventory/add' },
            { name: 'Stock Alerts', path: '/admin/inventory/alerts' },
          ]
        },
        { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={18} /> },
        {
          name: 'Returns & Refunds',
          icon: <RotateCcw size={18} />,
          subItems: [
            { name: 'Returns Claims', path: '/admin/operations/returns' },
            { name: 'Refunds Hub', path: '/admin/operations/refunds' },
          ]
        },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Sales Report', path: '/admin/reports/sales', icon: <BarChart3 size={18} /> },
        { name: 'Seller Report', path: '/admin/reports/sellers', icon: <Store size={18} /> },
        { name: 'User Report', path: '/admin/reports/users', icon: <Users size={18} /> },
        { name: 'Order Report', path: '/admin/reports/orders', icon: <ShoppingCart size={18} /> },
        { name: 'Inventory Report', path: '/admin/reports/inventory', icon: <Package size={18} /> },
        { name: 'Refund Report', path: '/admin/reports/refunds', icon: <RotateCcw size={18} /> },
      ]
    },
    {
      title: 'PROMOTIONS',
      items: [
        { name: 'Coupon Manager', path: '/admin/promotions/coupons', icon: <Tag size={18} /> },
        { name: 'Flash Sales', path: '/admin/promotions/flash-sale', icon: <Zap size={18} /> },
        { name: 'Featured Selection', path: '/admin/promotions/featured', icon: <Star size={18} /> },
      ]
    },
    {
      title: 'COMMS',
      items: [
        { name: 'Notification Hub', path: '/admin/comms/notifications', icon: <Bell size={18} /> },
      ]
    },
    {
      title: 'PARTNERS',
      items: [
        {
          name: 'Vendors',
          icon: <Store size={18} />,
          subItems: [
            { name: 'Active Vendors', path: '/admin/vendors/all' },
            { name: 'Onboarding Requests', path: '/admin/vendors/approval' },
          ]
        },
        {
          name: 'Delivery Partners',
          icon: <Truck size={18} />,
          subItems: [
            { name: 'All Partners', path: '/admin/delivery/all' },
            { name: 'Onboarding', path: '/admin/delivery/approval' },
          ]
        },
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { name: 'Review Moderation', path: '/admin/content/reviews', icon: <MessageSquare size={18} /> },
        { name: 'Q&A Moderation', path: '/admin/content/qna', icon: <HelpCircle size={18} /> },
        { name: 'Legal & Policies', path: '/admin/content/legal', icon: <FileText size={18} /> },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { name: 'Help Desk', path: '/admin/support/tickets', icon: <Inbox size={18} /> },
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { name: 'Moderation', path: '/admin/products/moderation', icon: <Layers size={18} /> },
        { name: 'Categories', path: '/admin/categories', icon: <Briefcase size={18} /> },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Earnings', path: '/admin/finance/earnings', icon: <DollarSign size={18} /> },
        { name: 'Payouts', path: '/admin/payouts', icon: <Banknote size={18} /> },
        { name: 'Commission Rules', path: '/admin/finance/rules', icon: <Percent size={18} /> },
        { name: 'Tax & GST Config', path: '/admin/finance/tax', icon: <ShieldCheck size={18} /> },
        { name: 'Delivery Charges', path: '/admin/finance/delivery-charges', icon: <Truck size={18} /> },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Sub-Admins', path: '/admin/system/sub-admins', icon: <ShieldCheck size={18} /> },
        { name: 'Role Management', path: '/admin/system/roles', icon: <Lock size={18} /> },
        { name: 'Audit Logs', path: '/admin/system/audit-logs', icon: <FileText size={18} /> },
        { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
        { name: 'Logout', path: '/admin/auth', icon: <LogOut size={18} /> },
      ]
    }
  ];

  const getPageTitle = () => {
    const currentPath = location.pathname;
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.path === currentPath) return item.name;
        if (item.subItems) {
          const sub = item.subItems.find(s => s.path === currentPath);
          if (sub) return sub.name;
        }
      }
    }
    return 'Admin Console';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-nunito">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-slate-950 border-r border-slate-900 flex flex-col fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        <div className="h-20 flex items-center px-6 gap-3">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <img 
              src="/mthibg.png" 
              alt="Logo" 
              className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>
        </div>

        <nav className="flex-1 py-2 px-3 space-y-6 overflow-y-auto no-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="px-4 text-[9px] font-semibold text-slate-500 uppercase tracking-[2px]">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isMenuOpen = !!openMenus[item.name];
                  const isActive = location.pathname === item.path ||
                    (hasSubItems && item.subItems.some(sub => location.pathname === sub.path));

                  if (hasSubItems) {
                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          onClick={() => toggleSubMenu(item.name)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${isActive
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>{item.icon}</span>
                            <span className="font-bold text-[13px] font-raleway">{item.name}</span>
                          </div>
                          <span className="opacity-40">{isMenuOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
                        </button>

                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="ml-10 space-y-1.5 border-l-2 border-slate-800 pl-5 overflow-hidden"
                            >
                              {item.subItems.map((sub) => (
                                <Link
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={() => setIsSidebarOpen(false)}
                                  className={`block py-2.5 text-[13px] font-bold transition-all ${location.pathname === sub.path
                                      ? 'text-white font-extrabold'
                                      : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive
                          ? 'bg-slate-800 text-white shadow-none'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                        }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="font-bold text-[13px] font-raleway">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-900">
            <div 
              onClick={() => { navigate('/admin/settings'); setIsSidebarOpen(false); }}
              className={`p-4 bg-slate-900 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-all`}
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-950 border border-slate-800">
                 A
              </div>
              <div>
                 <p className="text-[11px] font-bold text-slate-200 uppercase leading-none">System Admin</p>
                 <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Live & Secure
                 </p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 transition-all duration-500 ease-in-out lg:ml-72">
        {/* Topbar */}
        <header className="h-24 bg-white border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 border border-slate-100 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-90 lg:hidden"
            >
              <Menu size={18} className="text-slate-900" />
            </button>

            <div className="hidden lg:block">
              <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight font-montserrat">{getPageTitle()}</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-raleway">
                Admin Management • Verified Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block w-full max-w-[180px] sm:max-w-[260px] md:max-w-[320px] lg:w-96">
              <SearchInput
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                placeholder="Search global records..."
              />

              {/* Search Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Navigation</p>
                    {filteredLinks.length > 0 ? filteredLinks.map(link => (
                      <button
                        key={link.path}
                        onClick={() => {
                          navigate(link.path);
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all text-left"
                      >
                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                          <Layers size={14} />
                        </div>
                        {link.name}
                      </button>
                    )) : (
                      <p className="px-4 py-6 text-sm text-slate-400 font-medium text-center">No matching records found.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
               <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-12 h-12 border rounded-2xl flex items-center justify-center relative transition-all ${showNotifications ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm'}`}
                  >
                     <Bell size={20} />
                     {!showNotifications && <div className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[28px] shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                           <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Notifications</h4>
                           <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">3 New</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                           {notifications.map(n => (
                             <button key={n.id} className="w-full p-5 flex gap-4 hover:bg-slate-50 transition-all text-left border-b border-slate-50 last:border-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                                   {n.type === 'warning' ? <AlertCircle size={18} /> : n.type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                                </div>
                                <div>
                                   <p className={`text-xs font-bold ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</p>
                                   <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{n.time}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                        <button 
                          onClick={() => { navigate('/admin/comms/notifications'); setShowNotifications(false); }}
                          className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all"
                        >
                           View All Notifications
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
               <div 
                 onClick={() => navigate('/admin/settings')}
                 className={`w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all`}
               >
                 A
               </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
