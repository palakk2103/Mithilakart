import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  User, Settings, HelpCircle, Info, LogOut, 
  ChevronRight, Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { clearTokens } from '../../../shared/api/tokenStorage';
import { logoutDelivery, setOnlineStatus } from '../services/deliveryApi';
import useDeliveryStore from '../../../store/useDeliveryStore';

const DeliveryProfile = () => {
  const navigate = useNavigate();
  const context = useOutletContext();
  const [localOnline, setLocalOnline] = useState(true);
  const { profile, fetchProfile } = useDeliveryStore();
  
  const isOnline = context ? context.isOnline : localOnline;
  const setIsOnline = context ? context.setIsOnline : setLocalOnline;

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggleOnline = async () => {
    const next = !isOnline;
    try {
      await setOnlineStatus(next);
      setIsOnline(next);
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutDelivery();
    } catch {
      // proceed with local logout
    }
    clearTokens('delivery');
    navigate('/delivery/auth');
  };

  const menuItems = [
    { icon: User, label: 'Profile', path: '/delivery/profile/edit' },
    { icon: Wallet, label: 'Wallet & Payouts', path: '/delivery/earnings' },
    { icon: Settings, label: 'Settings', path: '/delivery/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/delivery/support' },
    { icon: Info, label: 'About', path: '/delivery/about' },
  ];

  const displayName = profile.fullName || 'Partner';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans">
      <div className="px-4 pt-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3E5A44] rounded-full flex items-center justify-center shadow-md shadow-blue-50">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Hello</p>
              <h2 className="text-lg font-black text-slate-900 leading-none mt-0.5">{displayName}</h2>
            </div>
          </div>
          
          <button 
            onClick={handleToggleOnline}
            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isOnline ? 'bg-[#388e3c]' : 'bg-slate-200'}`}
          >
            <motion.div 
              animate={{ x: isOnline ? 26 : 3 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      <div className="px-5 mb-3">
        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Menu</h3>
      </div>

      <div className="px-4 space-y-2">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(item.path)}
            className="w-full bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all group"
          >
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <item.icon size={16} className="text-[#3E5A44]" />
            </div>
            <span className="text-[14px] font-bold text-slate-700">{item.label}</span>
            <ChevronRight size={16} className="text-slate-300 ml-auto" />
          </button>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50/50 rounded-xl p-3.5 border border-red-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all group mt-4"
        >
          <div className="w-8 h-8 bg-red-100/50 rounded-lg flex items-center justify-center">
            <LogOut size={16} className="text-red-500" />
          </div>
          <span className="text-[14px] font-bold text-red-500">Logout</span>
          <ChevronRight size={16} className="text-red-300 ml-auto" />
        </button>
      </div>
    </div>
  );
};

export default DeliveryProfile;
