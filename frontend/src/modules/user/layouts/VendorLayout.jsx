import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  User,
  Home as HomeIcon,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';

import MainSidebar from '../components/common/MainSidebar';
import HeaderTop from '../components/common/HeaderTop';
import HeaderTabs from '../components/common/HeaderTabs';
import SearchBar from '../components/common/SearchBar';
import CategoryNavbar from '../components/common/CategoryNavbar';
import LanguageSelector from '../components/common/LanguageSelector';
import useAccountStore from '../../../store/useAccountStore';
import useVendorStore from '../../../store/useVendorStore';
import { getCart } from '../services/cartApi';
import { fetchCartCount } from '../utils/cartUtils';
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
      return 'bg-[#3E5A44]'; // Default Olive Green
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
  const { savedAddresses, selectedAddressId, isDarkMode } = useAccountStore();
  const { selectedCategory, setSelectedCategory, fetchStandardNav } = useVendorStore();
  const { location: liveLocation, setPromptOpen } = useLiveLocation();
  useHydrateAddresses();
  const deliverTo = getDisplayAddress({ savedAddresses, selectedAddressId, liveLocation });
  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];

  /* ── Cart listener ── */
  useEffect(() => {
    const updateCart = async () => {
      try {
        const count = await fetchCartCount();
        setCartCount(count);
        const cart = await getCart();
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
    window.dispatchEvent(new Event('cartUpdated'));
  }, [location.pathname]);

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

  const hideHeader = isImmersivePage;
  const hideFooter  = isImmersivePage && !location.pathname.includes('all-offers') && !location.pathname.includes('categories');

  const isCartOrCheckoutPage = location.pathname.includes('/cart') || location.pathname.includes('/checkout');
  const cartTotalItems = cartItems.reduce((acc, item) => acc + (item.qty || 1), 0);
  const cartTotalPrice = cartItems.reduce((acc, item) => {
    return acc + parsePrice(item.price) * parsePrice(item.qty || 1);
  }, 0);
  const isDarkHeader = (
    localStorage.getItem('isMithilakFlow') === 'true' || 
    location.pathname.includes('/mithilak') || 
    (location.pathname.includes('/quick-shop') && !location.pathname.includes('/fresh-grocery')) ||
    (!location.pathname.includes('/quick-shop') && !location.pathname.includes('/fresh-grocery') && (selectedCategory === 'You Buy' || selectedCategory === 'Home' || !selectedCategory))
  );

  const isMithilakartFlow = 
    !location.pathname.includes('/mithilak') && 
    !location.pathname.includes('/quick-shop') && 
    !location.pathname.includes('/fresh-grocery');

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 text-primary-dark relative ${
      (localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak'))
        ? 'bg-[#F5F9FA]'
        : location.pathname.includes('/fresh-grocery')
          ? 'bg-[#FFF8EE]'
          : location.pathname.includes('/quick-shop')
            ? 'bg-white'
            : 'bg-[#F6F8F3]'
    }`}>
      {/* Global Repeating Mithila Art Page Background Texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-30 bg-repeat opacity-[0.035] select-none"
        style={{
          backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
          backgroundSize: '360px',
        }}
      />

      {/* Drawer Sidebar */}
      <MainSidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Desktop Header */}
      {!hideHeader && (
        <div className={`hidden md:flex items-center justify-between px-8 py-2.5 border-b border-gray-200/80 sticky top-0 z-50 shadow-sm transition-colors duration-300 ${
          (localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak'))
            ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white'
            : location.pathname.includes('/fresh-grocery')
              ? 'bg-[#D9A21B] text-[#3F2A20]'
              : location.pathname.includes('/quick-shop')
                ? 'bg-gradient-to-r from-[#ff2a5f] to-[#ff7e5f] text-white'
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
              <Link to="/categories" className={`text-[14px] font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-[#3F2A20]`}>{t('nav.categories')}</Link>
              <Link to="/cart" className={`text-[14px] font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-2 hover:bg-black/5 text-[#3F2A20]`}>
                <span>{t('nav.cart')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-[#F26522] text-white">{cartCount}</span>
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
          animate={{
            boxShadow: scrolled
              ? '0 2px 12px rgba(0,0,0,0.08)'
              : '0 1px 0px rgba(0,0,0,0.02)',
          }}
          transition={{ duration: 0.22 }}
          className={`md:hidden sticky top-0 z-50 pb-2 rounded-b-[20px] transition-colors duration-300 ${
            (localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak'))
              ? 'bg-[#207C8A]'
              : location.pathname.includes('/fresh-grocery')
                ? 'bg-[#D9A21B]'
                : location.pathname.includes('/quick-shop')
                  ? 'bg-[#F26522]'
                  : 'bg-[#3E5A44]'
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
      <div className="flex-1 flex flex-col bg-transparent relative z-10">
        <div className="flex-1 flex">
          <div className="w-full max-w-[1600px] mx-auto px-0 md:px-8 xl:px-12 flex h-full">
            <main className="flex-1 min-w-0 pb-16">
              <Outlet />
            </main>
          </div>
        </div>
        {!location.pathname.includes('/profile') && <Footer />}
      </div>

      {/* Mobile-First Bottom Navbar (Fixed) */}
      {!hideFooter && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-2 flex justify-between items-center z-50 bg-[#FFF8EE] border-[#EADCC9]/55 text-[#3F2A20] shadow-[0_-2px_10px_rgba(63,42,32,0.05)]">
        <Link 
          to={(localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak')) ? "/mithilak" : "/home"} 
          onClick={() => {
            if (!(localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak'))) {
              localStorage.setItem('isQuickShopFlow', 'false');
              localStorage.setItem('isMithilakFlow', 'false');
              localStorage.setItem('isFreshGroceryFlow', 'false');
            }
          }}
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/home' || location.pathname === '/quick-shop' || location.pathname === '/mithilak' || location.pathname === '/fresh-grocery'
              ? ((localStorage.getItem('isMithilakFlow') === 'true' || location.pathname === '/mithilak') 
                  ? 'text-[#207C8A]' 
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : (localStorage.getItem('isQuickShopFlow') === 'true' ? 'text-[#FF5C00]' : 'text-[#3E5A44]')))
              : 'text-[#3F2A20]/80'
          }`}
        >
          <HomeIcon size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/home' || location.pathname === '/quick-shop' || location.pathname === '/mithilak' || location.pathname === '/fresh-grocery' ? 'font-black' : 'font-semibold'}`}>Home</span>
        </Link>
        <Link 
          to="/categories"
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/categories' 
              ? ((localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak')) 
                  ? 'text-[#207C8A]' 
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : 'text-[#3E5A44]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <LayoutGrid size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/categories' ? 'font-black' : 'font-semibold'}`}>Categories</span>
        </Link>
        <Link 
          to="/cart" 
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/cart' 
              ? ((localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak')) 
                  ? 'text-[#207C8A]' 
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : 'text-[#3E5A44]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={22} strokeWidth={2.2} />
            <span className="absolute -top-1.5 -right-2 text-[8px] font-black px-1 py-0.5 rounded-full bg-[#F26522] text-white border border-[#FFF8EE]">
              {cartCount}
            </span>
          </div>
          <span className={`text-[10px] ${location.pathname === '/cart' ? 'font-black' : 'font-semibold'}`}>Cart</span>
        </Link>
        <Link 
          to="/profile" 
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/profile' 
              ? ((localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak')) 
                  ? 'text-[#207C8A]' 
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : 'text-[#3E5A44]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <User size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/profile' ? 'font-black' : 'font-semibold'}`}>You</span>
        </Link>
      </nav>
      )}

      {/* Floating Cart Pill (Shows on all pages when cart has items, except cart/checkout page) */}
      {!isCartOrCheckoutPage && cartTotalItems > 0 && (
        <div 
          onClick={() => navigate('/vendor/cart')}
          className={`fixed bottom-[76px] left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-[380px] md:px-6 md:py-4 md:rounded-2xl z-[1000] rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.15)] text-white cursor-pointer active:scale-[0.98] transition-all duration-300 animate-in slide-in-from-bottom-6 ${
            localStorage.getItem('isFreshGroceryFlow') === 'true'
              ? 'bg-gradient-to-r from-[#7A3E17] to-[#b45309] hover:brightness-110'
              : localStorage.getItem('isMithilakFlow') === 'true'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] hover:brightness-110'
                  : localStorage.getItem('isQuickShopFlow') === 'true'
                    ? 'bg-gradient-to-r from-[#ff2a5f] to-[#ff7e5f] hover:brightness-110'
                  : 'bg-[#3E5A44] hover:bg-[#06331b]'
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
          <div className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors duration-300 ${
            localStorage.getItem('isQuickShopFlow') === 'true'
              ? 'bg-white text-[#d6186d]'
              : 'bg-white/20 text-white'
          }`}>
            <span>{t('nav.viewCart')}</span>
            <ChevronRight size={13} strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLayout;
