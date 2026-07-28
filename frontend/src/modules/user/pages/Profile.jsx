import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Zap, 
  HelpCircle, 
  Mail, 
  ChevronRight, 
  Store, 
  Bell,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAccountStore from '../../../store/useAccountStore';
import { getUser, isAuthenticated, clearTokens, setUser } from '../../../shared/api/tokenStorage';
import { getProfile } from '../services/userApi';
import { logoutCustomer } from '../services/authApi';
import { useTranslation } from 'react-i18next';
import footerBorder from '../../../assets/footer-border.png';

const mapStoredUser = (stored) => ({
  name: stored?.name || '',
  email: stored?.email || '',
  phone: stored?.phone || '',
  countryCode: stored?.countryCode || '+91',
  gender: stored?.gender || '',
  dob: stored?.dob || stored?.dateOfBirth || '',
  avatar: stored?.avatar || stored?.avatarUrl || stored?.profileImage || null,
});

const formatContact = (profile) => {
  if (profile.email) return profile.email;
  if (profile.phone) {
    const code = profile.countryCode || '+91';
    return `${code} ${profile.phone}`;
  }
  return '';
};

const VendorProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useAccountStore();
  const [authed, setAuthed] = useState(() => isAuthenticated('customer'));
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const syncAuth = () => setAuthed(isAuthenticated('customer'));
    window.addEventListener('customer-auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('customer-auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  useEffect(() => {
    const stored = getUser('customer');
    if (stored) {
      updateProfile(mapStoredUser(stored));
    }

    if (!authed) return undefined;

    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      try {
        const profile = await getProfile();
        if (cancelled) return;
        const mapped = mapStoredUser(profile);
        updateProfile(mapped);
        setUser('customer', profile);
      } catch {
        // keep stored profile if API fails
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authed, updateProfile]);

  const handleLogout = async () => {
    await logoutCustomer();
    clearTokens('customer');
    updateProfile({ name: '', email: '', phone: '', gender: '', dob: '', avatar: null });
    localStorage.removeItem('userWishlist');
    navigate('/home', { replace: true });
  };

  const handleLogin = () => {
    navigate('/login', { state: { from: '/profile' } });
  };

  const profileOptions = [
    { label: t('profile.myOrders'), icon: <ShoppingBag size={18} />, path: '/profile/orders' },
    { label: t('profile.wishlist'), icon: <Heart size={18} />, path: '/profile/wishlist' },
    { label: t('profile.coupons'), icon: <Zap size={18} />, path: '/profile/coupons' },
    { label: t('profile.editProfile'), icon: <Mail size={18} />, path: '/profile/edit' },
    { label: t('profile.myAddresses'), icon: <Store size={18} />, path: '/profile/addresses' },
    { label: t('profile.notificationSettings'), icon: <Bell size={18} />, path: '/profile/notifications' },
    { label: t('profile.helpCenter'), icon: <HelpCircle size={18} />, path: '/profile/help-center' }
  ];

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  return (
    <div className={`min-h-screen pb-1 font-sans text-slate-800 relative transition-colors duration-300 ${
      isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : isMithilakFlow ? 'bg-[#F5F9FA]' : 'bg-bg-cream'
    }`}>


      {/* Header Sticky */}
      <div className={`sticky top-0 z-45 border-b px-4 py-4 flex items-center gap-3 relative z-10 ${
        isFreshGroceryFlow 
          ? 'bg-[#D9A21B] border-transparent text-white' 
          : isMithilakFlow 
            ? 'bg-[#207C8A] border-transparent text-white' 
            : isQuickShopFlow 
              ? 'bg-[#F26522] border-transparent text-white' 
              : 'bg-[#FCF7EE]/90 border-[#F3E3CD]/60 backdrop-blur-md'
      }`}>
        <motion.button
          onClick={() => navigate('/home', { replace: false })}
          whileTap={{ scale: 0.88 }}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronRight size={22} className={`${(isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white' : 'text-slate-800'} rotate-180`} />
        </motion.button>
        <span className={`text-[17px] font-black tracking-tight ${(isMithilakFlow || isFreshGroceryFlow || isQuickShopFlow) ? 'text-white' : 'text-slate-800'}`}>{t('profile.title')}</span>
      </div>

      {/* User Card */}
      <div className="px-4 pt-5 relative z-10">
        <div className={`bg-gradient-to-br rounded-3xl p-6 text-white relative overflow-hidden ${
          isMithilakFlow 
            ? 'from-[#207C8A] to-[#1a6874] shadow-[0_8px_30px_rgba(32,124,138,0.15)] border border-[#207C8A]/25'
            : isFreshGroceryFlow
              ? 'from-[#D9A21B] to-[#916909] shadow-[0_8px_30px_rgba(217,162,27,0.15)] border border-[#D9A21B]/25'
              : isQuickShopFlow
                ? 'from-[#F26522] to-[#B83D07] shadow-[0_8px_30px_rgba(242,101,34,0.15)] border border-[#F26522]/25'
                : 'from-[#6FAE4A] to-[#5b953d] shadow-[0_8px_30px_rgba(62,90,68,0.15)] border border-[#6FAE4A]/30'
        }`}>
          <div className="absolute right-[-20px] bottom-[-20px] w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-black tracking-tight">
                {authed ? (userProfile.name || (loadingProfile ? 'Loading...' : 'User')) : 'Guest User'}
              </h1>
              <p className="text-[11px] font-medium opacity-90 mt-1 leading-normal">
                {authed
                  ? (formatContact(userProfile) || 'Add email in Edit Profile')
                  : 'Please login to access all features'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black opacity-80 uppercase tracking-widest leading-none">Status</p>
              <p className="text-[13px] font-black text-yellow-400 mt-1 flex items-center gap-1.5">
                {authed ? '★ VERIFIED MEMBER' : 'GUEST'}
              </p>
            </div>
            {authed && (
              <button className="bg-white/15 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 px-4.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider">
                {t('profile.loyaltyPoints') || 'Points'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vertical Stack List (Horizontal rows stacked vertically) */}
      <div className="px-4 pt-6">
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="divide-y divide-slate-100">
            {profileOptions.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => {
                  navigate(opt.path);
                }}
                className="px-5 py-4.5 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer active:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isMithilakFlow 
                      ? 'bg-[#e0f2f1]/40 text-[#207C8A] group-hover:bg-[#207C8A] group-hover:text-white' 
                      : isFreshGroceryFlow
                        ? 'bg-[#FFF8EE] text-[#D9A21B] group-hover:bg-[#D9A21B] group-hover:text-white'
                        : isQuickShopFlow
                          ? 'bg-[#FFF5EE] text-[#F26522] group-hover:bg-[#F26522] group-hover:text-white'
                          : 'bg-[#EAF5EE] text-[#6FAE4A] group-hover:bg-[#6FAE4A] group-hover:text-white'
                  }`}>
                    {opt.icon}
                  </div>
                  <span className={`text-[13.5px] font-black transition-colors text-slate-800 ${
                    isMithilakFlow 
                      ? 'group-hover:text-[#207C8A]' 
                      : isFreshGroceryFlow
                        ? 'group-hover:text-[#D9A21B]'
                        : isQuickShopFlow
                          ? 'group-hover:text-[#F26522]'
                          : 'group-hover:text-[#6FAE4A]'
                  }`}>
                    {opt.label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-355 transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Footer Section (FAQs, Terms, Privacy, Logout, Socials, Logo, Version) */}
      {/* Decorative Mithila painting border with opacity */}
      <div className="w-full h-10 md:h-14 mt-4 opacity-75 overflow-hidden border-b border-gray-100 bg-white">
        <img
          src={footerBorder}
          alt="Mithila Art Footer Border"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-6 pt-5 pb-20 flex flex-col gap-4 select-none bg-white items-center">
        {/* Link List */}
        <div className="flex flex-col gap-3.5 text-[14px] font-bold text-gray-500 w-full pl-2 pb-4 border-b border-slate-100 mb-2">
          <div onClick={() => navigate('/profile/help-center')} className={`cursor-pointer transition-colors ${
            isMithilakFlow ? 'hover:text-[#207C8A] active:text-[#207C8A]' : isFreshGroceryFlow ? 'hover:text-[#D9A21B] active:text-[#D9A21B]' : isQuickShopFlow ? 'hover:text-[#F26522] active:text-[#F26522]' : 'hover:text-[#6FAE4A] active:text-[#6FAE4A]'
          }`}>
            FAQs
          </div>
          <div onClick={() => navigate('/terms')} className={`cursor-pointer transition-colors ${
            isMithilakFlow ? 'hover:text-[#207C8A] active:text-[#207C8A]' : isFreshGroceryFlow ? 'hover:text-[#D9A21B] active:text-[#D9A21B]' : isQuickShopFlow ? 'hover:text-[#F26522] active:text-[#F26522]' : 'hover:text-[#6FAE4A] active:text-[#6FAE4A]'
          }`}>
            Terms & Conditions
          </div>
          <div onClick={() => navigate('/privacy')} className={`cursor-pointer transition-colors ${
            isMithilakFlow ? 'hover:text-[#207C8A] active:text-[#207C8A]' : isFreshGroceryFlow ? 'hover:text-[#D9A21B] active:text-[#D9A21B]' : isQuickShopFlow ? 'hover:text-[#F26522] active:text-[#F26522]' : 'hover:text-[#6FAE4A] active:text-[#6FAE4A]'
          }`}>
            Privacy Policy
          </div>
        </div>

        {/* Centered Login / Logout */}
        <div className="flex justify-center mt-2">
          {authed ? (
            <button
              onClick={handleLogout}
              className={`font-black text-[15px] flex items-center gap-1.5 active:scale-95 transition-transform ${
                isMithilakFlow ? 'text-[#207C8A] hover:text-[#1a6874]' : isFreshGroceryFlow ? 'text-[#D9A21B] hover:text-[#c49218]' : isQuickShopFlow ? 'text-[#F26522] hover:text-[#d45014]' : 'text-[#6FAE4A] hover:text-[#5b953d]'
              }`}
            >
              Log Out
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className={`font-black text-[15px] flex items-center gap-1.5 active:scale-95 transition-transform ${
                isMithilakFlow ? 'text-[#207C8A] hover:text-[#1a6874]' : isFreshGroceryFlow ? 'text-[#D9A21B] hover:text-[#c49218]' : isQuickShopFlow ? 'text-[#F26522] hover:text-[#d45014]' : 'text-[#6FAE4A] hover:text-[#5b953d]'
              }`}
            >
              Login
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Social Media Icons (Centered for both Desktop & Mobile) */}
        <div className="flex items-center justify-center gap-5 mb-5 mt-4">
          {/* Facebook */}
          <a
            href="https://www.facebook.com/mithilakart"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1877F2] transition-transform hover:scale-110 active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@mithilakart"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FF0000] transition-transform hover:scale-110 active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/mithilakart"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
            style={{
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>

          {/* X */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black transition-transform hover:scale-110 active:scale-95 shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/918076109547"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] transition-transform hover:scale-110 active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>

        {/* Centered Logo & Stacked Brand Name */}
        <div className="flex flex-col items-center justify-center gap-1">
          <img
            src="/mthibg.png"
            alt="Mithilakart Logo"
            className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
          />
          <div className="flex items-center text-[14px] font-bold text-black tracking-wide italic mt-1">
            Mithilakart<span className="text-[10px] align-super ml-0.5">™</span>
          </div>
        </div>

        {/* App Version */}
        <div className="text-[10px] font-bold text-gray-450 text-center tracking-wide mt-2">
          v1.0.0 (build 1)-p1
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
