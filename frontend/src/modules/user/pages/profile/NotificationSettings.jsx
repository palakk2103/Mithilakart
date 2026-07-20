import React, { useState } from 'react';
import { ArrowLeft, Bell, Smartphone, Mail, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { updateNotificationPreferences } from '../../services/userApi';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    offers: true,
    updates: true,
    orders: true,
    security: true,
    newsletter: false
  });
  const [saving, setSaving] = useState(false);

  const toggleSetting = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(true);
    try {
      await updateNotificationPreferences(next);
    } catch {
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  const primaryText = isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#D9A21B]' : (isQuickShopFlow ? 'text-[#F26522]' : 'text-[#6FAE4A]');
  const primaryBg = isMithilakFlow ? 'bg-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]' : (isQuickShopFlow ? 'bg-[#F26522]' : 'bg-[#6FAE4A]');
  const primaryLightBg = isMithilakFlow ? 'bg-[#207C8A]/10 text-[#207C8A]' : isFreshGroceryFlow ? 'bg-[#D9A21B]/10 text-[#D9A21B]' : (isQuickShopFlow ? 'bg-[#F26522]/10 text-[#F26522]' : 'bg-emerald-50 text-[#6FAE4A]');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${pageBg} min-h-screen text-slate-800 font-sans relative transition-colors duration-300`}
    >
      {/* Global Repeating Mithila Art Page Background Texture */}
      {!(isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.018] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-50 p-4 flex items-center gap-4 relative z-10 transition-colors duration-300 border-b ${headerBg}`}>
        <button onClick={() => navigate(-1)} className={`p-1 rounded-full hover:bg-slate-50 transition-colors ${headerTextColor}`} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className={`text-[17px] font-black uppercase tracking-widest ${headerTextColor}`}>Notifications</h1>
      </div>

      <div className="container mx-auto px-4 py-8 w-full space-y-8 relative z-10">
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex items-center gap-4 mb-8">
           <div className={`p-3 ${primaryLightBg} rounded-2xl`}>
              <Bell size={24} className="animate-bounce" />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Stay Updated</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal uppercase">Control how you receive alerts and exclusive offers from Mithilakart.</p>
           </div>
        </div>

        <div className="space-y-4">
          <h2 className={`text-[10px] font-black ${primaryText} uppercase tracking-[3px] ml-1`}>Push Notifications</h2>
          
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden divide-y divide-slate-100">
             {[
               { id: 'offers', title: 'Promotions & Offers', icon: Zap, iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
               { id: 'orders', title: 'Order Updates', icon: Smartphone, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
               { id: 'updates', title: 'System Updates', icon: Bell, iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
               { id: 'security', title: 'Account Security', icon: Bell, iconColor: 'text-red-600', bgColor: 'bg-red-50' }
             ].map((item) => (
               <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`p-2.5 rounded-xl ${item.iconColor} ${item.bgColor}`}>
                        <item.icon size={18} />
                     </div>
                     <span className="text-xs font-black tracking-tight text-slate-800">{item.title}</span>
                  </div>
                  <button 
                    onClick={() => toggleSetting(item.id)}
                    className={`w-12 h-6.5 rounded-full transition-all relative ${settings[item.id] ? primaryBg : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full transition-all shadow-sm ${settings[item.id] ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>
             ))}
          </div>
        </div>

        <div className="space-y-4">
           <h2 className={`text-[10px] font-black ${primaryText} uppercase tracking-[3px] ml-1`}>Email Preferences</h2>
           <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 rounded-xl text-green-600 bg-green-50">
                    <Mail size={18} />
                 </div>
                 <span className="text-xs font-black tracking-tight text-slate-800">Weekly Newsletter</span>
              </div>
              <button 
                onClick={() => toggleSetting('newsletter')}
                className={`w-12 h-6.5 rounded-full transition-all relative ${settings.newsletter ? primaryBg : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full transition-all shadow-sm ${settings.newsletter ? 'right-1' : 'left-1'}`}></div>
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationSettings;

