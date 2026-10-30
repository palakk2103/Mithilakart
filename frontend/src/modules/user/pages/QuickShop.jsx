import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, ChevronDown, Search, Camera, Mic, ScanLine, Star, Home as HomeIcon, LayoutGrid, ShoppingCart, User, ChevronRight, Zap } from 'lucide-react';
import CategoryCard from '../components/vendor/CategoryCard';
import useVendorStore from '../../../store/useVendorStore';
import useAccountStore from '../../../store/useAccountStore';
import { getCategories, getNearbyProducts, getDeals, getProducts } from '../services/catalogApi';
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

/** Fallback artwork for a grocery category that has no image uploaded yet. */
const GROCERY_ICON_RULES = [
  [/fruit|veg|vegetable|green/i, FruitsVeggiesIcon],
  [/dairy|egg|milk|bread|bakery|paneer/i, DairyEggsIcon],
  [/staple|atta|rice|dal|flour|pulse/i, StaplesIcon],
  [/beverage|drink|juice|tea|coffee/i, BeveragesIcon],
  [/snack|chip|namkeen|biscuit/i, SnacksIcon],
  [/masala|oil|ghee|spice/i, MasalaOilIcon],
  [/frozen|ice|instant/i, FrozenIcon],
  [/household|clean|home|detergent/i, HouseholdIcon],
];

const GroceryCategoryIcon = ({ category }) => {
  const [failed, setFailed] = React.useState(false);
  const src = category.iconUrl || category.imageUrl;
  if (src && !failed) {
    return <img src={getImageUrl(src)} alt="" className="w-10 h-10 object-contain" onError={() => setFailed(true)} />;
  }
  const Icon = GROCERY_ICON_RULES.find(([pattern]) => pattern.test(category.name))?.[1];
  if (Icon) return <Icon />;
  return <span className="text-[18px] font-black text-[#D9A21B]">{category.name.charAt(0).toUpperCase()}</span>;
};

// In-memory cache across tab switches to render instantly and eliminate page blinking
const quickShopDataCache = {
  quick_shop: {
    categoryTree: null,
    categorySections: null,
  },
  groceries_fresh: {
    categoryTree: null,
    categorySections: null,
  },
  nearbyProducts: {},
};

const CountdownTimer = React.memo(({ endsAt }) => {
  const [timeLeft, setTimeLeft] = React.useState({ h: '02', m: '45', s: '12' });
  React.useEffect(() => {
    const updateTimer = () => {
      if (endsAt) {
        const diff = new Date(endsAt).getTime() - Date.now();
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
  }, [endsAt]);

  return (
    <div className="text-slate-850 text-[11px] font-black flex items-center gap-1">
      <span>Ends in</span>
      <span className="font-mono bg-slate-900 text-white px-1 py-0.5 rounded text-[9.5px]">{timeLeft.h}</span>
      <span>:</span>
      <span className="font-mono bg-slate-900 text-white px-1 py-0.5 rounded text-[9.5px]">{timeLeft.m}</span>
      <span>:</span>
      <span className="font-mono bg-slate-900 text-white px-1 py-0.5 rounded text-[9.5px]">{timeLeft.s}</span>
    </div>
  );
});

const QuickShop = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Same component serves /quick-shop and /fresh-grocery; React Router keeps the
  // instance when switching between them, so everything below keys off this.
  const isFreshGrocery = pathname.includes('/fresh-grocery');
  const marketplaceTab = isFreshGrocery ? 'groceries_fresh' : 'quick_shop';

  const { location: liveLocation, setPromptOpen } = useLiveLocation();
  const { savedAddresses, selectedAddressId } = useAccountStore();
  const selectedAddr = savedAddresses?.find((a) => a.id === selectedAddressId) || savedAddresses?.[0];
  const effectiveLat = liveLocation?.latitude ?? selectedAddr?.latitude ?? 28.5385859;
  const effectiveLng = liveLocation?.longitude ?? selectedAddr?.longitude ?? 77.1182734;

  const roundedLat = effectiveLat ? Number(Number(effectiveLat).toFixed(2)) : 28.54;
  const roundedLng = effectiveLng ? Number(Number(effectiveLng).toFixed(2)) : 77.12;

  const cachedCatTree = quickShopDataCache[marketplaceTab]?.categoryTree;
  const cachedCatSections = quickShopDataCache[marketplaceTab]?.categorySections;
  const [categorySections, setCategorySections] = React.useState(() => cachedCatSections || []);
  const [categoryTree, setCategoryTree] = React.useState(() => cachedCatTree || []);
  const [categoriesLoading, setCategoriesLoading] = React.useState(() => !cachedCatSections);

  const locKey = `${roundedLat}_${roundedLng}_${isFreshGrocery ? 'fresh' : 'quick'}`;
  const cachedNearby = quickShopDataCache.nearbyProducts[locKey];
  const [nearbyProducts, setNearbyProducts] = React.useState(() => cachedNearby || []);
  const [nearbyLoading, setNearbyLoading] = React.useState(() => !cachedNearby);
  const [notDeliverable, setNotDeliverable] = React.useState(false);

  useEffect(() => {
    let cancelled = false;

    // Only show skeleton if not already cached
    if (!quickShopDataCache[marketplaceTab]?.categorySections) {
      setCategoriesLoading(true);
    }

    getCategories({ marketplaceTab })
      .then((data) => {
        if (!cancelled) {
          const list = extractList(data);
          const sections = mapCategorySections(data, []);
          quickShopDataCache[marketplaceTab] = {
            categoryTree: list,
            categorySections: sections,
          };
          setCategoryTree(list);
          setCategorySections(sections);
        }
      })
      .catch(() => {
        if (!cancelled && !quickShopDataCache[marketplaceTab]?.categorySections) {
          setCategoryTree([]);
          setCategorySections([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [marketplaceTab]);

  useEffect(() => {
    let cancelled = false;

    // Only set loading if no cached data yet
    if (!quickShopDataCache.nearbyProducts[locKey] && nearbyProducts.length === 0) {
      setNearbyLoading(true);
    }

    const fetchProducts = async () => {
      try {
        const response = await getNearbyProducts({
          lat: roundedLat,
          lng: roundedLng,
          commerceFlow: isFreshGrocery ? 'fresh_grocery' : 'quick_shop',
          limit: 12,
        });
        const payload = response?.data ?? response;
        let items = extractList(payload).map((p) => {
          const card = mapProductForCard(p);
          return {
            id: card.id,
            name: card.name || card.title,
            price: parseQuickShopPrice(card.price),
            oldPrice: parseQuickShopPrice(card.oldPrice || card.mrp),
            image: card.image,
            distanceKm: p.distanceKm,
            deliveryEtaText: p.deliveryEtaText || (p.deliveryPromiseMinutes ? `${p.deliveryPromiseMinutes} mins` : '15-25 mins'),
          };
        });

        // If hyper-local seller has no items in this radius, seamlessly fallback to quick commerce catalog
        if (items.length === 0) {
          const fallbackRes = await getProducts({
            commerceFlow: isFreshGrocery ? 'fresh_grocery' : 'quick_shop',
            limit: 12,
          });
          const fallbackList = extractList(fallbackRes?.data ?? fallbackRes);
          if (fallbackList.length > 0) {
            items = fallbackList.map((p) => {
              const card = mapProductForCard(p);
              return {
                id: card.id,
                name: card.name || card.title,
                price: parseQuickShopPrice(card.price),
                oldPrice: parseQuickShopPrice(card.oldPrice || card.mrp),
                image: card.image,
                distanceKm: null,
                deliveryEtaText: '15-30 mins',
              };
            });
          }
        }

        if (!cancelled && items.length > 0) {
          quickShopDataCache.nearbyProducts[locKey] = items;
          setNearbyProducts(items);
          setNotDeliverable(false);
        }
      } catch {
        if (!cancelled && nearbyProducts.length === 0) {
          try {
            const fallbackRes = await getProducts({
              commerceFlow: isFreshGrocery ? 'fresh_grocery' : 'quick_shop',
              limit: 12,
            });
            const fallbackList = extractList(fallbackRes?.data ?? fallbackRes);
            const fallbackItems = fallbackList.map((p) => {
              const card = mapProductForCard(p);
              return {
                id: card.id,
                name: card.name || card.title,
                price: parseQuickShopPrice(card.price),
                oldPrice: parseQuickShopPrice(card.oldPrice || card.mrp),
                image: card.image,
                distanceKm: null,
                deliveryEtaText: '15-30 mins',
              };
            });
            if (!cancelled && fallbackItems.length > 0) {
              setNearbyProducts(fallbackItems);
            }
          } catch {
            // Keep graceful fallback
          }
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [roundedLat, roundedLng, isFreshGrocery, locKey]);

  // Active filter tab
  const [activeFilter, setActiveFilter] = React.useState('All');
  const filterTabs = React.useMemo(() => {
    const catNames = categoryTree.slice(0, 6).map((c) => c.name);
    return ['All', ...catNames];
  }, [categoryTree]);

  const displayedNearby = React.useMemo(() => {
    if (!activeFilter || activeFilter === 'All') return nearbyProducts;
    return nearbyProducts.filter((p) => {
      const matchCat = categoryTree.find((c) => c.name === activeFilter);
      if (matchCat && p.categoryId) {
        return String(p.categoryId) === String(matchCat.id);
      }
      return (p.name || '').toLowerCase().includes(activeFilter.toLowerCase());
    });
  }, [nearbyProducts, activeFilter, categoryTree]);

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

          {/* Categories Grid — the Fresh & Groceries tab's top-level categories from admin */}
          <div className="px-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-black text-[#3F2A20] tracking-tight">Browse by Category</h2>
              <span
                onClick={() => {
                  localStorage.setItem('isFreshGroceryFlow', 'true');
                  localStorage.setItem('isQuickShopFlow', 'false');
                  localStorage.setItem('isMithilakFlow', 'false');
                  navigate('/categories?flow=freshgrocery', { state: { flow: 'freshgrocery' } });
                }}
                className="text-[#6FAE4A] text-[12.5px] font-black cursor-pointer hover:underline"
              >
                View All
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {categoriesLoading && Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-[92px] bg-white/70 border border-[#EADCC9]/40 rounded-2xl animate-pulse" />
              ))}
              {!categoriesLoading && categoryTree.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    localStorage.setItem('isFreshGroceryFlow', 'true');
                    navigate('/fresh-grocery/category', { state: { category: cat.name, categoryId: cat.id } });
                  }}
                  className="bg-white border border-[#EADCC9]/55 rounded-2xl p-2 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-[#D9A21B]"
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1.5 bg-[#FFF8EE] rounded-xl overflow-hidden">
                    <GroceryCategoryIcon category={cat} />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-black text-[#3F2A20] leading-tight line-clamp-2">{cat.name}</span>
                </div>
              ))}
              {!categoriesLoading && categoryTree.length === 0 && (
                <div className="col-span-4 text-center py-6 px-3 bg-white/60 rounded-xl border border-dashed border-[#EADCC9]">
                  <p className="text-[11.5px] font-bold text-[#3F2A20]/70">Categories are coming soon</p>
                </div>
              )}
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
            {filterTabs.map((tab) => {
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
              <CountdownTimer endsAt={activeFlashSale?.endsAt} />
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
                        navigate('/fresh-grocery/category', { state: { category: item.name, categoryId: item.id } });
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
                          navigate('/fresh-grocery/category', { state: { category: item.name, categoryId: item.id } });
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
        {/* ── HERO BANNER SECTION ── */}
        <div
          className="mx-4 my-4 p-5 rounded-3xl border border-[#FFD9C7] flex items-center justify-between shadow-xs overflow-hidden relative"
          style={{ backgroundImage: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' }}
        >
          <div className="flex-1 z-10 pr-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F26522]/10 text-[#F26522] text-[10px] font-black uppercase tracking-wider mb-1.5">
              <Zap size={11} className="fill-[#F26522]" /> Delivery in 15-30 Mins
            </div>
            <h1 className="text-[19px] md:text-[22px] font-black text-slate-900 leading-tight mb-1">
              Quick Shop Essentials
            </h1>
            <p className="text-[11.5px] md:text-[12.5px] font-bold text-slate-600 mb-3">
              Groceries, Snacks & Daily Needs At Lightning Speed
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('quick-categories-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#F26522] text-white text-[12px] font-black px-6 py-2.5 rounded-full shadow-md active:scale-95 transition-transform hover:brightness-105"
            >
              Explore Categories
            </button>
          </div>
          <div className="w-[110px] h-[110px] md:w-[130px] md:h-[130px] flex items-center justify-center flex-shrink-0 relative">
            <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="50" fill="#FFEDD5" />
              <circle cx="60" cy="60" r="42" fill="#FED7AA" fillOpacity="0.4" />
              <path d="M40 70 L55 35 L70 35 L58 55 L75 55 L48 90 L54 68 Z" fill="#F26522" />
            </svg>
          </div>
        </div>

        {/* ── BROWSE BY CATEGORY GRID ── */}
        <div id="quick-categories-grid" className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">Browse by Category</h2>
            <span
              onClick={() => {
                localStorage.setItem('isQuickShopFlow', 'true');
                navigate('/quick-shop/category');
              }}
              className="text-[#F26522] text-[12.5px] font-black cursor-pointer hover:underline"
            >
              View All
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {categoriesLoading && Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-[92px] bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
            {!categoriesLoading && categoryTree.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  localStorage.setItem('isQuickShopFlow', 'true');
                  navigate('/quick-shop/category', { state: { category: cat.name, categoryId: cat.id } });
                }}
                className="bg-white border border-[#FFD9C7]/60 rounded-2xl p-2 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-[#F26522]"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-1.5 bg-[#FFF7ED] rounded-xl overflow-hidden p-1">
                  {cat.imageUrl || cat.iconUrl ? (
                    <img src={getImageUrl(cat.imageUrl || cat.iconUrl)} alt={cat.name} className="w-full h-full object-contain" onError={handleImageError} />
                  ) : (
                    <GroceryCategoryIcon category={cat} />
                  )}
                </div>
                <span className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight line-clamp-2">{cat.name}</span>
              </div>
            ))}
            {!categoriesLoading && categoryTree.length === 0 && (
              <div className="col-span-4 text-center py-6 px-3 bg-white/60 rounded-xl border border-dashed border-[#FFD9C7]">
                <p className="text-[11.5px] font-bold text-slate-600">Categories coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* ── TODAY'S BEST OFFERS ── */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">Today's Best Offers</h2>
            <span
              onClick={() => {
                localStorage.setItem('isQuickShopFlow', 'true');
                navigate('/quick-shop/category');
              }}
              className="text-[#F26522] text-[12.5px] font-black cursor-pointer hover:underline"
            >
              View All
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {nearbyLoading && nearbyProducts.length === 0 && Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
            {nearbyProducts.slice(0, 3).map((prod) => {
              const discount = prod.oldPrice > prod.price
                ? `${Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)}% OFF`
                : null;
              return (
                <div
                  key={prod.id}
                  onClick={() => navigate(`/product-detail/${prod.id}`, { state: { product: prod } })}
                  className="bg-white rounded-2xl border border-[#FFD9C7]/30 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform shadow-xs"
                >
                  {discount && (
                    <div className="absolute top-1.5 left-1.5 bg-[#FF5C00] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
                      {discount}
                    </div>
                  )}

                  <div className="h-20 flex items-center justify-center my-3">
                    <img
                      src={getImageUrl(prod.image)}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                      onError={handleImageError}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[#F26522] text-[8px] font-black">{prod.deliveryEtaText || '⚡ 15-25m'}</span>
                      {prod.distanceKm != null && (
                        <span className="text-slate-400 text-[8px] font-bold">• {prod.distanceKm.toFixed(1)} km</span>
                      )}
                    </div>
                    <h3 className="text-[11.5px] font-black text-slate-850 leading-tight truncate">{prod.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      {prod.oldPrice > prod.price && (
                        <span className="text-[9.5px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                      )}
                      <span className="text-[12.5px] font-black text-slate-900">₹{prod.price}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!nearbyLoading && nearbyProducts.length === 0 && (
              <div className="col-span-3 text-center py-6 px-3 bg-[#FFF5EE] rounded-xl border border-dashed border-[#FFD9C7]">
                <p className="text-[11.5px] font-bold text-slate-700">
                  {notDeliverable ? 'Share location to see offers from nearby stores' : 'Loading best offers...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── HORIZONTAL FILTER TABS BAR ── */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-3.5 px-4 mb-4">
          {filterTabs.map((tab) => {
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
        <div className="bg-white rounded-[24px] p-4 mx-4 mb-4 border border-[#FFF1EB] shadow-[0_4px_20px_rgba(242,101,34,0.015)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">{activeFlashSale?.title || 'Flash Deals'}</h2>
            <CountdownTimer endsAt={activeFlashSale?.endsAt} />
          </div>

          {/* Flash Deals Cards grid */}
          {dealsLoading && (
            <p className="text-center text-[11px] text-slate-500 py-6">Loading flash deals...</p>
          )}

          {!dealsLoading && ((activeFilter !== 'All' && displayedNearby.length === 0) || (activeFilter === 'All' && flashDeals.length === 0 && displayedNearby.length === 0 && nearbyProducts.length === 0)) && (
            <div className="text-center py-6 px-4 bg-[#FFF5EE]/60 rounded-xl border border-dashed border-[#FFD9C7]">
              <p className="text-[12px] font-bold text-slate-700">
                {activeFilter !== 'All' ? `No products found under "${activeFilter}"` : 'No active flash deals at the moment.'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {activeFilter !== 'All' ? 'Try switching to another category or "All"' : 'Check back soon for exclusive limited-time discounts!'}
              </p>
            </div>
          )}

          {!dealsLoading && (activeFilter !== 'All' ? displayedNearby.length > 0 : (flashDeals.length > 0 || displayedNearby.length > 0 || nearbyProducts.length > 0)) && (
            <div className="grid grid-cols-3 gap-2.5">
              {(activeFilter !== 'All' ? displayedNearby : (flashDeals.length > 0 ? flashDeals : (displayedNearby.length > 0 ? displayedNearby : nearbyProducts))).slice(0, 3).map((prod) => {
                const discount = prod.discount || (prod.oldPrice > prod.price ? `${Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)}% OFF` : null);
                const prodId = prod.productId || prod.id;
                return (
                  <div
                    key={prodId}
                    onClick={() => navigate(`/product-detail/${prodId}`, {
                      state: {
                        product: {
                          ...prod,
                          id: prodId,
                          productId: prodId,
                          marketplaceTab: 'quick_shop',
                        }
                      }
                    })}
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
                        alt={prod.title || prod.name}
                        className="max-h-full object-contain mix-blend-multiply"
                        onError={handleImageError}
                      />
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-slate-850 leading-tight mt-0.5 truncate">{prod.title || prod.name}</h3>
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
            </div>
          )}
        </div>

        {/* ── SHARE LOCATION BANNER ── */}
        <div className="bg-[#FFF5EE] border border-[#FFD9C7]/55 rounded-[20px] p-4 mx-4 mb-4 flex items-center justify-between shadow-2xs">
          <div className="flex flex-col gap-3 flex-1 pr-2">
            <span className="text-[12.5px] font-extrabold text-slate-800 leading-snug">
              Share your location to access Quick Shop & explore offers
            </span>
            <button
              type="button"
              onClick={() => setPromptOpen(true)}
              className="bg-[#F26522] text-white text-[11.5px] font-black px-4 py-2 rounded-xl w-fit active:scale-95 transition-transform shadow-xs"
            >
              Share Location
            </button>
          </div>
          <ChevronDown size={20} className="text-slate-500 flex-shrink-0 cursor-pointer" />
        </div>

        {/* ── TODAY'S SPECIAL DEALS ── */}
        <div className="bg-white rounded-[24px] p-4 mx-4 mb-6 border border-[#FFF1EB] shadow-[0_4px_20px_rgba(242,101,34,0.015)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-slate-850 tracking-tight">Today's Special Deals</h2>
            <span
              onClick={() => {
                localStorage.setItem('isQuickShopFlow', 'true');
                navigate('/quick-shop/category');
              }}
              className="text-[#F26522] text-[12.5px] font-black cursor-pointer hover:underline"
            >
              View All
            </span>
          </div>

          {/* Deals grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {nearbyLoading && nearbyProducts.length === 0 && Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
            {(displayedNearby.length > 3 ? displayedNearby.slice(3, 6) : (displayedNearby.length > 0 ? displayedNearby.slice(0, 3) : (nearbyProducts.length > 3 ? nearbyProducts.slice(3, 6) : nearbyProducts.slice(0, 3)))).map((prod) => {
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
                    <div className="flex items-center gap-1">
                      <span className="text-[#F26522] text-[8px] font-black">{prod.deliveryEtaText || '⚡ 15-25m'}</span>
                      {prod.distanceKm != null && (
                        <span className="text-slate-400 text-[8px] font-bold">• {prod.distanceKm.toFixed(1)} km</span>
                      )}
                    </div>
                    <h3 className="text-[11px] font-black text-slate-850 leading-tight mt-0.5 truncate">{prod.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      {prod.oldPrice > prod.price && (
                        <span className="text-[10px] text-slate-400 line-through">₹{prod.oldPrice}</span>
                      )}
                      <span className="text-[12px] font-black text-slate-900">₹{prod.price}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!nearbyLoading && nearbyProducts.length === 0 && (
              <div className="col-span-3 text-center py-6 px-3 bg-[#FFF5EE] rounded-xl border border-dashed border-[#FFD9C7]">
                <p className="text-[11.5px] font-bold text-slate-700">
                  Share location to explore special deals in your area
                </p>
              </div>
            )}
          </div>
        </div>

      {/* ── RESTORED CATEGORY SECTIONS (Mobile View) ── */}
      <div className="md:hidden px-4 space-y-8">
        {categoriesLoading && (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse" />
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {!categoriesLoading && categorySections.map((section, sIdx) => (
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
                    navigate(isFreshGrocery ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: item.name, categoryId: item.id } });
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── RESTORED CATEGORY SECTIONS (Desktop View) ── */}
      <div className="hidden md:block md:max-w-[1600px] md:mx-auto md:px-4 md:py-6 space-y-8">
        {categoriesLoading && (
          <div className="space-y-6">
            <div className="h-10 bg-[#F26522]/30 rounded-t-3xl animate-pulse" />
            <div className="bg-white p-6 rounded-b-3xl border border-slate-100 shadow-md grid grid-cols-4 lg:grid-cols-8 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        )}
        {!categoriesLoading && categorySections.map((section, sIdx) => (
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
                      navigate(isFreshGrocery ? '/fresh-grocery/category' : '/quick-shop/category', { state: { category: item.name, categoryId: item.id } });
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
