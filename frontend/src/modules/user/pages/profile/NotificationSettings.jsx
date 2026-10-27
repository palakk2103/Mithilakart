import React, { useState } from 'react';
import { ArrowLeft, Bell, Smartphone, Mail, Zap, ChevronRight, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateNotificationPreferences } from '../../services/userApi';
import { registerPushToken, sendTestPush, detectPlatform } from '../../../../shared/services/pushNotifications';

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
  const [testingPush, setTestingPush] = useState(false);
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [testResult, setTestResult] = useState(null);

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

  const handleRegisterDevice = async (overridePlatform = null) => {
    setRegisteringDevice(true);
    try {
      const platformToUse = overridePlatform || detectPlatform();
      const res = await registerPushToken('customer', platformToUse);
      toast.success(`Device token registered with platform: ${platformToUse}`);
      setTestResult({ success: true, message: `Device registered on platform "${platformToUse}"` });
    } catch (err) {
      toast.error('Failed to register device: ' + (err.message || 'Unknown error'));
      setTestResult({ success: false, message: err.message });
    } finally {
      setRegisteringDevice(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await sendTestPush('customer', {
        title: 'Mithilakart Push Test',
        body: 'Push notification is active and working properly!',
      });
      const data = res.data?.data || res.data || {};
      toast.success('Test push dispatched via ' + (data.provider || 'FCM') + '!');
      setTestResult({ success: true, ...data });
    } catch (err) {
      toast.error('Test push error: ' + (err.response?.data?.error?.message || err.message));
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingPush(false);
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

        {/* Live Push Notification & FCM Diagnostics Card */}
        <div className="space-y-4">
           <h2 className={`text-[10px] font-black ${primaryText} uppercase tracking-[3px] ml-1`}>FCM Push Notification Test</h2>
           <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Device & Push Status</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Test FCM token generation and register platform app/web to database.</p>
                 </div>
                 <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-wider">
                    FCM Live
                 </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                 <button
                    onClick={() => handleRegisterDevice('app')}
                    disabled={registeringDevice}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all disabled:opacity-50"
                 >
                    <Smartphone size={16} />
                    {registeringDevice ? 'Registering...' : 'Register as Platform "app"'}
                 </button>

                 <button
                    onClick={handleSendTestPush}
                    disabled={testingPush}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl ${primaryBg} text-white hover:opacity-90 text-xs font-bold transition-all disabled:opacity-50 shadow-sm`}
                 >
                    <Send size={16} />
                    {testingPush ? 'Sending Test Push...' : 'Send Live Test Notification'}
                 </button>
              </div>

              {testResult && (
                 <div className={`mt-3 p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                    {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" /> : <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />}
                    <div>
                       <p className="font-bold">{testResult.success ? 'Push Notification System Active' : 'Push Notification Notice'}</p>
                       <p className="text-[11px] mt-0.5 opacity-90">{testResult.message || `Provider: ${testResult.provider || 'FCM'} | Devices Found: ${testResult.devicesFound ?? 1}`}</p>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationSettings;

