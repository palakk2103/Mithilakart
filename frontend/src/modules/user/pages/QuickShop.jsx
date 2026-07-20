import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ChevronDown, Search, Camera, Mic, ScanLine, Star, Home as HomeIcon, LayoutGrid, ShoppingCart, User, ChevronRight } from 'lucide-react';
import CategoryCard from '../components/vendor/CategoryCard';
import useVendorStore from '../../../store/useVendorStore';

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

const CATEGORIES_DATA = [
  {
    title: 'Grocery',
    items: [
      { name: 'Fruits & Vegetables', img: BeautyTab },
      { name: 'Atta, Rice & Dal', img: ForYouProduct },
      { name: 'Oil, Ghee & Masala', img: LorealShampoo },
      { name: 'Dairy, Bread & Eggs', img: FashionTabProduct },
      { name: 'Cereals & Dry Fruits', img: PlumShampoo },
      { name: 'Chicken, Meat & Fish', img: ElectronicsHero },
      { name: 'Instant & Frozen Food', img: EarbudsDeal },
    ]
  },
  {
    title: 'Snacks & Drinks',
    items: [
      { name: 'Chips & Namkeens', img: EarbudsDeal },
      { name: 'Ice Creams', img: LipGloss },
      { name: 'Drinks & Juices', img: ForYouProduct },
      { name: 'Sweets & Chocolates', img: LorealShampoo },
      { name: 'Tea, Coffee & Milk Drinks', img: FashionTabProduct },
      { name: 'Bakery & Biscuits', img: PlumShampoo },
      { name: 'Sauces & Spreads', img: LipGloss },
    ]
  },
  {
    title: 'Beauty & Personal Care',
    items: [
      { name: 'Bath, Body & Grooming', img: LorealShampoo },
      { name: 'Baby Care', img: ToysTab },
      { name: 'Hair Care', img: PlumShampoo },
      { name: 'Healthcare & Pharma', img: MakeupHero },
      { name: 'Wellness & Hygiene', img: BeautyTab },
      { name: 'Beauty & Fragrances', img: LipGloss },
    ]
  },
  {
    title: 'Household, Stationery & Lifestyle',
    items: [
      { name: 'Cleaning Essentials', img: LorealShampoo },
      { name: 'Stationery Supplies', img: StationeryTab },
      { name: 'Toys & Games', img: ToysTab },
      { name: 'Sports & Fitness', img: ClothesImg },
      { name: 'Home & Kitchen', img: FashionTabProduct },
      { name: 'Electricals & Tools', img: ElectronicsHero },
      { name: 'Fashion Accessories', img: FashionHero },
      { name: 'Pet Supplies', img: ToysTab },
    ]
  },
  {
    title: 'Mobiles & Electronics',
    items: [
      { name: 'Mobiles', img: SamsungS24 },
      { name: 'Electronics & Gadgets', img: ElectronicsHero },
      { name: 'Audio & Smart Watches', img: EarbudsDeal },
    ]
  }
];

const QuickShop = () => {
  const navigate = useNavigate();
  const { fetchHomeSections } = useVendorStore();

  useEffect(() => {
    fetchHomeSections('quick_shop');
  }, [fetchHomeSections]);

  // Simulated active tab for the filters
  const [activeFilter, setActiveFilter] = React.useState('All');

  // Timer simulation
  const [timeLeft, setTimeLeft] = React.useState({ h: '02', m: '45', s: '12' });
  React.useEffect(() => {
    const timer = setInterval(() => {
      const h = parseInt(timeLeft.h, 10);
      const m = parseInt(timeLeft.m, 10);
      const s = parseInt(timeLeft.s, 10);
      
      let nextS = s - 1;
      let nextM = m;
      let nextH = h;
      
      if (nextS < 0) {
        nextS = 59;
        nextM -= 1;
      }
      if (nextM < 0) {
        nextM = 59;
        nextH -= 1;
      }
      if (nextH < 0) {
        nextH = 2;
        nextM = 45;
        nextS = 12;
      }

      setTimeLeft({
        h: String(nextH).padStart(2, '0'),
        m: String(nextM).padStart(2, '0'),
        s: String(nextS).padStart(2, '0')
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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
              {[
                {
                  name: 'Apple',
                  weight: '1 kg',
                  oldPrice: 148,
                  price: 120,
                  discount: '15% OFF',
                  img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Banana',
                  weight: '1 dozen',
                  oldPrice: 50,
                  price: 40,
                  discount: '20% OFF',
                  img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Rice',
                  weight: '1 kg',
                  oldPrice: 80,
                  price: 70,
                  discount: '10% OFF',
                  img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80',
                },
              ].map((prod, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate('/product-detail', { state: { product: prod } })}
                  className="bg-white rounded-2xl border border-[#EADCC9]/30 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform shadow-xs"
                >
                  <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none">
                    {prod.discount}
                  </div>

                  <div className="h-20 flex items-center justify-center my-3">
                    <img 
                      src={prod.img} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain rounded-lg" 
                    />
                  </div>

                  <div>
                    <h3 className="text-[11.5px] font-black text-[#3F2A20] leading-tight">{prod.name}</h3>
                    <span className="text-[#3F2A20]/50 text-[9px] font-bold">{prod.weight}</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[9.5px] text-[#3F2A20]/45 line-through">₹{prod.oldPrice}</span>
                      <span className="text-[12.5px] font-black text-[#3F2A20]">₹{prod.price}</span>
                    </div>
                  </div>
                </div>
              ))}
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
              <h2 className="text-[16px] font-black text-[#3F2A20] tracking-tight">Flash Deals</h2>
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
            <div className="grid grid-cols-3 gap-2.5">
              {/* Product 1: L'Oreal Shampoo */}
              <div 
                onClick={() => navigate('/product-detail', { state: { product: { name: "L'Oreal Paris Hyaluron Moisture", price: 225, oldPrice: 230, rating: '4.3' } } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
                  12% OFF
                </div>
                
                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src="https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&auto=format&fit=crop&q=60" 
                    alt="L'Oreal Shampoo" 
                    className="max-h-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] font-bold">200 ml</span>
                  <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5">L'Oreal Paris</h3>
                  <p className="text-[9.5px] text-slate-550 font-semibold leading-tight truncate">Hyaluron Moisture</p>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 line-through">₹230</span>
                    <span className="text-[12px] font-black text-slate-900">₹225</span>
                  </div>
                </div>
              </div>

              {/* Product 2: Wellcore Creatine */}
              <div 
                onClick={() => navigate('/product-detail', { state: { product: { name: "Wellcore Creatine", price: 530, oldPrice: 699, rating: '4.5' } } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
                  12% OFF
                </div>

                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=60" 
                    alt="Wellcore Creatine" 
                    className="max-h-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] font-bold">122 g</span>
                  <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5">Wellcore</h3>
                  <p className="text-[9.5px] text-slate-550 font-semibold leading-tight truncate">Creatine</p>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 line-through">₹699</span>
                    <span className="text-[12px] font-black text-slate-900">₹530</span>
                  </div>
                  <div className="mt-1 bg-[#FFF2EB] text-[#E25822] border border-[#FFD9C7]/40 rounded-sm text-[8px] font-black text-center py-0.5 leading-none">
                    ₹400 with UPI
                  </div>
                </div>
              </div>

              {/* Product 3: Pilgrim Face Serum */}
              <div 
                onClick={() => navigate('/product-detail', { state: { product: { name: "Pilgrim 10% Niacinamide", price: 202, oldPrice: 249, rating: '4.4' } } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
                  20% OFF
                </div>

                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&auto=format&fit=crop&q=60" 
                    alt="Pilgrim Face Serum" 
                    className="max-h-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] font-bold">10 ml</span>
                  <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5">Pilgrim 10%</h3>
                  <p className="text-[9.5px] text-slate-550 font-semibold leading-tight truncate">Niacinamide</p>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 line-through">₹249</span>
                    <span className="text-[12px] font-black text-slate-900">₹202</span>
                  </div>
                  <button className="mt-1 w-full bg-white text-slate-700 border border-slate-200 rounded-full text-[8.5px] font-black py-0.5 text-center shadow-3xs active:scale-95 transition-transform">
                    SaveExtra
                  </button>
                </div>
              </div>
            </div>
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
              {/* Potato */}
              <div 
                onClick={() => navigate('/product-detail', { state: { product: { name: "Potato", price: 25, oldPrice: 30 } } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
                  15% OFF
                </div>
                
                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=60" 
                    alt="Potato" 
                    className="max-h-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div>
                  <span className="text-slate-450 text-[9px] font-bold">1 kg</span>
                  <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5">Potato</h3>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 line-through">₹30</span>
                    <span className="text-[12px] font-black text-slate-900">₹25</span>
                  </div>
                </div>
              </div>

              {/* Tomato */}
              <div 
                onClick={() => navigate('/product-detail', { state: { product: { name: "Tomato", price: 22, oldPrice: 25 } } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
                  12% OFF
                </div>
                
                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src="https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&auto=format&fit=crop&q=60" 
                    alt="Tomato" 
                    className="max-h-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div>
                  <span className="text-slate-455 text-[9px] font-bold">500 g</span>
                  <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5">Tomato</h3>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 line-through">₹25</span>
                    <span className="text-[12px] font-black text-slate-900">₹22</span>
                  </div>
                </div>
              </div>

              {/* Milk */}
              <div 
                onClick={() => navigate('/product-detail', { state: { product: { name: "Milk", price: 48, oldPrice: 60 } } })}
                className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
              >
                <div className="absolute top-1.5 left-1.5 bg-[#E25822] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
                  10% OFF
                </div>
                
                <div className="h-20 flex items-center justify-center my-3">
                  <img 
                    src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=60" 
                    alt="Milk" 
                    className="max-h-full object-contain mix-blend-multiply" 
                  />
                </div>

                <div>
                  <span className="text-slate-455 text-[9px] font-bold">1 L</span>
                  <h3 className="text-[11px] font-black text-[#3F2A20] leading-tight mt-0.5">Milk</h3>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 line-through">₹60</span>
                    <span className="text-[12px] font-black text-slate-900">₹48</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RESTORED CATEGORY SECTIONS (Mobile View) ── */}
          <div className="md:hidden px-4 space-y-8">
            {CATEGORIES_DATA.map((section, sIdx) => (
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
            {CATEGORIES_DATA.map((section, sIdx) => (
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
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
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

        {/* Flash Deals Cards grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Product 1: L'Oreal Shampoo */}
          <div 
            onClick={() => navigate('/product-detail', { state: { product: { name: "L'Oreal Paris Hyaluron Moisture", price: 225, oldPrice: 230, rating: '4.3' } } })}
            className="bg-white rounded-xl border border-slate-100 p-1.5 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
          >
            <div className="absolute top-1 left-1 bg-[#FF5C00] text-white text-[7.5px] font-black px-1.2 py-0.3 rounded-xs shadow-2xs leading-none z-10">
              12% OFF
            </div>
            
            <div className="h-14 flex items-center justify-center my-1.5">
              <img 
                src="https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&auto=format&fit=crop&q=60" 
                alt="L'Oreal Shampoo" 
                className="max-h-full object-contain mix-blend-multiply" 
              />
            </div>

            <div>
              <span className="text-slate-400 text-[8px] font-bold">200 ml</span>
              <h3 className="text-[10px] font-black text-slate-850 leading-tight mt-0.5">L'Oreal Paris</h3>
              <p className="text-[8.5px] text-slate-500 font-semibold leading-tight truncate">Hyaluron Moisture</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[9px] text-slate-400 line-through">₹230</span>
                <span className="text-[11px] font-black text-slate-900">₹225</span>
              </div>
            </div>
          </div>

          {/* Product 2: Wellcore Creatine */}
          <div 
            onClick={() => navigate('/product-detail', { state: { product: { name: "Wellcore Creatine", price: 530, oldPrice: 699, rating: '4.5' } } })}
            className="bg-white rounded-xl border border-slate-100 p-1.5 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
          >
            <div className="absolute top-1 left-1 bg-[#FF5C00] text-white text-[7.5px] font-black px-1.2 py-0.3 rounded-xs shadow-2xs leading-none z-10">
              12% OFF
            </div>

            <div className="h-14 flex items-center justify-center my-1.5">
              <img 
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=60" 
                alt="Wellcore Creatine" 
                className="max-h-full object-contain mix-blend-multiply" 
              />
            </div>

            <div>
              <span className="text-slate-400 text-[8px] font-bold">122 g</span>
              <h3 className="text-[10px] font-black text-slate-850 leading-tight mt-0.5">Wellcore</h3>
              <p className="text-[8.5px] text-slate-500 font-semibold leading-tight truncate">Creatine</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[9px] text-slate-400 line-through">₹699</span>
                <span className="text-[11px] font-black text-slate-900">₹530</span>
              </div>
              <div className="mt-0.5 bg-[#FFF2EB] text-[#FF5C00] border border-[#FFD9C7]/30 rounded-xs text-[7.5px] font-black text-center py-0.2 leading-none">
                ₹400 with UPI
              </div>
            </div>
          </div>

          {/* Product 3: Pilgrim Face Serum */}
          <div 
            onClick={() => navigate('/product-detail', { state: { product: { name: "Pilgrim 10% Niacinamide", price: 202, oldPrice: 249, rating: '4.4' } } })}
            className="bg-white rounded-xl border border-slate-100 p-1.5 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
          >
            <div className="absolute top-1 left-1 bg-[#FF5C00] text-white text-[7.5px] font-black px-1.2 py-0.3 rounded-xs shadow-2xs leading-none z-10">
              20% OFF
            </div>

            <div className="h-14 flex items-center justify-center my-1.5">
              <img 
                src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&auto=format&fit=crop&q=60" 
                alt="Pilgrim Face Serum" 
                className="max-h-full object-contain mix-blend-multiply" 
              />
            </div>

            <div>
              <span className="text-slate-400 text-[8px] font-bold">10 ml</span>
              <h3 className="text-[10px] font-black text-slate-850 leading-tight mt-0.5">Pilgrim 10%</h3>
              <p className="text-[8.5px] text-slate-500 font-semibold leading-tight truncate">Niacinamide</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[9px] text-slate-400 line-through">₹249</span>
                <span className="text-[11px] font-black text-slate-900">₹202</span>
              </div>
              <button className="mt-0.5 w-full bg-white text-slate-700 border border-slate-200 rounded-full text-[8px] font-black py-0.2 text-center shadow-3xs active:scale-95 transition-transform">
                SaveExtra
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SHARE LOCATION BANNER ── */}
      <div className="bg-[#FFF5EE] border border-[#FFD9C7]/40 rounded-[20px] p-4 mx-4 mb-4 flex items-center justify-between shadow-2xs">
        <div className="flex flex-col gap-3 flex-1 pr-2">
          <span className="text-[12.5px] font-extrabold text-slate-800 leading-snug">
            Share your location to access QuickShop & explore offers
          </span>
          <button className="bg-[#FF5C00] text-white text-[11.5px] font-black px-4 py-2 rounded-xl w-fit active:scale-95 transition-transform shadow-xs">
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
          {/* Potato */}
          <div 
            onClick={() => navigate('/product-detail', { state: { product: { name: "Potato", price: 25, oldPrice: 30 } } })}
            className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
          >
            <div className="absolute top-1.5 left-1.5 bg-[#FF5C00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
              15% OFF
            </div>
            
            <div className="h-20 flex items-center justify-center my-3">
              <img 
                src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=60" 
                alt="Potato" 
                className="max-h-full object-contain mix-blend-multiply" 
              />
            </div>

            <div>
              <span className="text-slate-400 text-[9px] font-bold">1 kg</span>
              <h3 className="text-[11px] font-black text-slate-850 leading-tight mt-0.5">Potato</h3>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 line-through">₹30</span>
                <span className="text-[12px] font-black text-slate-900">₹25</span>
              </div>
            </div>
          </div>

          {/* Tomato */}
          <div 
            onClick={() => navigate('/product-detail', { state: { product: { name: "Tomato", price: 22, oldPrice: 25 } } })}
            className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
          >
            <div className="absolute top-1.5 left-1.5 bg-[#FF5C00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
              12% OFF
            </div>
            
            <div className="h-20 flex items-center justify-center my-3">
              <img 
                src="https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&auto=format&fit=crop&q=60" 
                alt="Tomato" 
                className="max-h-full object-contain mix-blend-multiply" 
              />
            </div>

            <div>
              <span className="text-slate-400 text-[9px] font-bold">500 g</span>
              <h3 className="text-[11px] font-black text-slate-850 leading-tight mt-0.5">Tomato</h3>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 line-through">₹25</span>
                <span className="text-[12px] font-black text-slate-900">₹22</span>
              </div>
            </div>
          </div>

          {/* Milk */}
          <div 
            onClick={() => navigate('/product-detail', { state: { product: { name: "Milk", price: 48, oldPrice: 60 } } })}
            className="bg-white rounded-2xl border border-slate-100 p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform"
          >
            <div className="absolute top-1.5 left-1.5 bg-[#FF5C00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-2xs leading-none">
              10% OFF
            </div>
            
            <div className="h-20 flex items-center justify-center my-3">
              <img 
                src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=60" 
                alt="Milk" 
                className="max-h-full object-contain mix-blend-multiply" 
              />
            </div>

            <div>
              <span className="text-slate-400 text-[9px] font-bold">1 L</span>
              <h3 className="text-[11px] font-black text-slate-850 leading-tight mt-0.5">Milk</h3>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 line-through">₹60</span>
                <span className="text-[12px] font-black text-slate-900">₹48</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESTORED CATEGORY SECTIONS (Mobile View) ── */}
      <div className="md:hidden px-4 space-y-8">
        {CATEGORIES_DATA.map((section, sIdx) => (
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
        {CATEGORIES_DATA.map((section, sIdx) => (
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
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
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
