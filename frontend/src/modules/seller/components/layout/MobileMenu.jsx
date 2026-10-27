/**
 * MobileMenu Component
 * Slide-out drawer sidebar for mobile devices.
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, LayoutDashboard, Package, PlusCircle, Warehouse,
  ShoppingCart, RotateCcw, Users, Star, Ticket, Bell,
  BarChart3, Wallet, Settings, LogOut, Upload } from 'lucide-react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { SIDEBAR_MENU } from '../../constants';

const iconComponents = {
  LayoutDashboard, Package, PlusCircle, Warehouse, ShoppingCart,
  RotateCcw, Users, Star, Ticket, Bell, BarChart3, Wallet,
  Settings, LogOut, Store, Upload,
};

const MobileMenu = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seller, logout } = useSellerAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/seller/login');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-slate-950 z-50 flex flex-col shadow-2xl lg:hidden border-r border-slate-900 text-slate-200"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <img 
                  src="/logomith-removebg-preview.png" 
                  alt="Mithilakart" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-900 transition-colors" aria-label="Close menu">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              {SIDEBAR_MENU.map((group, gIdx) => (
                <div key={gIdx} className={gIdx > 0 ? 'mt-5' : ''}>
                  <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    {group.group}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const IconComponent = iconComponents[item.icon];
                      const active = location.pathname === item.path;

                      if (item.path === '#logout') {
                        return (
                          <button
                            key={item.name}
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-500"
                          >
                            {IconComponent && <IconComponent size={20} />}
                            <span>{item.name}</span>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                            ${active
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                            }
                          `}
                        >
                          {IconComponent && <IconComponent size={20} className={active ? 'text-white' : 'text-slate-500'} />}
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-900 p-4">
              <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl">
                <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{seller?.name?.charAt(0) || 'S'}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{seller?.storeName || 'Seller Store'}</p>
                  <p className="text-[10px] text-slate-400">{seller?.email || 'seller@example.com'}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
