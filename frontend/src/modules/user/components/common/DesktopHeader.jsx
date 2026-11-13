import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Camera,
  Mic,
  MapPin,
  ChevronDown,
  ShoppingCart,
  User,
  Heart,
  LayoutGrid,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tName } from '../../../../shared/utils/translateName';
import { formatPrice } from '../../../../shared/utils/priceFormatter';
import { getUser } from '../../../../shared/api/tokenStorage';
import useAccountStore from '../../../../store/useAccountStore';
import HeaderTabs from './HeaderTabs';
import LanguageSelector from './LanguageSelector';
import toast from 'react-hot-toast';

const DesktopHeader = React.forwardRef(({
  effectiveFlow = 'mithilakart',
  deliverTo,
  onLocationClick,
  cartTotalItems = 0,
  cartTotalPrice = 0,
  cartBadgeBg = 'bg-[#65B842]',
}, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef(null);

  const wishlist = useAccountStore((state) => state.wishlist) || [];
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;
  const userProfile = useAccountStore((state) => state.userProfile);
  const customerUser = getUser('customer') || userProfile;

  const currentTab = effectiveFlow === 'quickshop'
    ? 'quick_shop'
    : effectiveFlow === 'freshgrocery'
      ? 'groceries_fresh'
      : effectiveFlow === 'mithilak'
        ? 'mithilak'
        : 'mithilakart';

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&tab=${currentTab}`);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      navigate(`/search?q=${encodeURIComponent(speechToText)}&tab=${currentTab}`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzingImage(true);
      toast.loading('Analyzing image for matching products...', { id: 'img-search-desktop' });
      setTimeout(() => {
        setIsAnalyzingImage(false);
        toast.dismiss('img-search-desktop');
        toast.success(t('auto.imageAnalyzedFoundMatchingHandcrafte', { defaultValue: 'Found matching products!' }));
        navigate(`/search?tab=${currentTab}`);
      }, 1200);
    }
  };

  // Header background theme styling
  const headerBgClass = effectiveFlow === 'mithilak'
    ? 'bg-gradient-to-r from-[#144f58] via-[#207C8A] to-[#144f58]'
    : effectiveFlow === 'freshgrocery'
      ? 'bg-gradient-to-r from-[#b37e09] via-[#D9A21B] to-[#b37e09]'
      : effectiveFlow === 'quickshop'
        ? 'bg-gradient-to-r from-[#cf470c] via-[#F26522] to-[#cf470c]'
        : 'bg-gradient-to-r from-[#448b29] via-[#5ca83b] to-[#448b29]';

  const searchPlaceholder = effectiveFlow === 'quickshop'
    ? 'Search 15-min delivery items...'
    : effectiveFlow === 'freshgrocery'
      ? 'Search fresh fruits, vegetables...'
      : effectiveFlow === 'mithilak'
        ? 'Search Madhubani paintings...'
        : 'Search products, crafts, groceries...';

  const trustBadgeText = effectiveFlow === 'quickshop'
    ? '⚡ 15-Minute Express Delivery'
    : effectiveFlow === 'freshgrocery'
      ? '🥦 100% Farm Fresh Quality'
      : effectiveFlow === 'mithilak'
        ? '🎨 Certified GI-Tagged Mithila Crafts'
        : '✨ Direct from Bihari Artisans';

  return (
    <div
      ref={ref}
      className={`hidden md:block sticky top-0 z-50 text-white shadow-md transition-colors duration-300 border-b border-black/10 select-none ${headerBgClass}`}
    >
      {/* ── Hidden file input for camera / visual search ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Top Main Action Bar ── */}
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 xl:px-10 py-2.5 flex items-center justify-between gap-2.5 lg:gap-4 xl:gap-6 w-full">
        {/* Brand Logo & Deliver To Location */}
        <div className="flex items-center gap-2.5 lg:gap-4 flex-shrink-0">
          <Link
            to="/home"
            className="flex items-center gap-2 group cursor-pointer flex-shrink-0"
            title="Mithilakart Home"
          >
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
              <img
                src="/mthibg.png"
                alt="Mithilakart"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[20px] lg:text-[22px] font-black tracking-tight text-white leading-none">
                Mithilakart
              </span>
              <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest mt-0.5 leading-none hidden lg:block">
                Handcrafted & Quick
              </span>
            </div>
          </Link>

          {/* Location / Deliver-To Pill */}
          <button
            type="button"
            onClick={onLocationClick}
            className="flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-xs transition-all shadow-xs group cursor-pointer text-left flex-shrink-0"
            title="Change Delivery Location"
          >
            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MapPin size={12} className="text-yellow-300" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-white/75 leading-none">
                {t('nav.deliverTo', { defaultValue: 'Deliver to' })}
              </span>
              <span className="text-[11.5px] lg:text-[12px] font-black text-white truncate max-w-[90px] md:max-w-[110px] lg:max-w-[140px] xl:max-w-[180px] mt-0.5">
                {tName(deliverTo?.label || 'Select Location')}
              </span>
            </div>
            <ChevronDown size={11} className="text-white/80 group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
          </button>
        </div>

        {/* Central Search Bar */}
        <div className="flex-1 max-w-[560px] mx-1 lg:mx-2 min-w-[180px]">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search
              size={16}
              className="absolute left-3.5 text-slate-400 pointer-events-none flex-shrink-0 z-10"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? 'Listening...' : isAnalyzingImage ? 'Analyzing...' : searchPlaceholder}
              disabled={isAnalyzingImage}
              className="w-full h-[40px] pl-9.5 pr-[98px] text-[13px] font-semibold bg-white text-slate-800 placeholder:text-slate-400 rounded-full outline-none focus:ring-2 focus:ring-white/40 shadow-xs transition-all truncate"
            />

            {/* Clear button if text present */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-[82px] text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Clear"
              >
                <X size={13} />
              </button>
            )}

            {/* Right Tools: Camera + Mic + Search Button */}
            <div className="absolute right-1 flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleCameraClick}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Search by image"
              >
                <Camera size={15} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ${
                  isListening ? 'text-rose-500 bg-rose-50 animate-pulse' : ''
                }`}
                title="Voice search"
              >
                <Mic size={15} strokeWidth={2.2} />
              </button>
              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title="Submit Search"
              >
                <Search size={12} strokeWidth={2.8} />
              </button>
            </div>
          </form>
        </div>

        {/* User Actions: Language + Wishlist + Account + Cart */}
        <div className="flex items-center gap-1.5 lg:gap-2.5 flex-shrink-0">
          {/* Language Selector */}
          <LanguageSelector variant="glass" />

          {/* Wishlist Link */}
          <Link
            to="/profile/wishlist"
            className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all shadow-xs group cursor-pointer flex-shrink-0"
            title="Wishlist"
          >
            <div className="relative">
              <Heart size={16} className="text-white group-hover:scale-110 transition-transform" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-500 text-white text-[8.5px] font-black flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[12px] font-bold hidden xl:inline">
              {t('nav.wishlist', { defaultValue: 'Wishlist' })}
            </span>
          </Link>

          {/* Account / Profile Link */}
          <Link
            to="/profile"
            className="flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all shadow-xs group cursor-pointer flex-shrink-0"
            title="Account & Profile"
          >
            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <User size={13} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-col text-left leading-tight hidden xl:flex">
              <span className="text-[8.5px] font-bold text-white/75 uppercase tracking-wider leading-none">
                {customerUser?.name ? `Hi, ${customerUser.name.split(' ')[0]}` : t('auth.signIn', { defaultValue: 'Sign In' })}
              </span>
              <span className="text-[11.5px] font-black text-white mt-0.5 leading-none">
                {t('auto.profile', { defaultValue: 'Account' })}
              </span>
            </div>
          </Link>

          {/* Cart Pill */}
          <Link
            to="/cart"
            className="flex items-center gap-2 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-full bg-white text-slate-900 hover:bg-white/95 shadow-md active:scale-95 transition-all font-black text-xs group cursor-pointer flex-shrink-0"
            title="View Cart"
          >
            <div className="relative">
              <ShoppingCart size={17} className="text-slate-900 group-hover:scale-110 transition-transform" strokeWidth={2.4} />
              <span className={`absolute -top-2 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full ${cartBadgeBg} text-white text-[8.5px] font-black flex items-center justify-center shadow-xs border border-white`}>
                {cartTotalItems}
              </span>
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[8.5px] uppercase font-bold text-slate-500 leading-none">
                {t('nav.cart', { defaultValue: 'Cart' })}
              </span>
              <span className="text-[11.5px] font-extrabold text-slate-900 leading-none mt-0.5 whitespace-nowrap">
                {cartTotalPrice > 0 ? formatPrice(cartTotalPrice) : '₹0'}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Bottom Tier: Flow Switcher & Discovery Strip ── */}
      <div className="bg-black/15 border-t border-white/10 backdrop-blur-xs">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 xl:px-10 py-1.5 flex items-center justify-between gap-3 w-full">
          {/* Flow Switcher Tabs (Desktop Variant) */}
          <div className="flex-shrink-0">
            <HeaderTabs variant="desktop" />
          </div>

          {/* Secondary Quick Navigation & Trust Badge */}
          <div className="flex items-center gap-2.5 xl:gap-5 text-white/90 text-[12px] xl:text-[12.5px] font-bold flex-shrink-0">
            <Link
              to={`/categories?flow=${effectiveFlow}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <LayoutGrid size={14} />
              <span>{t('nav.categories', { defaultValue: 'All Categories' })}</span>
            </Link>

            <Link
              to="/all-offers"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-yellow-300" />
              <span>{t('nav.offers', { defaultValue: 'Offers' })}</span>
            </Link>

            <Link
              to="/profile/help-center"
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>{t('nav.help', { defaultValue: 'Help' })}</span>
            </Link>

            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-white/20 text-[11px] font-extrabold text-white/90">
              <ShieldCheck size={13} className="text-yellow-300" />
              <span>{trustBadgeText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DesktopHeader.displayName = 'DesktopHeader';

export default DesktopHeader;
