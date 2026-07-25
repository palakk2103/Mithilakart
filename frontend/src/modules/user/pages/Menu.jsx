import React from 'react';
import { 
  ShoppingBag, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Heart, 
  HelpCircle, 
  ChevronRight,
  Wallet,
  Grid,
  Store,
  RefreshCcw,
  Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Menu = () => {
  const menuItems = [
    { title: 'Prime', icon: <ShieldCheck className="text-primary-dark" size={32} />, path: '/profile' },
    { title: 'Orders', icon: <ShoppingBag className="text-orange-500" size={32} />, path: '/profile' },
    { title: 'Buy Again', icon: <RefreshCcw className="text-green-600" size={32} />, path: '/profile' },
    { title: 'Account', icon: <Settings className="text-slate-500" size={32} />, path: '/profile' },
    { title: 'Lists', icon: <Heart className="text-pink-500" size={32} />, path: '/profile' },
    { title: 'Wallet', icon: <Wallet className="text-indigo-600" size={32} />, path: '/wallet' },
    { title: 'Sell', icon: <Store className="text-emerald-600" size={32} />, path: '/home' },
    { title: 'Settings', icon: <Smartphone className="text-slate-700" size={32} />, path: '/profile' },
  ];

  return (
    <div className="bg-[#eaeded] min-h-screen pb-24">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.path}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <div className="p-2 bg-slate-50 rounded-xl">
                 {item.icon}
              </div>
              <span className="font-bold text-slate-800 text-sm">{item.title}</span>
            </Link>
          ))}
        </div>

        {/* Support & Settings List */}
        <div className="mt-8 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 flex items-center justify-between border-b border-slate-50 active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                   <HelpCircle size={20} className="text-slate-400" />
                   <span className="font-medium text-slate-700">Customer Service</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
             </div>
             <div className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-red-500">
                   <LogOut size={20} />
                   <span className="font-bold">Sign Out</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;

