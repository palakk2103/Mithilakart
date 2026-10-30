import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, Outlet, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  User,
  Home as HomeIcon,
  LayoutGrid,
  ChevronRight,
  X,
} from 'lucide-react';

import MainSidebar from '../components/common/MainSidebar';
import HeaderTop from '../components/common/HeaderTop';
import HeaderTabs from '../components/common/HeaderTabs';
import SearchBar from '../components/common/SearchBar';
import CategoryNavbar from '../components/common/CategoryNavbar';
import LanguageSelector from '../components/common/LanguageSelector';
import useAccountStore from '../../../store/useAccountStore';
import useVendorStore from '../../../store/useVendorStore';
import { fetchCartItems } from '../utils/cartUtils';
import { useTranslation } from 'react-i18next';
import { parsePrice, formatPrice } from '../../../shared/utils/priceFormatter';
import Footer from '../../../shared/components/Footer';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { useHydrateAddresses, getDisplayAddress } from '../../../shared/hooks/useDeliverToAddress';

const getMithilakartHeaderBg = (category) => {
  switch (category) {
    case 'Beauty':
      return 'bg-[#F9A8D4]'; // Soft Rose Pink
    case 'Gifting':
      return 'bg-[#D8B4FE]'; // Soft Purple
    case 'Electronics':
      return 'bg-[#93C5FD]'; // Soft Blue
    case 'Jewellery':
      return 'bg-[#FDBA74]'; // Soft Orange/Peach
    case 'Toys':
      return 'bg-[#99F6E4]'; // Soft Teal
    case 'Stationery':
      return 'bg-[#C7D2FE]'; // Soft Indigo
    case 'Fashion':
      return 'bg-[#FCA5A5]'; // Soft Red
    case 'Electrical':
      return 'bg-[#FEF08A]'; // Soft Yellow
    case 'You Buy':
    default:
      return 'bg-[#65B842]'; // Default Vibrant Green
  }
};

const VendorLayout = () => {
  const { t } = useTranslation();
  const location = useRouterLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [isFloatingCartDismissed, setIsFloatingCartDismissed] = useState(false);
  const { savedAddresses, selectedAddressId, isDarkMode } = useAccountStore();
  const activeFlow = useVendorStore((state) => state.activeFlow);
  const setActiveFlow = useVendorStore((state) => state.setActiveFlow);
  const selectedCategory = useVendorStore((state) => state.selectedCategory);
  const setSelectedCategory = useVendorStore((state) => state.setSelectedCategory);
  const fetchStandardNav = useVendorStore((state) => state.fetchStandardNav);
  const { location: liveLocation, setPromptOpen } = useLiveLocation();
  useHydrateAddresses();
  const deliverTo = useMemo(() => {
    return getDisplayAddress({ savedAddresses, selectedAddressId, liveLocation });
  }, [savedAddresses, selectedAddressId, liveLocation?.latitude, liveLocation?.longitude, liveLocation?.city, liveLocation?.shortLabel]);
  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];

  const effectiveFlow = useMemo(() => {
    if (location.pathname.includes('/quick-shop')) return 'quickshop';
    if (location.pathname.includes('/fresh-grocery')) return 'freshgrocery';
    if (location.pathname.includes('/mithilak')) return 'mithilak';
    if (location.pathname === '/home' || location.pathname === '/') return 'mithilakart';
    return activeFlow || 'mithilakart';
  }, [location.pathname, activeFlow]);

  const cartBadgeBg = effectiveFlow === 'mithilak' 
    ? 'bg-[#207C8A]' 
    : effectiveFlow === 'freshgrocery' 
      ? 'bg-[#D9A21B]' 
      : effectiveFlow === 'quickshop' 
        ? 'bg-[#F26522]' 
        : 'bg-[#65B842]';

  /* ── Cart listener ── */
  useEffect(() => {
    const updateCart = async () => {
      try {
        // One request for both the badge count and the items (was two per refresh,
        // and this runs on every navigation — enough to hit the API rate limit).
        const { cart, items } = await fetchCartItems();
        setCartCount(items.reduce((acc, item) => acc + (item.qty || 1), 0));
        setCartItems((cart?.items || []).map((item) => ({
          ...item,
          cartId: item.itemKey || item.id,
          qty: item.quantity,
        })));
      } catch {
        setCartItems([]);
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  useEffect(() => {
    fetchStandardNav();
  }, [fetchStandardNav]);

  useEffect(() => {
    if (effectiveFlow !== activeFlow) {
      setActiveFlow(effectiveFlow);
    }
  }, [effectiveFlow, activeFlow, setActiveFlow]);

  const mobileHeaderRef = useRef(null);
  const desktopHeaderRef = useRef(null);

  /* ── Dynamic Header Height Observer ── */
  useEffect(() => {
    const updateHeaderHeights = () => {
      if (mobileHeaderRef.current) {
        const h = mobileHeaderRef.current.offsetHeight;
        document.documentElement.style.setProperty('--mobile-header-height', `${h}px`);
      }
      if (desktopHeaderRef.current) {
        const h = desktopHeaderRef.current.offsetHeight;
        document.documentElement.style.setProperty('--desktop-header-height', `${h}px`);
      }
    };

    updateHeaderHeights();
    const timer = setTimeout(updateHeaderHeights, 60);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateHeaderHeights);
      if (mobileHeaderRef.current) ro.observe(mobileHeaderRef.current);
      if (desktopHeaderRef.current) ro.observe(desktopHeaderRef.current);
    }

    window.addEventListener('resize', updateHeaderHeights);
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeaderHeights);
    };
  }, [location.pathname, effectiveFlow, selectedCategory, deliverTo?.label]);

  /* ── Scroll shadow listener ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isImmersivePage =
    location.pathname.includes('categories') ||
    location.pathname.includes('category-products') ||
    location.pathname.includes('product-detail') ||
    location.pathname.includes('continue-shopping') ||
    location.pathname.includes('all-offers') ||
    location.pathname.includes('cart') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/deals') ||
    location.pathname.includes('/search') ||
    location.pathname.includes('/category') ||
    location.pathname.includes('wishlist');

  const isDualScrollPage = 
    location.pathname === '/categories' || 
    location.pathname === '/vendor/categories' ||
    location.pathname.includes('/category');

  const isProfileMainPage = location.pathname === '/profile' || location.pathname === '/vendor/profile';
  const hideHeader = isImmersivePage;
  const hideFooter = isImmersivePage && !location.pathname.includes('all-offers') && !isProfileMainPage;

  const isCartOrCheckoutPage = 
    location.pathname.includes('/cart') || 
    location.pathname.includes('/checkout') || 
    location.pathname.includes('/order-summary') || 
    location.pathname.includes('wishlist') || 
    location.pathname.includes('/profile') ||
    location.pathname.includes('/orders') ||
    location.pathname.includes('/order-detail') ||
    location.pathname.includes('/help-center');

  const activeTabMarketplaceTab = 
    effectiveFlow === 'mithilak' ? 'mithilak' :
    effectiveFlow === 'freshgrocery' ? 'groceries_fresh' :
    effectiveFlow === 'quickshop' ? 'quick_shop' : 'mithilakart';

  const currentTabCartItems = cartItems.filter(item => {
    const itemTab = item.marketplaceTab || (
      item.commerceFlow === 'fresh_grocery' ? 'groceries_fresh' :
      item.commerceFlow === 'quick_shop' ? 'quick_shop' :
      item.commerceFlow === 'mithilak' ? 'mithilak' : 'mithilakart'
    );
    return itemTab === activeTabMarketplaceTab;
  });

  const cartTotalItems = currentTabCartItems.reduce((acc, item) => acc + (item.qty || 1), 0);
  
  // Reset dismissed state when total items in the cart change
  useEffect(() => {
    setIsFloatingCartDismissed(false);
  }, [cartTotalItems]);

  const cartTotalPrice = currentTabCartItems.reduce((acc, item) => {
    return acc + parsePrice(item.price) * parsePrice(item.qty || 1);
  }, 0);
  const isDarkHeader = (
    effectiveFlow === 'mithilak' || 
    effectiveFlow === 'quickshop' || 
    (effectiveFlow === 'mithilakart' && (selectedCategory === 'You Buy' || selectedCategory === 'Home' || !selectedCategory))
  );

  const isMithilakartFlow = effectiveFlow === 'mithilakart';

  return (
    <div className={`${isDualScrollPage ? 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} flex flex-col transition-colors duration-300 text-primary-dark relative ${
      effectiveFlow === 'mithilak'
        ? 'bg-[#F5F9FA]'
        : effectiveFlow === 'freshgrocery'
          ? 'bg-[#FFF8EE]'
          : effectiveFlow === 'quickshop'
            ? 'bg-white'
            : 'bg-[#F6F8F3]'
    }`}>
      {/* Global Repeating Mithila Art Page Background Texture */}
      {location.pathname !== '/product-detail' && location.pathname !== '/vendor/product-detail' && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.012] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Drawer Sidebar */}
      <MainSidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Desktop Header */}
      {!hideHeader && (
        <div ref={desktopHeaderRef} className={`hidden md:flex items-center justify-between px-8 py-2.5 border-b border-gray-200/80 sticky top-0 z-50 shadow-sm transition-colors duration-300 ${
          effectiveFlow === 'mithilak'
            ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58] text-white'
            : effectiveFlow === 'freshgrocery'
              ? 'bg-[#D9A21B] text-[#3F2A20]'
              : effectiveFlow === 'quickshop'
                ? 'bg-[#F26522] text-white'
                : `${getMithilakartHeaderBg(selectedCategory)} ${
                    selectedCategory === 'You Buy' || selectedCategory === 'Home' || !selectedCategory
                      ? 'text-white'
                      : 'text-slate-800'
                  }`
        }`}>
          <div className="flex items-center gap-8 max-w-[1600px] mx-auto w-full">
            <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl font-black tracking-tight">Mithilakart</span>
            </Link>

            {/* Desktop Header Flow Tabs */}
            <div className="w-[360px] flex-shrink-0 scale-95 origin-left">
              <HeaderTabs />
            </div>

            <nav className="flex items-center gap-3 ml-4">
              <Link to="/home" className={`text-[14px] font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-[#3F2A20]`}>{t('nav.home')}</Link>
              <Link to={`/categories?flow=${effectiveFlow}`} className={`text-[14px] font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-[#3F2A20]`}>{t('nav.categories')}</Link>
              <Link to="/cart" className={`text-[14px] font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-2 hover:bg-black/5 text-[#3F2A20]`}>
                <span>{t('nav.cart')}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${cartBadgeBg} text-white`}>{cartTotalItems}</span>
              </Link>
              <Link to="/profile" className={`text-[14px] font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-[#3F2A20]`}>Profile</Link>
            </nav>

            <div className="ml-auto flex items-center gap-6">
              <LanguageSelector isDarkHeader={isDarkHeader} />
              <div className="text-sm font-semibold flex items-center gap-1 opacity-90">
                <span>📍 {t('nav.deliverTo')}</span>
                <button
                  type="button"
                  onClick={() => setPromptOpen(true)}
                  className="font-bold truncate max-w-[200px] hover:underline text-left"
                >
                  {deliverTo.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      {!hideHeader && (
        <motion.header
          ref={mobileHeaderRef}
          animate={{
            boxShadow: scrolled
              ? '0 2px 12px rgba(0,0,0,0.08)'
              : '0 1px 0px rgba(0,0,0,0.02)',
          }}
          transition={{ duration: 0.22 }}
          className={`md:hidden sticky top-0 z-50 pb-3 ${(location.pathname === '/home' || location.pathname === '/' || location.pathname === '/quick-shop' || location.pathname === '/fresh-grocery' || location.pathname === '/mithilak') ? 'mb-1.5' : 'mb-4'} rounded-b-[24px] transition-colors duration-300 ${
            effectiveFlow === 'mithilak'
              ? 'bg-[#207C8A]'
              : effectiveFlow === 'freshgrocery'
                ? 'bg-[#D9A21B]'
                : effectiveFlow === 'quickshop'
                  ? 'bg-[#F26522]'
                  : 'bg-[#65B842]'
          }`}
        >


          {/* Restored HeaderTabs as requested */}
          <HeaderTabs />

          {/* Row 3 : Search + QR */}
          <SearchBar selectedAddress={selectedAddress} deliverTo={deliverTo} onLocationClick={() => setPromptOpen(true)} />
        </motion.header>
      )}

      {/* SaleBanner is now rendered inside Home.jsx or specifically based on visibility store */}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col bg-transparent relative z-10 ${isDualScrollPage ? 'overflow-hidden h-full min-h-0' : ''}`}>
        <div className={`flex-1 flex min-h-0 ${isDualScrollPage ? 'overflow-hidden h-full' : ''}`}>
          <div className={`w-full max-w-[1600px] mx-auto px-0 md:px-8 xl:px-12 flex h-full min-h-0 ${isDualScrollPage ? 'overflow-hidden' : ''}`}>
            <main className={`flex-1 min-w-0 min-h-0 flex flex-col pb-0 ${isDualScrollPage ? 'overflow-hidden h-full' : ''}`}>
              <Outlet />
            </main>
          </div>
        </div>
        {!hideFooter && location.pathname !== '/profile' && <Footer />}
      </div>

      {/* Mobile-First Bottom Navbar (Fixed) */}
      {!hideFooter && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-2 flex justify-between items-center z-50 bg-[#FFF8EE] border-[#EADCC9]/55 text-[#3F2A20] shadow-[0_-2px_10px_rgba(63,42,32,0.05)]">
        <Link 
          to={effectiveFlow === 'mithilak' ? "/mithilak" : effectiveFlow === 'freshgrocery' ? "/fresh-grocery" : effectiveFlow === 'quickshop' ? "/quick-shop" : "/home"} 
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/home' || location.pathname === '/quick-shop' || location.pathname === '/mithilak' || location.pathname === '/fresh-grocery'
              ? (effectiveFlow === 'mithilak' 
                  ? 'text-[#207C8A]' 
                  : (effectiveFlow === 'freshgrocery' ? 'text-[#D9A21B]' : (effectiveFlow === 'quickshop' ? 'text-[#FF5C00]' : 'text-[#65B842]')))
              : 'text-[#3F2A20]/80'
          }`}
        >
          <HomeIcon size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/home' || location.pathname === '/quick-shop' || location.pathname === '/mithilak' || location.pathname === '/fresh-grocery' ? 'font-black' : 'font-semibold'}`}>{t('nav.home', { defaultValue: 'Home' })}</span>
        </Link>
        <Link 
          to={`/categories?flow=${effectiveFlow}`}
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/categories' 
              ? (effectiveFlow === 'mithilak' 
                  ? 'text-[#207C8A]' 
                  : (effectiveFlow === 'freshgrocery' 
                      ? 'text-[#D9A21B]' 
                      : (effectiveFlow === 'quickshop' ? 'text-[#F26522]' : 'text-[#65B842]'))) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <LayoutGrid size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/categories' ? 'font-black' : 'font-semibold'}`}>{t('nav.categories', { defaultValue: 'Categories' })}</span>
        </Link>
        <Link 
          to="/cart" 
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/cart' 
              ? (effectiveFlow === 'mithilak' 
                  ? 'text-[#207C8A]' 
                  : (effectiveFlow === 'freshgrocery' ? 'text-[#D9A21B]' : 'text-[#65B842]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={22} strokeWidth={2.2} />
            <span className={`absolute -top-1.5 -right-2 text-[8px] font-black px-1 py-0.5 rounded-full ${cartBadgeBg} text-white border border-[#FFF8EE]`}>
              {cartTotalItems}
            </span>
          </div>
          <span className={`text-[10px] ${location.pathname === '/cart' ? 'font-black' : 'font-semibold'}`}>{t('nav.cart', { defaultValue: 'Cart' })}</span>
        </Link>
        <Link 
          to="/profile" 
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/profile' 
              ? (activeFlow === 'mithilak' 
                  ? 'text-[#207C8A]' 
                  : (activeFlow === 'freshgrocery' ? 'text-[#D9A21B]' : 'text-[#65B842]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <User size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/profile' ? 'font-black' : 'font-semibold'}`}>{t('nav.you', { defaultValue: 'Account' })}</span>
        </Link>
      </nav>
      )}

      {/* Floating Cart Pill (Shows on all pages when cart has items, except cart/checkout page) */}
      {!isCartOrCheckoutPage && cartTotalItems > 0 && !isFloatingCartDismissed && (
        <div 
          onClick={() => navigate('/vendor/cart')}
          className={`fixed bottom-[76px] left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-[380px] md:px-6 md:py-4 md:rounded-2xl z-[1000] rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.15)] text-white cursor-pointer active:scale-[0.98] transition-all duration-300 animate-in slide-in-from-bottom-6 ${
            localStorage.getItem('isFreshGroceryFlow') === 'true'
              ? 'bg-gradient-to-r from-[#7A3E17] to-[#b45309] hover:brightness-110'
              : localStorage.getItem('isMithilakFlow') === 'true'
                ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58] hover:brightness-110'
                  : localStorage.getItem('isQuickShopFlow') === 'true'
                    ? 'bg-gradient-to-r from-[#F26522] to-[#FF7A00] hover:brightness-110'
                  : 'bg-[#65B842] hover:bg-[#529b34]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-[13.5px] font-black leading-none">
                {cartTotalItems} {cartTotalItems === 1 ? t('cart.item') : t('cart.items')}
              </p>
              <p className="text-[11.5px] font-bold text-white/85 mt-0.5">
                {formatPrice(cartTotalPrice)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors duration-300 ${
              localStorage.getItem('isQuickShopFlow') === 'true'
                ? 'bg-white text-[#F26522]'
                : 'bg-white/20 text-white'
            }`}>
              <span>{t('nav.viewCart')}</span>
              <ChevronRight size={13} strokeWidth={3} />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingCartDismissed(true);
              }}
              className="p-1 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white/80 hover:text-white"
              aria-label="Dismiss cart notification"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLayout;
