import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
import { useTranslation } from 'react-i18next';
import { parsePrice, formatPrice } from '../../../shared/utils/priceFormatter';
import Footer from '../../../shared/components/Footer';

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
      return 'bg-[#6FAE4A]'; // Default Brand Green
  }
};

const VendorLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const badgeBg = isMithilakFlow 
    ? 'bg-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522]' 
        : 'bg-[#6FAE4A]';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const { savedAddresses, selectedAddressId, isDarkMode } = useAccountStore();
  const { selectedCategory, setSelectedCategory } = useVendorStore();
  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /* ── Maintenance Mode Check ── */
  useEffect(() => {
    if (localStorage.getItem('isMaintenanceMode') === 'true' && location.pathname !== '/maintenance') {
      navigate('/maintenance', { replace: true });
    }
  }, [location.pathname, navigate]);

  /* ── Cart listener ── */
  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
        setCartItems(cart);
        const total = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
        setCartCount(total);
      } catch {
        setCartItems([]);
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  /* ── Route/Tab switch cart update trigger ── */
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
  const shouldShowFloatingCart =
    !isCartOrCheckoutPage &&
    !location.pathname.includes('/profile') &&
    !location.pathname.includes('/wishlist') &&
    !location.pathname.includes('/wallet') &&
    !location.pathname.includes('/menu');

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
      {!location.pathname.includes('/product-detail') && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
            opacity: 0.018
          }}
        />
      )}

      {/* Drawer Sidebar */}
      <MainSidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Desktop Header */}
      {!hideHeader && (
        <div className={`hidden md:flex items-center justify-between px-4 lg:px-8 py-2.5 border-b border-gray-200/80 sticky top-0 z-50 shadow-sm transition-colors duration-300 ${
          (localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak'))
            ? 'bg-[#207C8A] text-white'
            : location.pathname.includes('/fresh-grocery')
              ? 'bg-[#D9A21B] text-[#3F2A20]'
              : location.pathname.includes('/quick-shop')
                ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00] text-white'
                : `${getMithilakartHeaderBg(selectedCategory)} ${
                    selectedCategory === 'You Buy' || selectedCategory === 'Home' || !selectedCategory
                      ? 'text-white'
                      : 'text-slate-800'
                  }`
        }`}>
          <div className="flex items-center gap-3 lg:gap-8 max-w-[1600px] mx-auto w-full">
            <Link to="/home" className="flex items-center gap-2 flex-shrink-0 text-current">
              <span className="text-xl lg:text-2xl font-black tracking-tight">Mithilakart</span>
            </Link>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[280px] xl:max-w-[360px] mx-2 hidden md:block">
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav.searchPlaceholder') || "Search for products..."}
                  className="w-full h-[36px] pl-10 pr-4 text-xs font-semibold bg-white/90 border border-transparent rounded-full outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-white/20"
                />
              </div>
            </form>

            {/* Desktop Header Flow Tabs */}
            <div className="w-[340px] xl:w-[400px] flex-shrink-0 hidden xl:block">
              <HeaderTabs />
            </div>

            <nav className="flex items-center gap-1.5 lg:gap-3 ml-1 lg:ml-4 flex-shrink-0">
              <Link to="/home" className={`text-[13px] lg:text-[14px] font-black px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-current`}>{t('nav.home')}</Link>
              <Link to="/categories" className={`text-[13px] lg:text-[14px] font-black px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-current`}>{t('nav.categories')}</Link>
              <Link to="/cart" className={`text-[13px] lg:text-[14px] font-black px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 hover:bg-black/5 text-current`}>
                <span>{t('nav.cart')}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black transition-colors duration-300 ${
                  (localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak'))
                    ? 'bg-white text-[#207C8A]'
                    : location.pathname.includes('/fresh-grocery')
                      ? 'bg-[#3F2A20] text-white'
                      : location.pathname.includes('/quick-shop')
                        ? 'bg-white text-[#F26522]'
                        : (selectedCategory === 'You Buy' || selectedCategory === 'Home' || !selectedCategory)
                          ? 'bg-white text-[#6FAE4A]'
                          : 'bg-[#6FAE4A] text-white'
                }`}>{cartCount}</span>
              </Link>
              <Link to="/profile" className={`text-[13px] lg:text-[14px] font-black px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-black/5 text-current`}>Profile</Link>
            </nav>

            <div className="ml-auto flex items-center gap-3 lg:gap-6 flex-shrink-0">
              <LanguageSelector isDarkHeader={isDarkHeader} />
              <div className="text-sm font-semibold flex items-center gap-1 opacity-90 hidden lg:flex">
                <span>📍 {t('nav.deliverTo')}</span>
                <span className="font-bold truncate max-w-[120px] xl:max-w-[200px]">{selectedAddress?.name || 'Indrapuri Colony, Indore'}</span>
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
                  : getMithilakartHeaderBg(selectedCategory)
          }`}
        >


          {/* Restored HeaderTabs as requested */}
          <HeaderTabs />

          {/* Row 3 : Search + QR */}
          <SearchBar selectedAddress={selectedAddress} />
        </motion.header>
      )}

      {/* SaleBanner is now rendered inside Home.jsx or specifically based on visibility store */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-transparent relative z-10">
        <div className="flex-1 flex">
          <div className="w-full max-w-[1600px] mx-auto px-0 md:px-8 xl:px-12 flex h-full">
            <main className="flex-1 min-w-0 pb-4">
              <Outlet />
            </main>
          </div>
        </div>
        {location.pathname !== '/profile' && <Footer />}
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
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : (localStorage.getItem('isQuickShopFlow') === 'true' ? 'text-[#FF5C00]' : 'text-[#6FAE4A]')))
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
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : 'text-[#6FAE4A]')) 
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
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : 'text-[#6FAE4A]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={22} strokeWidth={2.2} />
            {cartCount > 0 && (
              <span className={`absolute -top-1.5 -right-2 text-[8px] font-black px-1 py-0.5 rounded-full ${badgeBg} text-white border border-[#FFF8EE]`}>
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] ${location.pathname === '/cart' ? 'font-black' : 'font-semibold'}`}>Cart</span>
        </Link>
        <Link 
          to="/profile" 
          className={`flex flex-col items-center transition-transform active:scale-90 ${
            location.pathname === '/profile' 
              ? ((localStorage.getItem('isMithilakFlow') === 'true' || location.pathname.includes('/mithilak')) 
                  ? 'text-[#207C8A]' 
                  : (localStorage.getItem('isFreshGroceryFlow') === 'true' ? 'text-[#D9A21B]' : 'text-[#6FAE4A]')) 
              : 'text-[#3F2A20]/80'
          }`}
        >
          <User size={22} strokeWidth={2.2} />
          <span className={`text-[10px] ${location.pathname === '/profile' ? 'font-black' : 'font-semibold'}`}>Account</span>
        </Link>
      </nav>
      )}

      {/* Floating Cart Pill (Shows on all pages when cart has items, except cart/checkout page) */}
      {shouldShowFloatingCart && cartTotalItems > 0 && (
        <div 
          onClick={() => navigate('/cart')}
          className={`fixed bottom-[76px] left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-[380px] md:px-6 md:py-4 md:rounded-2xl z-[1000] rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.15)] text-white cursor-pointer active:scale-[0.98] transition-all duration-300 animate-in slide-in-from-bottom-6 ${
            localStorage.getItem('isFreshGroceryFlow') === 'true'
              ? 'bg-[#D9A21B] hover:bg-[#c08f16]'
              : localStorage.getItem('isMithilakFlow') === 'true'
                ? 'bg-[#207C8A] hover:bg-[#1a6874]'
                  : localStorage.getItem('isQuickShopFlow') === 'true'
                    ? 'bg-gradient-to-r from-[#F26522] to-[#FF8C00] hover:brightness-110'
                  : 'bg-[#6FAE4A] hover:bg-[#5b953d]'
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
              ? 'bg-white text-[#F26522]'
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
