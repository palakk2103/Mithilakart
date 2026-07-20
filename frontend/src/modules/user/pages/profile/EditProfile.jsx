import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, User, Mail, Phone, MapPin, Calendar, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfile, updateProfile as updateProfileApi } from '../../services/userApi';
import { getUser, setUser } from '../../../../shared/api/tokenStorage';
import toast from 'react-hot-toast';

const mapProfileToForm = (profile) => ({
  name: profile?.name || '',
  email: profile?.email || '',
  phone: profile?.phone || '',
  gender: profile?.gender
    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).toLowerCase()
    : 'Male',
  dob: profile?.dob ? String(profile.dob).split('T')[0] : '',
  avatar: profile?.avatar || profile?.avatarUrl || profile?.profileImage || null,
});

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => {
    const stored = getUser('customer');
    return stored ? mapProfileToForm(stored) : {
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '',
      avatar: null,
    };
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;
        const mapped = mapProfileToForm(profile);
        setFormData(mapped);
      } catch (err) {
        if (!cancelled) {
          const stored = getUser('customer');
          if (stored) setFormData(mapProfileToForm(stored));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const validate = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (formData.phone.length < 10) newErrors.phone = 'Invalid phone number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }

    try {
      const updated = await updateProfileApi({
        name: formData.name.trim(),
        email: formData.email.trim(),
        gender: formData.gender.toLowerCase(),
        dob: formData.dob || null,
      });

      const stored = getUser('customer') || {};
      setUser('customer', {
        ...stored,
        ...updated,
        phone: formData.phone,
        avatar: formData.avatar || updated.avatarUrl || stored.avatar,
      });

      toast.success('Profile Updated Successfully');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
        toast.success('Photo updated locally');
      };
      reader.readAsDataURL(file);
    }
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  const primaryBg = isMithilakFlow 
    ? 'bg-[#207C8A] hover:bg-[#1a6874]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c08f16]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d64f19]' 
        : 'bg-[#6FAE4A] hover:bg-[#5b953d]';

  const primaryText = isMithilakFlow 
    ? 'text-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'text-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'text-[#F26522]' 
        : 'text-[#6FAE4A]';

  const primaryFocusBorder = isMithilakFlow 
    ? 'focus:border-[#207C8A]/50' 
    : isFreshGroceryFlow 
      ? 'focus:border-[#D9A21B]/50' 
      : isQuickShopFlow 
        ? 'focus:border-[#F26522]/50' 
        : 'focus:border-[#6FAE4A]/50';

  const avatarBg = isMithilakFlow 
    ? 'bg-[#207C8A]/10 text-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B]/10 text-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522]/10 text-[#F26522]' 
        : 'bg-emerald-50 text-[#6FAE4A]';

  const primaryShadow = isMithilakFlow
    ? 'shadow-teal-100'
    : isFreshGroceryFlow
      ? 'shadow-yellow-100'
      : isQuickShopFlow
        ? 'shadow-orange-100'
        : 'shadow-emerald-100';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
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

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header */}
      <div className={`sticky top-0 z-50 p-4 flex items-center justify-between relative z-10 transition-colors duration-300 ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={`p-1 rounded-full hover:bg-slate-50 transition-colors ${headerTextColor}`} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <h1 className={`text-[17px] font-black uppercase tracking-widest ${headerTextColor}`}>Edit Profile</h1>
        </div>
        <button onClick={handleSave} className={`${primaryBg} text-white font-black text-xs uppercase tracking-widest px-5 py-2 rounded-xl shadow-sm active:scale-95 transition-all`}>
          Save
        </button>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 w-full space-y-4 md:space-y-8 relative z-10">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`w-20 h-20 md:w-32 md:h-32 ${avatarBg} rounded-full flex items-center justify-center font-black text-3xl md:text-5xl shadow-md border-2 md:border-4 border-white overflow-hidden cursor-pointer active:scale-95 transition-transform`}
            >
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                formData.name ? formData.name.charAt(0).toUpperCase() : 'H'
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              className={`absolute bottom-0 right-0 ${primaryBg} border-2 border-white p-1.5 md:p-2.5 rounded-full text-white shadow-md transition-all active:scale-90`}
            >
              <Camera size={14} className="md:w-[18px] md:h-[18px]" />
            </button>
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            className={`mt-2 md:mt-4 text-[9px] md:text-[10px] font-black ${primaryText} uppercase tracking-[2px] md:tracking-[3px] hover:opacity-70 transition-opacity`}
          >
            Change Photo
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5 md:space-y-6">
          {/* Full Name */}
          <div className="space-y-1 md:space-y-2">
            <label className={`text-[9px] md:text-[10px] font-black ${primaryText} uppercase tracking-[2px] md:tracking-[3px] ml-1`}>Full Name</label>
            <div className={`relative ${errors.name ? 'animate-shake' : ''}`}>
              <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 md:w-[18px] md:h-[18px] ${errors.name ? 'text-red-500' : 'text-slate-400'}`} />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full bg-white border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl md:rounded-2xl py-2.5 md:py-4 pl-10 md:pl-12 pr-4 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none ${primaryFocusBorder} transition-all shadow-xs md:shadow-sm`}
              />
            </div>
            {errors.name && <p className="text-[9px] text-red-500 font-black uppercase tracking-wider ml-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1 md:space-y-2">
            <label className={`text-[9px] md:text-[10px] font-black ${primaryText} uppercase tracking-[2px] md:tracking-[3px] ml-1`}>Email Address</label>
            <div className={`relative ${errors.email ? 'animate-shake' : ''}`}>
              <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 md:w-[18px] md:h-[18px] ${errors.email ? 'text-red-500' : 'text-slate-400'}`} />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full bg-white border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-xl md:rounded-2xl py-2.5 md:py-4 pl-10 md:pl-12 pr-4 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none ${primaryFocusBorder} transition-all shadow-xs md:shadow-sm`}
              />
            </div>
            {errors.email && <p className="text-[9px] text-red-500 font-black uppercase tracking-wider ml-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1 md:space-y-2">
            <label className={`text-[9px] md:text-[10px] font-black ${primaryText} uppercase tracking-[2px] md:tracking-[3px] ml-1`}>Phone Number</label>
            <div className={`relative ${errors.phone ? 'animate-shake' : ''}`}>
              <Phone size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 md:w-[18px] md:h-[18px] ${errors.phone ? 'text-red-500' : 'text-slate-400'}`} />
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full bg-white border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-xl md:rounded-2xl py-2.5 md:py-4 pl-10 md:pl-12 pr-4 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none ${primaryFocusBorder} transition-all shadow-xs md:shadow-sm`}
              />
            </div>
            {errors.phone && <p className="text-[9px] text-red-500 font-black uppercase tracking-wider ml-1">{errors.phone}</p>}
          </div>

          {/* Gender & DOB Row */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-2">
              <label className={`text-[9px] md:text-[10px] font-black ${primaryText} uppercase tracking-[2px] md:tracking-[3px] ml-1`}>Gender</label>
              <div className="relative">
                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 md:w-[18px] md:h-[18px]" />
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className={`w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-2.5 md:py-4 pl-10 md:pl-12 pr-2 md:pr-4 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none ${primaryFocusBorder} transition-all appearance-none shadow-xs md:shadow-sm`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 md:space-y-2">
              <label className={`text-[9px] md:text-[10px] font-black ${primaryText} uppercase tracking-[2px] md:tracking-[3px] ml-1`}>Date of Birth</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 md:w-[18px] md:h-[18px]" />
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className={`w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-2.5 md:py-4 pl-10 md:pl-12 pr-2 md:pr-4 text-[11px] md:text-xs font-semibold text-slate-800 focus:outline-none ${primaryFocusBorder} transition-all shadow-xs md:shadow-sm`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 md:pt-8 pb-8 md:pb-12">
          <button 
            onClick={handleSave}
            className={`w-full ${primaryBg} text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-base uppercase tracking-[2px] md:tracking-[3px] shadow-md ${primaryShadow} hover:scale-[1.02] transition-all active:scale-95 group relative overflow-hidden`}
          >
            <span className="relative z-10">Save Changes</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EditProfile;
