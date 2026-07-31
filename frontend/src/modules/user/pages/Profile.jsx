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
      <div className="px-4 pt-6 relative z-10">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
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

      {/* Log Out / Login Action Button */}
      <div className="px-6 py-6 flex justify-center bg-white border-t border-slate-100 mb-6">
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
    </div>
  );
};

export default VendorProfile;
