import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import { 
  Settings as SettingsIcon, Globe, Shield, Bell, 
  Mail, Phone, CreditCard, Truck, Layout,
  Save, CheckCircle2, ChevronRight, X,
  AlertCircle, Smartphone, Lock, Terminal, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('Account');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({ settings: {}, commission: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    platformName: 'Cocio',
    supportEmail: 'support@cocia.com',
    helpline: '+91 1800 123 4567',
    commission: 10,
    gst: '07AAAAA0000A1Z5',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await settingsApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
      } else if (data) {
        setError(null);
        setSettings(data);
        setFormValues((prev) => ({
          ...prev,
          platformName: data.settings?.platformName || prev.platformName,
          supportEmail: data.settings?.supportEmail || prev.supportEmail,
          helpline: data.settings?.helpline || prev.helpline,
          commission: data.commission?.rate != null ? Math.round(data.commission.rate * 100) : prev.commission,
          gst: data.settings?.gst || prev.gst,
        }));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const sections = [
    { id: 'Account', icon: User, label: 'My Profile' },
    { id: 'General', icon: Globe, label: 'Platform Info' },
    { id: 'Business', icon: Shield, label: 'Business & Tax' },
    { id: 'Communication', icon: Bell, label: 'Notifications' },
    { id: 'Security', icon: Lock, label: 'Login & Security' },
  ];

  const handleSave = async () => {
    const { error: apiError } = await settingsApi.update({
      platformName: formValues.platformName,
      supportEmail: formValues.supportEmail,
      helpline: formValues.helpline,
      gst: formValues.gst,
    });
    if (!apiError) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Platform Settings</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Global configuration hub for platform behavior, compliance, and policies.</p>
        </div>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all shadow-lg ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white shadow-blue-100 hover:scale-105'}`}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Settings Updated!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-72 flex-shrink-0 space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-widest transition-all ${
                activeSection === section.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'bg-white text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-100'
              }`}
            >
              <section.icon size={18} />
              {section.label}
              {activeSection === section.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
          
          <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
             <Terminal size={60} className="absolute -right-4 -bottom-4 opacity-10" />
             <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">System Health</p>
             <h4 className="text-lg font-semibold mt-1 font-montserrat">v2.4.0-Stable</h4>
             <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">All Systems Go</span>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-8"
            >
               <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                     {React.createElement(sections.find(s => s.id === activeSection).icon, { size: 24 })}
                  </div>
                  <div>
                     <h2 className="text-xl font-semibold text-slate-900 font-montserrat uppercase tracking-tight">{activeSection} Configuration</h2>
                     <p className="text-xs text-slate-400 font-medium mt-0.5">Manage your platform's {activeSection.toLowerCase()} settings.</p>
                  </div>
               </div>

               {activeSection === 'Account' && (
                 <div className="space-y-10">
                    <div className="flex items-center gap-8">
                       <div className="relative group">
                          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-semibold shadow-xl shadow-blue-100 group-hover:scale-105 transition-all cursor-pointer">
                             A
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center text-blue-500 hover:text-blue-600 cursor-pointer">
                             <SettingsIcon size={14} />
                          </div>
                       </div>
                       <div>
                          <h3 className="text-xl font-semibold text-slate-900 font-montserrat uppercase tracking-tight">Main Administrator</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Super Admin • Full Platform Access</p>
                          <div className="flex gap-2 mt-4">
                             <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-semibold uppercase tracking-widest rounded-lg border border-green-100">Verified</span>
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-semibold uppercase tracking-widest rounded-lg border border-blue-100">Primary Account</span>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Full Name</label>
                          <input type="text" defaultValue="Prachi Admin" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Login Email</label>
                          <input type="email" defaultValue="admin@appzeto.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Phone Number</label>
                          <input type="text" defaultValue="+91 98765 43210" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Associated Role</label>
                          <input type="text" value="Super Administrator" disabled className="w-full bg-slate-100 border border-slate-100 rounded-xl py-4 px-6 text-sm font-semibold text-slate-500 outline-none cursor-not-allowed" />
                       </div>
                    </div>
                 </div>
               )}

               {activeSection === 'General' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Platform Name</label>
                       <input type="text" defaultValue={formValues.platformName} onChange={(e) => setFormValues(v => ({ ...v, platformName: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Support Email</label>
                       <input type="email" defaultValue="support@cocia.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Helpline Number</label>
                       <input type="text" defaultValue="+91 1800 123 4567" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Default Currency</label>
                       <select className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none">
                          <option>INR (₹)</option>
                          <option>USD ($)</option>
                       </select>
                    </div>
                 </div>
               )}

               {activeSection === 'Business' && (
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Platform Commission (%)</label>
                          <input type="number" defaultValue="10" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Tax Registration (GST)</label>
                          <input type="text" defaultValue="07AAAAA0000A1Z5" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                       <AlertCircle size={20} className="text-amber-500 mt-1" />
                       <div>
                          <p className="text-[10px] font-semibold text-slate-900 uppercase tracking-widest">Commission Logic</p>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                            Changes here apply globally unless a category-specific rule is defined in the Finance section.
                          </p>
                       </div>
                    </div>
                 </div>
               )}

               {activeSection === 'Security' && (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                       </div>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                       <Shield size={20} className="text-amber-500 mt-1" />
                       <div>
                          <p className="text-[10px] font-semibold text-amber-900 uppercase tracking-widest">Security Recommendation</p>
                          <p className="text-xs text-amber-600/80 font-medium mt-1 leading-relaxed">
                            We recommend changing your password every 90 days to maintain maximum platform security.
                          </p>
                       </div>
                    </div>
                 </div>
               )}

               {activeSection !== 'General' && activeSection !== 'Business' && activeSection !== 'Account' && activeSection !== 'Security' && (
                 <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                       <Terminal size={40} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-400 uppercase tracking-widest font-montserrat">{activeSection} Module Coming Soon</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-xs">Our engineers are working hard to bring this configuration module to life.</p>
                 </div>
               )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
