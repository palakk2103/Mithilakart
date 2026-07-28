import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import {
  Globe, Shield, Save, CheckCircle2, ChevronRight, X,
  AlertCircle, Lock, Terminal, User, Truck, CreditCard, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('General');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    platformName: 'Mithilakart',
    supportEmail: 'support@mithilakart.com',
    helpline: '+91 1800 123 4567',
    commission: 10,
    gst: '',
    platformFee: 0,
    packagingFee: 0,
    minOrderAmount: 0,
    maxDeliveryRadiusKm: 25,
    codEnabled: true,
    codHandlingFee: 0,
    expressSurcharge: 0,
    freeShippingThreshold: 500,
    defaultDeliveryCharge: 39,
    razorpayEnabled: true,
    quickCommerceEnabled: true,
    ecommerceEnabled: true,
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
        const s = data.settings || {};
        setFormValues((prev) => ({
          ...prev,
          platformName: s.platformName ?? prev.platformName,
          supportEmail: s.supportEmail ?? prev.supportEmail,
          helpline: s.helpline ?? prev.helpline,
          gst: s.gst ?? prev.gst,
          platformFee: s.platformFee ?? prev.platformFee,
          packagingFee: s.packagingFee ?? prev.packagingFee,
          minOrderAmount: s.minOrderAmount ?? prev.minOrderAmount,
          maxDeliveryRadiusKm: s.maxDeliveryRadiusKm ?? prev.maxDeliveryRadiusKm,
          codEnabled: s.codEnabled ?? prev.codEnabled,
          codHandlingFee: s.codHandlingFee ?? prev.codHandlingFee,
          expressSurcharge: s.expressSurcharge ?? prev.expressSurcharge,
          freeShippingThreshold: s.freeShippingThreshold ?? prev.freeShippingThreshold,
          defaultDeliveryCharge: s.defaultDeliveryCharge ?? prev.defaultDeliveryCharge,
          razorpayEnabled: s.razorpayEnabled ?? prev.razorpayEnabled,
          quickCommerceEnabled: s.quickCommerceEnabled ?? prev.quickCommerceEnabled,
          ecommerceEnabled: s.ecommerceEnabled ?? prev.ecommerceEnabled,
          commission: data.commission?.rate != null ? Math.round(data.commission.rate * 100) : prev.commission,
        }));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const sections = [
    { id: 'General', icon: Globe, label: 'Platform Info' },
    { id: 'Commerce', icon: Truck, label: 'Commerce & Delivery' },
    { id: 'Business', icon: Shield, label: 'Fees & Commission' },
    { id: 'Payments', icon: CreditCard, label: 'Payments' },
    { id: 'Modes', icon: Zap, label: 'Mode Config' },
    { id: 'Security', icon: Lock, label: 'Login & Security' },
  ];

  const updateField = (key, value) => setFormValues((v) => ({ ...v, [key]: value }));

  const handleSave = async () => {
    const { error: settingsError } = await settingsApi.update({
      platformName: formValues.platformName,
      supportEmail: formValues.supportEmail,
      helpline: formValues.helpline,
      gst: formValues.gst,
      platformFee: Number(formValues.platformFee) || 0,
      packagingFee: Number(formValues.packagingFee) || 0,
      minOrderAmount: Number(formValues.minOrderAmount) || 0,
      maxDeliveryRadiusKm: Number(formValues.maxDeliveryRadiusKm) || 25,
      codEnabled: formValues.codEnabled,
      codHandlingFee: Number(formValues.codHandlingFee) || 0,
      expressSurcharge: Number(formValues.expressSurcharge) || 0,
      freeShippingThreshold: Number(formValues.freeShippingThreshold) || 500,
      defaultDeliveryCharge: Number(formValues.defaultDeliveryCharge) || 39,
      razorpayEnabled: formValues.razorpayEnabled,
      quickCommerceEnabled: formValues.quickCommerceEnabled,
      ecommerceEnabled: formValues.ecommerceEnabled,
    });

    const { error: commissionError } = await settingsApi.updateCommission({
      rate: Number(formValues.commission) / 100,
    });

    if (settingsError || commissionError) {
      toast.error(settingsError || commissionError);
      return;
    }

    setSaved(true);
    toast.success('Platform settings saved — checkout pricing updates immediately');
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ checked, onChange, label, hint }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div>
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{label}</p>
        {hint && <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-all ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );

  const NumberField = ({ label, field, suffix = '' }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">{label}</label>
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl py-4 px-6">
        {suffix === '₹' && <span className="text-xs font-black text-slate-400">₹</span>}
        <input
          type="number"
          min="0"
          value={formValues[field]}
          onChange={(e) => updateField(field, e.target.value)}
          className="w-full bg-transparent text-sm font-bold outline-none"
        />
        {suffix && suffix !== '₹' && <span className="text-xs font-black text-slate-400">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Platform Settings</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Single source of truth for fees, modes, and business rules.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white shadow-blue-100 hover:scale-105'}`}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Settings Updated!' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-72 flex-shrink-0 space-y-2">
          {sections.map((section) => (
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
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-8"
            >
              {activeSection === 'General' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Platform Name</label>
                    <input type="text" value={formValues.platformName} onChange={(e) => updateField('platformName', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Support Email</label>
                    <input type="email" value={formValues.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Helpline Number</label>
                    <input type="text" value={formValues.helpline} onChange={(e) => updateField('helpline', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">GST Registration</label>
                    <input type="text" value={formValues.gst} onChange={(e) => updateField('gst', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                  </div>
                </div>
              )}

              {activeSection === 'Commerce' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NumberField label="Minimum Order Value" field="minOrderAmount" suffix="₹" />
                  <NumberField label="Max Quick-Commerce Delivery Radius" field="maxDeliveryRadiusKm" suffix="km" />
                  <NumberField label="Free Shipping Above" field="freeShippingThreshold" suffix="₹" />
                  <NumberField label="Default Delivery Charge" field="defaultDeliveryCharge" suffix="₹" />
                  <NumberField label="COD Handling Fee" field="codHandlingFee" suffix="₹" />
                  <NumberField label="Express Delivery Surcharge" field="expressSurcharge" suffix="₹" />
                  <div className="md:col-span-2">
                    <Toggle
                      label="Cash on Delivery (COD)"
                      hint="Disable to hide COD at checkout"
                      checked={formValues.codEnabled}
                      onChange={(v) => updateField('codEnabled', v)}
                    />
                  </div>
                </div>
              )}

              {activeSection === 'Business' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <NumberField label="Platform Commission (%)" field="commission" suffix="%" />
                    <NumberField label="Platform Fee (per order)" field="platformFee" suffix="₹" />
                    <NumberField label="Packaging Fee (per order)" field="packagingFee" suffix="₹" />
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                    <AlertCircle size={20} className="text-amber-500 mt-1" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Commission, platform fee, and packaging fee are snapshotted at order placement. Category-specific commission rules can be managed under Finance → Commission Policy.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'Payments' && (
                <div className="space-y-6">
                  <Toggle
                    label="Razorpay Online Payments"
                    hint="Toggle online payment availability (keys configured in backend .env)"
                    checked={formValues.razorpayEnabled}
                    onChange={(v) => updateField('razorpayEnabled', v)}
                  />
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <AlertCircle size={20} className="text-amber-600 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Razorpay API Keys</p>
                      <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                        Production Razorpay Key ID and Secret must be set in <code className="bg-white px-1 rounded">backend/.env</code> (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET). This toggle controls whether users see the online payment option.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'Modes' && (
                <div className="space-y-4">
                  <Toggle
                    label="Quick Commerce"
                    hint="15–45 min delivery, nearby sellers & delivery partners"
                    checked={formValues.quickCommerceEnabled}
                    onChange={(v) => updateField('quickCommerceEnabled', v)}
                  />
                  <Toggle
                    label="E-commerce (Pan-India)"
                    hint="Standard shipping flow for all-India products"
                    checked={formValues.ecommerceEnabled}
                    onChange={(v) => updateField('ecommerceEnabled', v)}
                  />
                </div>
              )}

              {activeSection === 'Security' && (
                <div className="py-12 text-center text-slate-400">
                  <Lock size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-bold">Use Admin → Auth to change your password</p>
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
