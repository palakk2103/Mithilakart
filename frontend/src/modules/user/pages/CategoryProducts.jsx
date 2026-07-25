import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Star, 
  ChevronDown, 
  SlidersHorizontal, 
  Search,
  ShoppingCart,
  ArrowLeft,
  LayoutGrid,
  Menu,
  MapPin,
  Bell
} from 'lucide-react';

import JewelleryImg from '../../../assets/products/product12.jpg';
import MakeupHero from '../../../assets/products/product08.jpg';
import SamsungS24 from '../../../assets/products/product01.jpg';
import EarbudsDeal from '../../../assets/products/product03.jpg';

// Import Beauty/Jewellery assets
import BeautyJewel1 from '../../../assets/Beauty/BeautyJewel1.jpg';
import BeautyJewel2 from '../../../assets/Beauty/BeautyJewel2.jpg';
import BeautyJewel3 from '../../../assets/Beauty/BeautyJewel3.jpg';
import BeautyJewel4 from '../../../assets/Beauty/BeautyJewel4.jpg';
import BeautyJewel5 from '../../../assets/Beauty/BeautyJewel5.jpg';
import BeautyJewel6 from '../../../assets/Beauty/BeautyJewel6.jpg';

const CornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[14px] md:h-[14px] opacity-85 select-none pointer-events-none">
    {/* Green leaves/petals */}
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#6FAE4A" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#6FAE4A" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#6FAE4A" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#6FAE4A" />
    {/* Orange petals */}
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    {/* Center core */}
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

const CardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-0.5 md:my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      {/* Left branch */}
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#6FAE4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#6FAE4A" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      {/* Right branch */}
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#6FAE4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#6FAE4A" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
      {/* Central Flower */}
      <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
      <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
      <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
      <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
      <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    </svg>
  </div>
);

const CategoryProductCard = React.memo(({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Stable pseudo-random rating count
  const ratingCount = useMemo(() => {
    const idNum = typeof product.id === 'string' ? product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : product.id;
    return (idNum % 450) + 50;
  }, [product.id]);

  return (
    <Link
      to="/product-detail"
      state={{ product }}
      className="flex flex-col cursor-pointer group w-full relative bg-[#FFFDF9] border border-[#EADCC9]/70 rounded-[18px] md:rounded-[24px] p-1.5 md:p-2.5 shadow-[0_2px_8px_rgba(61,35,20,0.015)] hover:shadow-[0_6px_18px_rgba(61,35,20,0.04)] hover:border-[#6FAE4A]/35 transition-all duration-300 transform select-none"
    >
      {/* Inner Decorative Dashed Border */}
      <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[#D35400]/20 rounded-[15px] md:rounded-[20px]" />

      {/* Corner Ornaments */}
      <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><CornerFlower /></div>
      <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><CornerFlower /></div>
      <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><CornerFlower /></div>
      <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><CornerFlower /></div>

      {/* Product Image Section */}
      <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#EADCC9]/40 p-0.5 md:p-1">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-[11px] md:rounded-[15px] group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-1 right-1 md:top-2 md:right-2 w-6 h-6 md:w-7.5 md:h-7.5 rounded-full bg-white/90 backdrop-blur-xs shadow-[0_2px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
        >
          <Heart 
            size={11} 
            className={`transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'stroke-[#3F2A20] fill-none'}`} 
          />
        </button>

        {/* Bestseller Tag */}
        {product.bestseller && (
          <div className="absolute top-0 left-0 bg-[#008c7a] text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-br uppercase tracking-wider shadow-xs leading-none z-10">
            Bestseller
          </div>
        )}

        {/* Rating Badge on Image */}
        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 md:gap-1 bg-white/95 backdrop-blur-xs px-1 py-0.2 md:px-1.5 md:py-0.5 rounded-[4px] md:rounded-[6px] shadow-xs border border-[#EADCC9]/30">
          <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{product.rating || '4.8'}</span>
          <Star size={7} fill="currentColor" className="text-[#6FAE4A] stroke-none" />
          <div className="w-[1px] h-2 bg-gray-300 mx-0.5" />
          <span className="text-[7.5px] md:text-[8.5px] font-semibold text-gray-500">({product.reviews || ratingCount})</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="pt-1.5 pb-0.5 px-0.5 md:pt-2.5 md:pb-1 md:px-1.5 relative z-10 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-[10px] md:text-[12px] font-black text-[#3F2A20] line-clamp-1 leading-tight tracking-tight">
            <span className="font-extrabold text-[#3F2A20]">{product.brand || 'Drasert'}</span> {product.name}
          </h3>

          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
              <span className="text-[11px] md:text-[13.5px] font-black text-slate-900">₹{product.price}</span>
              <span className="text-[8.5px] md:text-[10px] text-gray-400 line-through font-semibold">MRP ₹{product.oldPrice || '1,999'}</span>
              <span className="border border-[#F26522]/45 text-[#F26522] bg-[#F26522]/5 text-[7px] md:text-[8px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-tight">
                {product.off || '50% OFF'}
              </span>
            </div>
            <p className="text-[8.5px] md:text-[9.5px] font-extrabold text-[#6FAE4A] tracking-tight mt-0.5">
              ₹{Math.round(parseFloat(product.price.replace(/,/g, '')) * 0.9)} with UPI offer + more
            </p>
          </div>
        </div>

        {/* Bottom floral divider motif */}
        <CardBottomDivider />
      </div>
    </Link>
  );
});

const CategoryProducts = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'Jewellery';
  const [activeSort, setActiveSort] = useState('Popularity');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
      const totalCount = cart.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0);
      setCartCount(totalCount);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  // Multi-category product data with verified assets
  const categoryData = {
    'Jewellery': [
      {
        id: 1,
        brand: 'MODERN MINIMAL',
        name: 'Sleek Geometric Pendant',
        price: '4,499',
        oldPrice: '7,999',
        off: '43% off',
        rating: '4.9',
        reviews: '2,450',
        delivery: 'Tomorrow',
        image: BeautyJewel1,
        bestseller: true
      },
      {
        id: 2,
        brand: 'FANCY CHIC',
        name: 'Dainty Serenity Drops',
        price: '2,199',
        oldPrice: '4,500',
        off: '51% off',
        rating: '4.7',
        reviews: '1,120',
        delivery: 'Tomorrow',
        image: BeautyJewel2,
      },
      {
        id: 3,
        brand: 'CONTEMPORARY',
        name: 'Elegance Infinity Band',
        price: '3,299',
        oldPrice: '5,999',
        off: '45% off',
        rating: '4.8',
        reviews: '3,890',
        delivery: 'Tomorrow',
        image: BeautyJewel3,
      },
      {
        id: 4,
        brand: 'URBAN LUXE',
        name: 'Regal Strand Necklace',
        price: '8,990',
        oldPrice: '12,000',
        off: '25% off',
        rating: '4.9',
        reviews: '560',
        delivery: 'Tomorrow',
        image: BeautyJewel4,
      },
      {
        id: 5,
        brand: 'PURE SILHOUETTE',
        name: 'Slender Wristlet Set',
        price: '6,499',
        oldPrice: '9,999',
        off: '35% off',
        rating: '4.8',
        reviews: '890',
        delivery: 'Tomorrow',
        image: BeautyJewel5,
      },
      {
        id: 6,
        brand: 'MODERNIST',
        name: 'Abstract Nova Studs',
        price: '1,599',
        oldPrice: '2,999',
        off: '46% off',
        rating: '4.6',
        reviews: '420',
        delivery: 'Tomorrow',
        image: BeautyJewel6,
      },
      {
        id: 7,
        brand: 'NOIR LUXE',
        name: 'Midnight Solitaire Band',
        price: '12,499',
        oldPrice: '18,000',
        off: '30% off',
        rating: '4.9',
        reviews: '120',
        delivery: 'Tomorrow',
        image: BeautyJewel1,
      },
      {
        id: 8,
        brand: 'ETHEREAL',
        name: 'Lunar Glow Pendant',
        price: '5,299',
        oldPrice: '7,500',
        off: '29% off',
        rating: '4.7',
        reviews: '2,100',
        delivery: 'Tomorrow',
        image: BeautyJewel2,
      }
    ],
    'Electronics': [
      {
        id: 101,
        brand: 'SAMSUNG',
        name: 'Galaxy S24 5G (Cobalt Violet)',
        price: '46,999',
        oldPrice: '74,999',
        off: '37% off',
        rating: '4.6',
        reviews: '61,382',
        delivery: 'Tomorrow',
        image: SamsungS24,
        bestseller: true
      },
      {
        id: 102,
        brand: 'NOISE',
        name: 'Buds VS102 Wireless Earbuds',
        price: '1,299',
        oldPrice: '2,999',
        off: '56% off',
        rating: '4.2',
        reviews: '12,120',
        delivery: 'Tomorrow',
        image: EarbudsDeal,
      },
      {
        id: 103,
        brand: 'APPLE',
        name: 'AirPods Pro (2nd Gen)',
        price: '24,900',
        oldPrice: '26,900',
        off: '7% off',
        rating: '4.8',
        reviews: '45,210',
        delivery: 'Tomorrow',
        image: EarbudsDeal,
      },
      {
        id: 104,
        brand: 'SONY',
        name: 'WH-1000XM5 Headphones',
        price: '29,990',
        oldPrice: '34,990',
        off: '14% off',
        rating: '4.7',
        reviews: '8,920',
        delivery: 'Tomorrow',
        image: EarbudsDeal,
      },
      {
        id: 105,
        brand: 'BOAT',
        name: 'Airdopes 141',
        price: '1,499',
        oldPrice: '4,490',
        off: '66% off',
        rating: '4.1',
        reviews: '150k+',
        delivery: 'Tomorrow',
        image: EarbudsDeal,
      }
    ],
    'Beauty': [
      {
        id: 201,
        brand: 'PLUM',
        name: 'Luxury Skincare Gift Set',
        price: '1,249',
        oldPrice: '1,999',
        off: '37% off',
        rating: '4.8',
        reviews: '15,450',
        delivery: 'Tomorrow',
        image: MakeupHero,
        bestseller: true
      },
      {
        id: 202,
        brand: 'MAYBELLINE',
        name: 'SuperStay Matte Ink Liquid Lipstick',
        price: '549',
        oldPrice: '699',
        off: '21% off',
        rating: '4.5',
        reviews: '89,120',
        delivery: 'Tomorrow',
        image: MakeupHero,
      }
    ]
  };

  const products = categoryData[category] || categoryData['Jewellery'];

  // Sorting logic
  const sortedProducts = [...products].sort((a, b) => {
    const priceA = parseInt(a.price.replace(/,/g, ''));
    const priceB = parseInt(b.price.replace(/,/g, ''));
    if (activeSort === 'Price: Low to High') return priceA - priceB;
    if (activeSort === 'Price: High to Low') return priceB - priceA;
    if (activeSort === 'Customer Rating') return parseFloat(b.rating) - parseFloat(a.rating);
    return 0; // Popularity (Default)
  });

  const trendingData = {
    'Jewellery': [
      { id: 501, name: 'Chic Choker', price: '1,299', off: '60% off', image: BeautyJewel3 },
      { id: 502, name: 'Golden Hoops', price: '899', off: '45% off', image: BeautyJewel4 },
      { id: 503, name: 'Celestial Ring', price: '1,499', off: '30% off', image: BeautyJewel5 },
      { id: 504, name: 'Urban Cuff', price: '2,100', off: '20% off', image: BeautyJewel6 }
    ],
    'Electronics': [
      { id: 601, name: 'Smart Watch', price: '3,499', off: '40% off', image: SamsungS24 },
      { id: 602, name: 'Wireless Headphones', price: '4,999', off: '50% off', image: EarbudsDeal },
      { id: 603, name: 'Power Bank', price: '1,299', off: '35% off', image: EarbudsDeal },
      { id: 604, name: 'Bluetooth Speaker', price: '2,100', off: '25% off', image: EarbudsDeal }
    ],
    'Beauty': [
      { id: 701, name: 'Face Wash', price: '299', off: '10% off', image: MakeupHero },
      { id: 702, name: 'Body Lotion', price: '499', off: '15% off', image: MakeupHero },
      { id: 703, name: 'Lip Balm', price: '199', off: '5% off', image: MakeupHero },
      { id: 704, name: 'Hair Serum', price: '699', off: '20% off', image: MakeupHero }
    ]
  };

  const trendingItems = trendingData[category] || trendingData['Jewellery'];

  return (
    <div className="bg-gray-50 min-h-screen text-slate-900 transition-colors duration-300 pb-10 font-sans">
      {/* ── Dynamic Category Header ── */}
      <div className="sticky top-0 z-[100] bg-[#6FAE4A] text-white shadow-xs">
        {/* Row 1: Back + Title + Actions */}
        <div className="px-3 pt-1.5 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/home" className="p-1 active:scale-90 transition-transform">
              <ArrowLeft size={20} strokeWidth={2.5} />
            </Link>
            <h1 className="text-[15.5px] font-black tracking-tight">{category}</h1>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Link to="/search" className="p-1.5">
              <Search size={18} strokeWidth={2} />
            </Link>
            <Link to="/cart" className="relative p-1.5 active:scale-90 transition-transform">
              <ShoppingCart size={18} strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[7.5px] font-black min-w-[13px] h-3.5 rounded-full flex items-center justify-center border border-[#6FAE4A] shadow-sm">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: Sort & Filter Bar (Compact) */}
        <div className="flex items-center border-t border-white/10 bg-[#6FAE4A]">
          <button 
            onClick={() => setShowSortModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wide active:bg-white/10"
          >
            Sort <ChevronDown size={12} strokeWidth={2.5} />
          </button>
          <div className="w-[1px] h-3.5 bg-white/20"></div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold uppercase tracking-wide active:bg-white/10"
          >
            <SlidersHorizontal size={12} strokeWidth={2.5} /> Filter
          </button>
        </div>
      </div>

      {/* ── Category Hero Info ── */}
      <div className="px-3.5 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-[16px] font-black text-slate-800 uppercase tracking-tight leading-none">{category}</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Curated collection for you</p>
        </div>
        <div className="flex -space-x-1.5">
           <div className="w-7 h-7 rounded-full border-2 border-white bg-primary-light flex items-center justify-center text-[9px] font-bold text-[#6FAE4A]">NEW</div>
           <div className="w-7 h-7 rounded-full border-2 border-white bg-green-50 flex items-center justify-center text-[9px] font-bold text-[#388e3c]">SALE</div>
        </div>
      </div>

      {/* 🔶 Main Product Grid (Top Part) */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 md:max-w-[1000px] md:mx-auto w-full">
        {sortedProducts.slice(0, 4).map((product) => (
          <CategoryProductCard product={product} key={product.id} />
        ))}
      </div>

      {/* 🔶 Horizontal Trends Section (Slider as requested) */}
      <div className="my-2 py-4 bg-[var(--card-border)]/30 border-y border-[var(--card-border)] md:max-w-[1000px] md:mx-auto md:w-full md:rounded-2xl">
        <div className="px-4 flex items-center gap-2 mb-3">
          <span className="bg-[#008c7a] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Trending</span>
          <h2 className="text-[13px] font-black text-[var(--card-text)] uppercase tracking-tight">Hot and latest for you</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-2">
          {trendingItems.map((item) => (
            <Link to="/product-detail" state={{ product: item }} key={item.id} className="block w-[110px] flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100 p-1.5 group active:scale-95 transition-all shadow-sm">
              <div className="aspect-square rounded-md overflow-hidden mb-1.5">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 product-img-blend" />
              </div>
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-tight line-clamp-1">{item.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-black text-slate-900">₹{item.price}</span>
                <span className="text-[8px] font-bold text-[#388e3c]">{item.off}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 🔶 Main Product Grid (Bottom Part) */}
      <div className="px-4 py-2 mt-4 md:max-w-[1000px] md:mx-auto w-full">
        <h2 className="text-[13px] font-black text-[var(--card-text)] uppercase tracking-tight">For You</h2>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 md:max-w-[1000px] md:mx-auto w-full">
        {sortedProducts.slice(4).map((product) => (
          <CategoryProductCard product={product} key={product.id} />
        ))}
      </div>

      {/* 🔶 Sort Modal (Bottom Sheet) */}
      {showSortModal && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSortModal(false)}></div>
          <div className="relative w-full bg-[#111111] rounded-t-2xl border-t border-[#6FAE4A]/20 p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-gray-800 rounded-full mx-auto mb-6"></div>
            <h2 className="text-sm font-black text-[#6FAE4A] uppercase tracking-widest mb-6">Sort By</h2>
            <div className="space-y-4">
              {['Popularity', 'Price: Low to High', 'Price: High to Low', 'Customer Rating'].map((option) => (
                <button 
                  key={option}
                  onClick={() => {
                    setActiveSort(option);
                    setShowSortModal(false);
                  }}
                  className={`w-full flex items-center justify-between text-sm font-bold py-2 ${activeSort === option ? 'text-white' : 'text-gray-500'}`}
                >
                  {option}
                  {activeSort === option && <div className="w-2 h-2 bg-[#6FAE4A] rounded-full shadow-[0_0_8px_#6FAE4A]"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔶 Filter Modal (Full Screen Overlay) */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[200] bg-black animate-in fade-in duration-200">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-900 flex justify-between items-center">
              <h2 className="text-sm font-black text-[#6FAE4A] uppercase tracking-widest">Filters</h2>
              <button onClick={() => setShowFilterModal(false)} className="text-white">✕</button>
            </div>
            <div className="flex-1 p-6 space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Price Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg text-xs font-bold text-white">Min: ₹0</div>
                  <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg text-xs font-bold text-white">Max: ₹50,000+</div>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Availability</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-5 bg-[#6FAE4A] rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full"></div>
                  </div>
                  <span className="text-sm font-bold text-white">Quick Delivery Only</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-900 flex gap-4">
              <button onClick={() => setShowFilterModal(false)} className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Clear All</button>
              <button onClick={() => setShowFilterModal(false)} className="flex-[2] py-4 bg-[#6FAE4A] text-black text-[11px] font-black uppercase tracking-widest rounded-lg">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;


