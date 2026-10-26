/**
 * Sidebar Component
 * Professional sidebar navigation for seller dashboard.
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, PlusCircle, Warehouse, ShoppingCart,
  RotateCcw, Users, Star, Ticket, Bell, BarChart3, Wallet,
  Settings, LogOut, ChevronLeft, ChevronRight, Store,
} from 'lucide-react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { SIDEBAR_MENU } from '../../constants';

const iconComponents = {
  LayoutDashboard, Package, PlusCircle, Warehouse, ShoppingCart,
  RotateCcw, Users, Star, Ticket, Bell, BarChart3, Wallet,
  Settings, LogOut, Store,
};

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seller, logout } = useSellerAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/seller/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col
        bg-[var(--seller-sidebar-bg,#030712)] border-r border-slate-800/80
        transition-all duration-300 ease-in-out select-none
        ${collapsed ? 'w-[68px]' : 'w-[236px]'}
      `}
    >
      {/* Header / Logo Area */}
      <div className={`h-14 flex items-center border-b border-slate-800/80 ${collapsed ? 'justify-center px-1.5' : 'px-4 justify-between'}`}>
        {collapsed ? (
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-xs">
            <Store size={16} className="text-white" />
          </div>
        ) : (
          <Link to="/seller/dashboard" className="flex items-center gap-2.5 group overflow-hidden">
            <img 
              src="/logomith-removebg-preview.png" 
              alt="Mithilakart" 
              className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
              Seller
            </span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2.5 px-2 overflow-y-auto seller-no-scrollbar">
        {SIDEBAR_MENU.map((group, gIdx) => (
          <div key={gIdx} className={gIdx > 0 ? 'mt-3.5' : ''}>
            {/* Group Label */}
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {group.group}
              </p>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const IconComponent = iconComponents[item.icon];
                const active = isActive(item.path);

                // Logout special case
                if (item.path === '#logout') {
                  return (
                    <button
                      key={item.name}
                      onClick={handleLogout}
                      className={`
                        w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                        transition-all duration-150 group
                        text-red-400 hover:bg-red-950/40 hover:text-red-300 cursor-pointer
                        ${collapsed ? 'justify-center' : ''}
                      `}
                      title={collapsed ? item.name : undefined}
                    >
                      {IconComponent && <IconComponent size={17} className="flex-shrink-0" />}
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-150 group relative
                      ${collapsed ? 'justify-center' : ''}
                      ${active
                        ? 'bg-[#1E293B] text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100'
                      }
                    `}
                    title={collapsed ? item.name : undefined}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={17}
                        className={`flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                      />
                    )}
                    {!collapsed && <span className="truncate">{item.name}</span>}

                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md
                                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-slate-700">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer — Seller Info */}
      <div className={`border-t border-slate-800/80 p-2.5 ${collapsed ? 'px-1.5' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 mx-auto bg-slate-800 rounded-lg flex items-center justify-center cursor-pointer" title={seller?.storeName || 'Seller Store'}>
            <span className="text-xs font-bold text-white">
              {seller?.name?.charAt(0) || 'S'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2 bg-slate-900/80 rounded-lg border border-slate-800/60">
            <div className="w-7 h-7 bg-slate-800 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {seller?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold text-slate-200 truncate">
                {seller?.storeName || 'Seller Store'}
              </p>
              <p className="text-[9.5px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full seller-pulse-dot" />
                Active Seller
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute top-14 -right-2.5 w-5 h-5 bg-slate-900 border border-slate-700 rounded-full
                   flex items-center justify-center shadow-md transition-all
                   hover:bg-slate-800 hover:border-slate-600 hover:scale-110 z-50 cursor-pointer"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} className="text-slate-300" /> : <ChevronLeft size={12} className="text-slate-300" />}
      </button>
    </aside>
  );
};

export default Sidebar;
