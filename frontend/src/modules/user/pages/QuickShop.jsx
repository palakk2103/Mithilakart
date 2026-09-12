import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ChevronDown, Search, Camera, Mic, ScanLine, Star, Home as HomeIcon, LayoutGrid, ShoppingCart, User, ChevronRight } from 'lucide-react';
import CategoryCard from '../components/vendor/CategoryCard';
import useVendorStore from '../../../store/useVendorStore';
import { getCategories, getNearbyProducts, getDeals } from '../services/catalogApi';
import { mapCategorySections, extractList, mapProductForCard } from '../utils/mappers';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const parseQuickShopPrice = (value) => {
  const n = parseInt(String(value ?? '').replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

// Import Assets
import SamsungS24 from '../../../assets/products/product01.jpg';
import EarbudsDeal from '../../../assets/products/product02.jpg';
import LorealShampoo from '../../../assets/products/product03.jpg';
import PlumShampoo from '../../../assets/products/product04.jpg';
import LipGloss from '../../../assets/products/product05.jpg';
import JewelleryImg from '../../../assets/products/product06.jpg';
import FashionHero from '../../../assets/products/product07.jpg';
import ElectronicsHero from '../../../assets/products/product08.jpg';
import MakeupHero from '../../../assets/products/product09.jpg';
import FashionTabProduct from '../../../assets/products/product10.jpg';
import ForYouProduct from '../../../assets/products/product11.webp';
import BeautyTab from '../../../assets/products/product12.jpg';
import ToysTab from '../../../assets/products/product13.jpg';
import StationeryTab from '../../../assets/products/product14.jpg';
import ClothesImg from '../../../assets/products/product15.webp';


// Custom SVG Icons for Grocery Redesign
const MithilaBannerSvg = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full max-h-[160px] md:max-h-[220px]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="90" fill="#F6C453" fillOpacity="0.15" />
    <circle cx="100" cy="100" r="80" stroke="#D9A21B" strokeWidth="1" strokeDasharray="4 4" />
    <path d="M20,100 C30,90 40,110 50,100" stroke="#6FAE4A" strokeWidth="1.5" fill="none" />
    <path d="M150,50 C160,40 170,60 180,50" stroke="#6FAE4A" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
    <path d="M80,180 C80,140 120,140 120,180 Z" fill="#F6C453" stroke="#3F2A20" strokeWidth="2" />
    <path d="M85,180 C95,145 105,145 115,180" stroke="#3F2A20" strokeWidth="1.5" />
    <path d="M88,145 C80,140 75,120 85,115 C95,110 105,120 102,135 Z" fill="#E25822" stroke="#3F2A20" strokeWidth="2" />
    <path d="M102,135 C115,125 125,110 130,135" stroke="#3F2A20" strokeWidth="2" />
    <path d="M110,135 C110,120 150,120 150,135 C150,145 110,145 110,135 Z" fill="#D9A21B" stroke="#3F2A20" strokeWidth="2" />
    <path d="M110,135 L150,135" stroke="#3F2A20" strokeWidth="1.5" />
    <circle cx="120" cy="125" r="10" fill="#6FAE4A" stroke="#3F2A20" strokeWidth="1.5" />
    <path d="M115,120 Q120,130 125,120" stroke="#3F2A20" strokeWidth="1" />
    <circle cx="132" cy="128" r="6" fill="#E25822" stroke="#3F2A20" strokeWidth="1.5" />
    <circle cx="142" cy="126" r="5" fill="#E25822" stroke="#3F2A20" strokeWidth="1.5" />
    <path d="M125,122 L132,115 L135,118 Z" fill="#F6C453" stroke="#3F2A20" strokeWidth="1.5" />
    <circle cx="95" cy="100" r="12" fill="#FFE8D6" stroke="#3F2A20" strokeWidth="2" />
    <path d="M107,100 C115,105 120,120 122,145" stroke="#3F2A20" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M92,88 Q105,88 107,102" fill="#3F2A20" />
    <circle cx="91" cy="100" r="1.5" fill="#3F2A20" />
    <path d="M88,103 Q90,105 92,103" stroke="#3F2A20" strokeWidth="1" fill="none" />
    <circle cx="88" cy="100" r="2.5" stroke="#D9A21B" strokeWidth="1" fill="none" />
    <path d="M98,122 C96,115 90,108 92,108" stroke="#3F2A20" strokeWidth="1.5" fill="none" />
    <circle cx="92" cy="108" r="2" fill="#E25822" />
  </svg>
);

const FruitsVeggiesIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="28" r="9" fill="#6FAE4A" />
    <circle cx="28" cy="26" r="9" fill="#E25822" />
    <path d="M18,19 C18,15 22,12 24,12" stroke="#3F2A20" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M28,17 C30,13 33,13 33,13" stroke="#3F2A20" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const DairyEggsIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="10" width="12" height="28" rx="2" fill="#93C5FD" stroke="#3F2A20" strokeWidth="2" />
    <circle cx="32" cy="26" r="7" fill="#FFF8EE" stroke="#3F2A20" strokeWidth="2" />
    <circle cx="32" cy="26" r="3.5" fill="#F6C453" />
    <line x1="18" y1="18" x2="18" y2="30" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const StaplesIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14,12 L34,12 L31,38 L17,38 Z" fill="#D9A21B" stroke="#3F2A20" strokeWidth="2" />
    <circle cx="24" cy="24" r="5" fill="#FFF" stroke="#3F2A20" strokeWidth="1.5" />
    <line x1="21" y1="24" x2="27" y2="24" stroke="#3F2A20" strokeWidth="1.5" />
  </svg>
);

const BeveragesIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="8" width="12" height="32" rx="3" fill="#6FAE4A" stroke="#3F2A20" strokeWidth="2" />
    <line x1="18" y1="18" x2="30" y2="18" stroke="#FFF" strokeWidth="2.5" />
    <circle cx="24" cy="28" r="3" fill="#FFF" />
  </svg>
);

const SnacksIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="10" width="24" height="28" rx="4" fill="#F6C453" stroke="#3F2A20" strokeWidth="2" />
    <circle cx="24" cy="24" r="5" fill="#E25822" />
  </svg>
);

const MasalaOilIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16,14 L32,14 L30,40 L18,40 Z" fill="#E25822" stroke="#3F2A20" strokeWidth="2" />
    <circle cx="24" cy="27" r="4.5" fill="#F6C453" stroke="#3F2A20" strokeWidth="1.5" />
  </svg>
);

const FrozenIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="14" width="20" height="20" rx="3" fill="#93C5FD" stroke="#3F2A20" strokeWidth="2" />
    <path d="M24,10 L24,38 M10,24 L38,24" stroke="#FFF" strokeWidth="2" />
  </svg>
);

const HouseholdIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18,18 L30,18 L34,38 L14,38 Z" fill="#FCA5A5" stroke="#3F2A20" strokeWidth="2" />
    <rect x="22" y="10" width="4" height="8" fill="#D1D5DB" stroke="#3F2A20" strokeWidth="1.5" />
  </svg>
);

const QuickShop = () => {
  const navigate = useNavigate();
  const { fetchHomeSections } = useVendorStore();
  const [categorySections, setCategorySections] = React.useState([]);
  const { location: liveLocation, setPromptOpen } = useLiveLocation();
  const [nearbyProducts, setNearbyProducts] = React.useState([]);
  const [nearbyLoading, setNearbyLoading] = React.useState(false);
  const [notDeliverable, setNotDeliverable] = React.useState(false);

  useEffect(() => {
    localStorage.setItem('isQuickShopFlow', 'true');
    fetchHomeSections('quick_shop');
  }, [fetchHomeSections]);

  useEffect(() => {
    let cancelled = false;

    getCategories({ commerceFlow: 'quick_shop' })
      .then((data) => {
        if (!cancelled) {
          setCategorySections(mapCategorySections(data, []));
        }
      })
      .catch(() => {
        if (!cancelled) setCategorySections([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (liveLocation?.latitude == null || liveLocation?.longitude == null) {
      setNearbyProducts([]);
      setNotDeliverable(true);
      return undefined;
    }

    setNearbyLoading(true);
    getNearbyProducts({
      lat: liveLocation.latitude,
      lng: liveLocation.longitude,
      commerceFlow: 'quick_shop',
      limit: 6,
    })
      .then((response) => {
        const payload = response?.data ?? response;
        const items = extractList(payload).map((p) => {
          const card = mapProductForCard(p);
          return {
            id: card.id,
            name: card.name || card.title,
            price: parseQuickShopPrice(card.price),
            oldPrice: parseQuickShopPrice(card.oldPrice || card.mrp),
            image: card.image,
            distanceKm: p.distanceKm,
          };
        });
        if (!cancelled) {
          setNearbyProducts(items);
          setNotDeliverable(payload?.deliverable === false || items.length === 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNearbyProducts([]);
          setNotDeliverable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [liveLocation?.latitude, liveLocation?.longitude]);

  // Simulated active tab for the filters
  const [activeFilter, setActiveFilter] = React.useState('All');

  // Real Flash Deals from backend
  const [activeFlashSale, setActiveFlashSale] = React.useState(null);
  const [flashDeals, setFlashDeals] = React.useState([]);
  const [dealsLoading, setDealsLoading] = React.useState(false);

  useEffect(() => {
    let cancelled = false;
    setDealsLoading(true);
    getDeals()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        const dealsList = Array.isArray(data) ? data : [];
        if (dealsList.length > 0) {
          const first = dealsList[0];
          setActiveFlashSale(first.sale || null);
          setFlashDeals(first.products || []);
        } else {
          setActiveFlashSale(null);
          setFlashDeals([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch flash deals:', err);
        if (!cancelled) {
          setActiveFlashSale(null);
          setFlashDeals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDealsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Timer: real endsAt countdown with smooth fallback
  const [timeLeft, setTimeLeft] = React.useState({ h: '02', m: '45', s: '12' });
  React.useEffect(() => {
    const updateTimer = () => {
      if (activeFlashSale?.endsAt) {
        const diff = new Date(activeFlashSale.endsAt).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft({ h: '00', m: '00', s: '00' });
          return;
        }
        const totalSec = Math.floor(diff / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        setTimeLeft({
          h: String(h).padStart(2, '0'),
          m: String(m).padStart(2, '0'),
          s: String(s).padStart(2, '0'),
        });
      } else {
        setTimeLeft((prev) => {
          const s = parseInt(prev.s, 10) - 1;
          if (s >= 0) return { ...prev, s: String(s).padStart(2, '0') };
          const m = parseInt(prev.m, 10) - 1;
          if (m >= 0) return { ...prev, m: String(m).padStart(2, '0'), s: '59' };
          const h = parseInt(prev.h, 10) - 1;
          if (h >= 0) return { h: String(h).padStart(2, '0'), m: '59', s: '59' };
          return { h: '02', m: '45', s: '12' };
        });
      }
    };

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeFlashSale?.endsAt]);

  const isFreshGrocery = window.location.pathname.includes('/fresh-grocery');

  if (isFreshGrocery) {
    return (
      <div className="min-h-screen pb-24 bg-[#FFF8EE] flex flex-col font-sans text-[#3F2A20] relative overflow-x-hidden">
        
        {/* Repeating Mithila Art Page Background Texture */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />

        <div className="relative z-10 flex flex-col">
          {/* Banner Section */}
          <div className="mx-4 my-4 p-5 rounded-3xl border border-[#F6C453]/35 flex items-center justify-between shadow-xs overflow-hidden relative" style={{ backgroundImage: 'linear-gradient(135deg, #FFFDF8 0%, #FFF9F2 100%)' }}>
            <div className="flex-1 z-10 pr-2">
              <h1 className="text-[20px] font-black text-[#3F2A20] leading-tight mb-1">Freshness You Can Trust</h1>
              <p className="text-[12px] font-bold text-[#3F2A20]/75 mb-4">Farm Fresh Products</p>
              <button className="bg-[#6FAE4A] text-white text-[12px] font-black px-6 py-2.5 rounded-full shadow-md active:scale-95 transition-transform hover:brightness-105">
                Shop Now
              </button>
            </div>
            <div className="w-[130px] h-[130px] flex items-center justify-center flex-shrink-0 relative">
              <MithilaBannerSvg />
            </div>
          </div>

          {/* Categories Grid (2 Rows, 4 Columns) */}
          <div className="px-4 mb-6">
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { name: 'Fruits & Veggies', label: 'Fruits & Veggies', key: 'Fruits & Vegetables' },
                { name: 'Dairy & eggs', label: 'Dairy & eggs', key: 'Dairy, Bread & Eggs' },
                { name: 'Staples', label: 'Staples', key: 'Atta, Rice & Dal' },
                { name: 'Beverages', label: 'Beverages', key: 'Drinks & Juices' },
                { name: 'Snacks', label: 'Snacks', key: 'Chips & Namkeens' },
                { name: 'Masala & Oil', label: 'Masala & Oil', key: 'Oil, Ghee & Masala' },
                { name: 'Frozen', label: 'Frozen', key: 'Instant & Frozen Food' },
                { name: 'Household', label: 'Household', key: 'Cleaning Essentials' },
              ].map((cat, idx) => {
                let iconComponent = <FruitsVeggiesIcon />;
                if (cat.name === 'Dairy & eggs') iconComponent = <DairyEggsIcon />;
                if (cat.name === 'Staples') iconComponent = <StaplesIcon />;
                if (cat.name === 'Beverages') iconComponent = <BeveragesIcon />;
                if (cat.name === 'Snacks') iconComponent = <SnacksIcon />;
                if (cat.name === 'Masala & Oil') iconComponent = <MasalaOilIcon />;
                if (cat.name === 'Frozen') iconComponent = <FrozenIcon />;
                if (cat.name === 'Household') iconComponent = <HouseholdIcon />;

                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      localStorage.setItem('isFreshGroceryFlow', 'true');
                      navigate('/fresh-grocery/category', { state: { category: cat.key } });
                    }}
                    className="bg-white border border-[#EADCC9]/55 rounded-2xl p-2 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-[#D9A21B]"
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-1.5 bg-[#FFF8EE] rounded-xl">
                      {iconComponent}
                    </div>
                    <span className="text-[10px] md:text-[11px] font-black text-[#3F2A20] leading-tight">{cat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Best Offers */}
          <div className="px-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-black text-[#3F2A20] tracking-tight">Today's Best Offers</h2>
              <span className="text-[#6FAE4A] text-[12.5px] font-black cursor-pointer hover:underline">View All</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {nearbyProducts.slice(0, 3).map((prod) => {
                const discount = prod.oldPrice > prod.price
                  ? `${Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)}% OFF`
                  : null;
                return (
                  <div 
                    key={prod.id}
                    onClick={() => navigate(`/product-detail/${prod.id}`, { state: { product: prod } })}
                    className="bg-white rounded-2xl border border-[#EADCC9]/30 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform shadow-xs"
                  >
                    {discount && (
                      <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none">
                        {discount}
                      </div>
                    )}

                    <div className="h-20 flex items-center justify-center my-3">
                      <img 
                        src={getImageUrl(prod.image)} 
                        alt={prod.name} 
                        className="max-h-full max-w-full object-contain rounded-lg" 
                        onError={handleImageError}
                      />
                    </div>

                    <div>
                      <h3 className="text-[11.5px] font-black text-[#3F2A20] leading-tight truncate">{prod.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        {prod.oldPrice > prod.price && (
                          <span className="text-[9.5px] text-[#3F2A20]/45 line-through">₹{prod.oldPrice}</span>
                        )}
                        <span className="text-[12.5px] font-black text-[#3F2A20]">₹{prod.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {nearbyProducts.length === 0 && (
                <div className="col-span-3 text-center py-6 px-3 bg-white/60 rounded-xl border border-dashed border-[#EADCC9]">
                  <p className="text-[11.5px] font-bold text-[#3F2A20]/70">
                    {notDeliverable ? 'Share location to see offers from nearby stores' : 'Loading best offers...'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── HORIZONTAL FILTER TABS BAR ── */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-3.5 px-4 mb-4">
            {['All', 'Title Sponsors', 'Intel Core', 'AI Nova', 'Boat'].map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-black tracking-tight transition-all duration-200 border ${
                    isActive
                      ? 'bg-[#D9A21B] border-[#D9A21B] text-white shadow-xs'
                      : 'bg-white border-[#EADCC9]/55 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* ── FLASH DEALS SECTION ── */}
          <div className="bg-white rounded-[24px] p-4 mx-4 mb-4 border border-[#FFF1EB] shadow-[0_4px_20px_rgba(217,162,27,0.015)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-black text-[#3F2A20] tracking-tight">{activeFlashSale?.title || 'Flash Deals'}</h2>
              <div className="text-slate-850 text-[12.5px] font-black flex items-center gap-1.5">
                <span>Ends in</span>
                <span className="font-mono bg-[#3F2A20] text-white px-1.5 py-0.5 rounded text-[11px]">{timeLeft.h}</span>
                <span>:</span>
                <span className="font-mono bg-[#3F2A20] text-white px-1.5 py-0.5 rounded text-[11px]">{timeLeft.m}</span>
                <span>:</span>
                <span className="font-mono bg-[#3F2A20] text-white px-1.5 py-0.5 rounded text-[11px]">{timeLeft.s}</span>
              </div>
            </div>

            {/* Flash Deals Cards grid */}
            {dealsLoading && (
              <p className="text-center text-[11px] text-slate-500 py-6">Loading flash deals...</p>
            )}

            {!dealsLoading && flashDeals.length === 0 && (
              <div className="text-center py-6 px-4 bg-[#FFF8EE]/50 rounded-xl border border-dashed border-[#EADCC9]">
                <p className="text-[12px] font-bold text-[#3F2A20]/70">No active flash deals at the moment.</p>
                <p className="text-[10px] text-[#3F2A20]/50 mt-1">Check back soon for exclusive limited-time discounts!</p>
              </div>
            )}

            {!dealsLoading && flashDeals.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {flashDeals.map((prod) => (
                  <div 
                    key={prod.id || prod.productId}
                    onClick={() => navigate(`/product-detail/${prod.productId || prod.id}`, { 
                      state: { 
                        product: { 
                          ...prod,
                          id: prod.productId || prod.id,
                          productId: prod.productId || prod.id,
                          marketplaceTab: 'quick_shop',
                        } 
                      } 
                    })}
                    className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
                  >
                    {prod.discount && (
                      <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none z-10">
                        {prod.discount}
                      </div>
                    )}
                    
                    <div className="h-20 flex items-center justify-center my-3">
                      <img 
                        src={getImageUrl(prod.image)} 
                        alt={prod.title || prod.name} 
                        className="max-h-full object-contain mix-blend-multiply" 
                        onError={handleImageError}
                      />
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5 truncate">{prod.title || prod.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        {prod.oldPrice > prod.price && (
                          <span className="text-[10px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                        )}
                        <span className="text-[12px] font-black text-slate-900">₹{prod.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SHARE LOCATION BANNER ── */}
          <div className="bg-[#FFF8EE] border border-[#EADCC9]/55 rounded-[20px] p-4 mx-4 mb-4 flex items-center justify-between shadow-2xs">
            <div className="flex flex-col gap-3 flex-1 pr-2">
              <span className="text-[12.5px] font-extrabold text-[#3F2A20] leading-snug">
                Share your location to access Grocery & explore offers
              </span>
              <button className="bg-[#D9A21B] text-white text-[11.5px] font-black px-4 py-2 rounded-xl w-fit active:scale-95 transition-transform shadow-xs">
                Share Location
              </button>
            </div>
            <ChevronDown size={20} className="text-slate-550 flex-shrink-0 cursor-pointer" />
          </div>

          {/* ── TODAY'S SPECIAL DEALS ── */}
          <div className="bg-white rounded-[24px] p-4 mx-4 mb-6 border border-[#FFF1EB] shadow-[0_4px_20px_rgba(217,162,27,0.015)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-black text-[#3F2A20] tracking-tight">Today's Special Deals</h2>
              <span className="text-[#6FAE4A] text-[12.5px] font-black cursor-pointer hover:underline">View All</span>
            </div>

            {/* Deals grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {(nearbyProducts.length > 3 ? nearbyProducts.slice(3, 6) : nearbyProducts.slice(0, 3)).map((prod) => {
                const discount = prod.oldPrice > prod.price
                  ? `${Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)}% OFF`
                  : null;
                return (
                  <div 
                    key={prod.id}
                    onClick={() => navigate(`/product-detail/${prod.id}`, { state: { product: prod } })}
                    className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
                  >
                    {discount && (
                      <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none z-10">
                        {discount}
                      </div>
                    )}
                    
                    <div className="h-20 flex items-center justify-center my-3">
                      <img 
                        src={getImageUrl(prod.image)} 
                        alt={prod.name} 
                        className="max-h-full object-contain mix-blend-multiply" 
                        onError={handleImageError}
                      />
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5 truncate">{prod.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        {prod.oldPrice > prod.price && (
                          <span className="text-[10px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                        )}
                        <span className="text-[12px] font-black text-slate-900">₹{prod.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {nearbyProducts.length === 0 && (
                <div className="col-span-3 text-center py-6 px-3 bg-[#FFF8EE]/50 rounded-xl border border-dashed border-[#EADCC9]">
                  <p className="text-[11.5px] font-bold text-[#3F2A20]/70">
                    {notDeliverable ? 'Share location to explore special deals near you' : 'No deals available right now'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── RESTORED CATEGORY SECTIONS (Mobile View) ── */}
          <div className="md:hidden px-4 space-y-8">
            {categorySections.map((section, sIdx) => (
              <div key={sIdx} className="mb-6">
                <h2 className="text-[15px] font-extrabold text-[#D9A21B] mb-3 tracking-tight pl-1">
                  {section.title}
                </h2>
                <div className="grid grid-cols-4 gap-2 justify-items-center">
                  {section.items.map((item, itemIdx) => (
                    <CategoryCard
                      key={itemIdx}
                      item={item}
                      onClick={() => {
                        localStorage.setItem('isFreshGroceryFlow', 'true');
                        navigate('/fresh-grocery/category', { state: { category: item.name } });
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── RESTORED CATEGORY SECTIONS (Desktop View) ── */}
          <div className="hidden md:block md:max-w-[1600px] md:mx-auto md:px-4 md:py-6 space-y-8">
            {categorySections.map((section, sIdx) => (
              <div key={sIdx} className="flex flex-col">
                {/* Header Banner */}
                <div className="px-6 py-3.5 rounded-t-3xl flex items-center justify-between shadow-sm text-white bg-[#D9A21B]">
                  <h2 className="text-[15px] font-black uppercase tracking-wider">
                    {section.title}
                  </h2>
                </div>
            
                {/* White container panel containing the category cards */}
                <div className="bg-white border-x border-b border-slate-100 rounded-b-3xl p-6 shadow-md">
                  <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-8 gap-y-8 justify-items-center">
                    {section.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        onClick={() => {
                          localStorage.setItem('isFreshGroceryFlow', 'true');
                          navigate('/fresh-grocery/category', { state: { category: item.name } });
                        }}
                        className="flex flex-col items-center gap-3.5 cursor-pointer group active:scale-95 transition-transform w-full max-w-[160px]"
                      >
                        {/* Image container */}
                        <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-slate-50 border border-slate-100/60 flex items-center justify-center p-0 group-hover:bg-slate-100/65 transition-colors duration-300">
                          <img
                            src={getImageUrl(item.img)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={handleImageError}
                          />
                        </div>
                        <span className="text-[13px] font-black text-center text-[#3F2A20] leading-tight tracking-tight mt-1 group-hover:text-[#D9A21B] transition-colors">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 bg-[#FFF9F5] flex flex-col font-sans text-slate-800 relative">
      
      {/* Repeating Mithila Art Page Background Texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
        style={{
          backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
          backgroundSize: '360px',
        }}
      />

      <div className="relative z-10 flex flex-col">
        {/* ── HORIZONTAL FILTER TABS BAR ── */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-3.5 px-4">
          {['All', 'Title Sponsors', 'Intel Core', 'AI Nova', 'Boat'].map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-black tracking-tight transition-all duration-200 border ${
              isActive
                    ? 'bg-[#F26522] border-[#F26522] text-white shadow-xs'
                    : 'bg-white border-[#EADCC9]/55 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

      {/* ── FLASH DEALS SECTION ── */}
      <div className="bg-white rounded-2xl p-3 mx-3 mb-3 border border-[#FFF1EB] shadow-[0_4px_20px_rgba(242,101,34,0.015)]">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className="text-[14.5px] font-black text-slate-800 tracking-tight">Flash Deals</h2>
          <div className="text-slate-850 text-[11px] font-black flex items-center gap-1">
            <span>Ends in</span>
            <span className="font-mono bg-slate-900 text-white px-1 py-0.5 rounded text-[9.5px]">{timeLeft.h}</span>
            <span>:</span>
            <span className="font-mono bg-slate-900 text-white px-1 py-0.5 rounded text-[9.5px]">{timeLeft.m}</span>
            <span>:</span>
            <span className="font-mono bg-slate-900 text-white px-1 py-0.5 rounded text-[9.5px]">{timeLeft.s}</span>
          </div>
        </div>

        {/* Flash Deals Cards grid — nearby Quick Commerce products */}
        {notDeliverable && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-[11px] font-bold text-amber-900">
              {liveLocation?.latitude == null
                ? 'Share your location to see products from nearby sellers.'
                : 'Quick Commerce is not available at this address yet.'}
            </p>
            {liveLocation?.latitude == null && (
              <button
                type="button"
                onClick={() => setPromptOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#FF5C00] text-white text-[10px] font-black"
              >
                Share Location
              </button>
            )}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {nearbyLoading && (
            <p className="col-span-3 text-center text-[10px] text-slate-500 py-4">Loading nearby products…</p>
          )}
          {!nearbyLoading && nearbyProducts.slice(0, 3).map((product) => {
            const discount = product.oldPrice > product.price
              ? `${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF`
              : null;
            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product-detail/${product.id}`, { state: { product } })}
                className="bg-white rounded-xl border border-slate-100 p-1.5 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                {discount && (
                  <div className="absolute top-1 left-1 bg-[#FF5C00] text-white text-[7.5px] font-black px-1.2 py-0.3 rounded-xs shadow-2xs leading-none z-10">
                    {discount}
                  </div>
                )}
                <div className="h-14 flex items-center justify-center my-1.5">
                  <img src={getImageUrl(product.image)} alt={product.name} className="max-h-full object-contain mix-blend-multiply" onError={handleImageError} />
                </div>
                <div>
                  {product.distanceKm != null && (
                    <span className="text-slate-400 text-[8px] font-bold">{product.distanceKm.toFixed(1)} km</span>
                  )}
                  <h3 className="text-[10px] font-black text-slate-850 leading-tight mt-0.5 line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    {product.oldPrice > product.price && (
                      <span className="text-[9px] text-slate-400 line-through">₹{product.oldPrice}</span>
                    )}
                    <span className="text-[11px] font-black text-slate-900">₹{product.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SHARE LOCATION BANNER ── */}
      <div className="bg-[#FFF5EE] border border-[#FFD9C7]/40 rounded-[20px] p-4 mx-4 mb-4 flex items-center justify-between shadow-2xs">
        <div className="flex flex-col gap-3 flex-1 pr-2">
          <span className="text-[12.5px] font-extrabold text-slate-800 leading-snug">
            Share your location to access QuickShop & explore offers
          </span>
          <button
            type="button"
            onClick={() => setPromptOpen(true)}
            className="bg-[#FF5C00] text-white text-[11.5px] font-black px-4 py-2 rounded-xl w-fit active:scale-95 transition-transform shadow-xs"
          >
            Share Location
          </button>
        </div>
        <ChevronDown size={20} className="text-slate-500 flex-shrink-0 cursor-pointer" />
      </div>

      {/* ── TODAY'S SPECIAL DEALS ── */}
      <div className="bg-white rounded-[24px] p-4 mx-4 mb-6 border border-[#FFF1EB] shadow-[0_4px_20px_rgba(242,101,34,0.015)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[16px] font-black text-slate-800 tracking-tight">Today's Special Deals</h2>
          <span className="text-[#A63A00] text-[12.5px] font-black cursor-pointer hover:underline">View All</span>
        </div>

        {/* Deals grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {(nearbyProducts.length > 3 ? nearbyProducts.slice(3, 6) : nearbyProducts.slice(0, 3)).map((prod) => {
            const discount = prod.oldPrice > prod.price
              ? `${Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)}% OFF`
              : null;
            return (
              <div 
                key={prod.id}
                onClick={() => navigate(`/product-detail/${prod.id}`, { state: { product: prod } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                {discount && (
                  <div className="absolute top-1.5 left-1.5 bg-[#FF5C00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none z-10">
                    {discount}
                  </div>
                )}
                
                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src={getImageUrl(prod.image)} 
                    alt={prod.name} 
                    className="max-h-full object-contain mix-blend-multiply" 
                    onError={handleImageError}
                  />
                </div>

                <div>
                  <h3 className="text-[11px] font-black text-slate-850 leading-tight mt-0.5 truncate">{prod.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    {prod.oldPrice > prod.price && (
                      <span className="text-[10px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                    )}
                    <span className="text-[12px] font-black text-slate-900">₹{prod.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {nearbyProducts.length === 0 && (
            <div className="col-span-3 text-center py-6 px-3 bg-[#FFF5EE] rounded-xl border border-dashed border-[#FFD9C7]">
              <p className="text-[11.5px] font-bold text-slate-700">
                {notDeliverable ? 'Share location to explore special deals in your area' : 'No deals available right now'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── RESTORED CATEGORY SECTIONS (Mobile View) ── */}
      <div className="md:hidden px-4 space-y-8">
        {categorySections.map((section, sIdx) => (
          <div key={sIdx} className="mb-6">
            <h2 className="text-[15px] font-extrabold text-[#F26522] mb-3 tracking-tight pl-1">
              {section.title}
            </h2>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              {section.items.map((item, itemIdx) => (
                <CategoryCard
                  key={itemIdx}
                  item={item}
                  onClick={() => {
                    localStorage.setItem('isQuickShopFlow', 'true');
                    navigate(isFreshGrocery ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: item.name } });
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── RESTORED CATEGORY SECTIONS (Desktop View) ── */}
      <div className="hidden md:block md:max-w-[1600px] md:mx-auto md:px-4 md:py-6 space-y-8">
        {categorySections.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col">
            {/* Header Banner */}
            <div className={`px-6 py-3.5 rounded-t-3xl flex items-center justify-between shadow-sm text-white bg-[#F26522]`}>
              <h2 className="text-[15px] font-black uppercase tracking-wider">
                {section.title}
              </h2>
            </div>
 
            {/* White container panel containing the category cards */}
            <div className="bg-white border-x border-b border-slate-100 rounded-b-3xl p-6 shadow-md">
              <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-8 gap-y-8 justify-items-center">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={() => {
                      localStorage.setItem('isQuickShopFlow', 'true');
                      navigate(isFreshGrocery ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: item.name } });
                    }}
                    className="flex flex-col items-center gap-3.5 cursor-pointer group active:scale-95 transition-transform w-full max-w-[160px]"
                  >
                    {/* Image container */}
                    <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-slate-50 border border-slate-100/60 flex items-center justify-center p-0 group-hover:bg-slate-100/65 transition-colors duration-300">
                      <img
                        src={getImageUrl(item.img)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>
                    <span className="text-[13px] font-black text-center text-slate-850 leading-tight tracking-tight mt-1 group-hover:text-[#F26522] transition-colors">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      </div>
    </div>
  );
};

export default QuickShop;
