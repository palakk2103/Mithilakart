import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Star, ShoppingBag } from 'lucide-react';
import useVendorStore from '../../../store/useVendorStore';
import { addProductToCart } from '../utils/cartUtils';
import { getCategories } from '../services/catalogApi';
import { mapMithilaCategoryCards } from '../utils/mappers';

// Shared Home Components for Merchandising Pattern Alignment
import LazySection from '../components/vendor/home/LazySection';
import TopSelection from '../components/vendor/home/TopSelection';
import BrandsSpotlight from '../components/vendor/home/BrandsSpotlight';
import BestQuality from '../components/vendor/home/BestQuality';
import TrendingThisWeek from '../components/vendor/home/TrendingThisWeek';

import bannerIllustration from '../../../assets/banner_illustration.png';

const getDisplayName = (name) => {
  if (name === 'Mithila Festival & Cultural') return 'Festival & Cultural';
  if (name === 'Mithila Special Cuisines') return 'Special Cuisines';
  if (name === 'Mithila Lac Bangles') return 'Lac Bangles';
  if (name === 'Mithila Handcrafted Items') return 'Handcrafted Decor';
  if (name === 'Mithila Pooja Needs') return 'Pooja Needs';
  if (name === 'Mithila Books & Panchang') return 'Books & Panchang';
  if (name === 'Mithila Achaar') return 'Mithila Achaar';
  return name;
};

// Mithila Decorative Corner Flower (Teal Theme)
const MithilaCornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[13px] md:h-[13px] opacity-85 select-none pointer-events-none">
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#207C8A" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#207C8A" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#207C8A" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#207C8A" />
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

// Mithila Bottom Flourish Divider (Teal Theme)
const MithilaCardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#207C8A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#207C8A" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#207C8A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#207C8A" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
      <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
      <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
      <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
      <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
      <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    </svg>
  </div>
);

// Styled Product Card matching the reference image layout and structure
const MithilaDealCard = React.memo(({ prod, onNavigate, onAddToCart }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const name = prod.title || prod.name || prod.label || 'Product';
  const price = prod.product?.price ?? prod.price ?? 0;
  const mrp = prod.product?.mrp || prod.mrp;
  const image = prod.img || prod.image;
  const brand = prod.product?.brand || 'MITHILAK';
  const discount = prod.product?.discount || prod.discount || (mrp && price && mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : null);
  const rating = prod.product?.rating || prod.product?.ratingAvg || 4.7;

  return (
    <div
      onClick={() => onNavigate(prod)}
      className="flex flex-col cursor-pointer group w-full h-full relative bg-[#FFFDF9] border border-[#207C8A]/25 rounded-[18px] md:rounded-[24px] p-2 md:p-3 shadow-[0_2px_8px_rgba(32,124,138,0.02)] hover:shadow-[0_6px_18px_rgba(32,124,138,0.06)] hover:border-[#207C8A]/50 transition-all duration-300 transform select-none justify-between"
    >
      {/* Inner Decorative Dashed Border */}
      <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[#207C8A]/20 rounded-[15px] md:rounded-[20px]" />

      {/* Corner Ornaments */}
      <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><MithilaCornerFlower /></div>
      <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><MithilaCornerFlower /></div>
      <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><MithilaCornerFlower /></div>
      <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><MithilaCornerFlower /></div>

      {/* Product Image Section */}
      <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#207C8A]/15 p-1">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-[11px] md:rounded-[15px] group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
        />

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
        >
          <Heart
            size={11}
            className={`transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'stroke-[#3F2A20] fill-none'}`}
          />
        </button>

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-1.5 left-1.5 bg-[#207C8A] text-white text-[7.5px] md:text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
            {discount}
          </div>
        )}

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded-[4px] shadow-xs border border-[#207C8A]/20">
            <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{rating}</span>
            <Star size={7} fill="currentColor" className="text-amber-500 stroke-none" />
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="pt-2 pb-0.5 px-0.5 relative z-10 flex flex-col justify-between flex-1">
        <div>
          <span className="text-slate-400 text-[8.5px] md:text-[9.5px] font-bold block uppercase tracking-wider">{brand}</span>
          <h3 className="text-[11px] md:text-[13px] font-black text-[#3F2A20] line-clamp-1 leading-tight mt-0.5">
            {name}
          </h3>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[12px] md:text-[14px] font-black text-slate-900">₹{price}</span>
            {mrp && (
              <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-semibold">₹{mrp}</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-2.5 flex items-center justify-between gap-1 pt-1 border-t border-[#207C8A]/20">
          <button
            onClick={(e) => onAddToCart(prod, e)}
            className="w-full py-1.5 px-2 bg-[#F0F9FA] hover:bg-[#207C8A] text-[#207C8A] hover:text-white border border-[#207C8A]/30 rounded-xl text-[10px] md:text-[11px] font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs"
          >
            <ShoppingBag size={12} strokeWidth={2.2} />
            <span>Add to Cart</span>
          </button>
        </div>

        <MithilaCardBottomDivider />
      </div>
    </div>
  );
});

const Mithilak = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mithilaCategories, setMithilaCategories] = useState([]);
  const { fetchHomeSections, homeSections } = useVendorStore();

  useEffect(() => {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
    localStorage.setItem('isFreshGroceryFlow', 'false');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
    fetchHomeSections('mithilak');
  }, [fetchHomeSections]);

  useEffect(() => {
    let cancelled = false;

    getCategories({ commerceFlow: 'mithilak' })
      .then((data) => {
        if (!cancelled) setMithilaCategories(mapMithilaCategoryCards(data));
      })
      .catch(() => {
        if (!cancelled) setMithilaCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen px-4 py-5 select-none pb-24">
      {/* 1. Page Title Header */}
      <div className="mb-4 px-1">
        <h2 className="text-[19px] font-bold text-[#3F2A20] tracking-tight leading-none mb-1">
          Mithila Specialities
        </h2>
        <p className="text-[10px] text-[#207C8A] font-extrabold tracking-widest uppercase mt-1">
          HANDPICKED CULTURAL PRODUCTS
        </p>
      </div>

      {/* 2. Hero Promotional Banner */}
      <div className="mb-6 bg-gradient-to-r from-[#207C8A] to-[#5DB6C3] rounded-2xl p-4 text-white relative overflow-hidden shadow-sm flex items-center justify-between h-[165px]">
        <div className="z-10 flex-1 max-w-[65%] flex flex-col justify-center h-full">
          <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
            MITHILA UTSAV
          </span>
          <h3 className="text-[17px] font-bold mt-2 leading-tight tracking-tight">
            Authentic Mithila Artistry
          </h3>
          <p className="text-[11.5px] text-white/90 font-medium mt-1">
            Flat 20% OFF on Paintings & Crafts
          </p>
        </div>
        <div className="absolute right-0 bottom-0 h-full w-[42%] flex items-end justify-end pointer-events-none overflow-hidden">
          <img
            src={bannerIllustration}
            alt="Mithila Artistry Illustration"
            className="h-[95%] object-contain object-bottom select-none pr-2"
          />
        </div>
      </div>

      {/* 3. Shop by Category Grid (Mobile View) */}
      <div className="grid grid-cols-4 gap-y-5 gap-x-2.5 mb-8 md:hidden">
        {mithilaCategories.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => {
              localStorage.setItem('isMithilakFlow', 'true');
              localStorage.setItem('isQuickShopFlow', 'false');
              navigate('/mithilak/category', { state: { category: item.name, categoryId: item.id } });
            }}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
          >
            {/* Category Image Wrapper - White circle with light thin border */}
            <div className="w-[66px] h-[66px] rounded-full bg-white border border-[#EADCC9]/55 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.03)] overflow-hidden relative">
              <img
                src={item.img}
                alt={item.name}
                className="w-[82%] h-[82%] object-contain z-10"
                loading="lazy"
              />
              {/* White overlay ring to mask the black border line in the image */}
              <div className="absolute inset-0 rounded-full border-[5.5px] border-white z-20 pointer-events-none" />
            </div>
            
            {/* Category label text */}
            <span className="text-[11.5px] font-semibold text-center text-gray-800 mt-2 leading-snug tracking-tight line-clamp-2 h-[34px] w-full flex items-start justify-center">
              {getDisplayName(item.name)}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Shop by Category Grid (Desktop View) */}
      <div className="hidden md:block md:max-w-[800px] md:mx-auto md:w-full md:mb-8">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md">
          <div className="grid grid-cols-4 gap-x-8 gap-y-6 justify-items-center">
            {mithilaCategories.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => {
                  localStorage.setItem('isMithilakFlow', 'true');
                  localStorage.setItem('isQuickShopFlow', 'false');
                  navigate('/mithilak/category', { state: { category: item.name, categoryId: item.id } });
                }}
                className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform w-full max-w-[120px] mx-auto"
              >
                <div className="relative w-[76px] h-[76px] rounded-full overflow-hidden bg-white border border-[#EADCC9]/55 flex items-center justify-center group-hover:bg-slate-50 transition-colors duration-300 shadow-sm">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-[82%] h-[82%] object-contain z-10 group-hover:scale-[1.08] transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* White overlay ring to mask the black border line in the image */}
                  <div className="absolute inset-0 rounded-full border-[6.5px] border-white z-20 pointer-events-none" />
                </div>
                <span className="text-[13px] font-bold text-center text-slate-800 leading-tight tracking-tight mt-1 group-hover:text-[#207C8A] transition-colors">
                  {getDisplayName(item.name)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Trending This Week Section */}
      <div className="mb-6 md:mb-8 w-full md:max-w-[1600px] md:mx-auto">
        <TrendingThisWeek theme="mithilak" />
      </div>

      {/* 5. Today's Special Deals / Best Sellers Section */}
      <div className="md:max-w-[1600px] md:mx-auto md:w-full mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[17px] font-bold text-[#3F2A20] leading-none">Today's Special Deals</h2>
          <span 
            onClick={() => {
              localStorage.setItem('isMithilakFlow', 'true');
              localStorage.setItem('isQuickShopFlow', 'false');
              navigate('/mithilak/category', { state: { category: mithilaCategories[0]?.name || 'Mithila Handcrafted Items', categoryId: mithilaCategories[0]?.id } });
            }}
            className="text-[12px] text-[#207C8A] font-bold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight size={13} strokeWidth={2.5} className="inline-block" />
          </span>
        </div>

        {/* Horizontal Scrolling Single Row */}
        <div className="flex items-stretch gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1 -mx-1 px-1">
          {(homeSections.todaysSpecialDeals?.length ? homeSections.todaysSpecialDeals : (homeSections.topSelection?.length ? homeSections.topSelection : homeSections.brandsSpotlight || [])).map((prod) => (
            <div key={prod.id} className="w-[165px] sm:w-[195px] md:w-[220px] flex-shrink-0 snap-start flex flex-col">
              <MithilaDealCard
                prod={prod}
                onNavigate={(p) => {
                  localStorage.setItem('isMithilakFlow', 'true');
                  localStorage.setItem('isQuickShopFlow', 'false');
                  navigate('/vendor/product-detail', { state: { productId: p.id, product: p.product || p } });
                }}
                onAddToCart={async (p, e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const name = p.title || p.name || p.label || 'Product';
                  const price = p.product?.price ?? p.price ?? 0;
                  const image = p.img || p.image;
                  try {
                    await addProductToCart({
                      id: p.productId || p.product?._id || p.product?.id || p.id,
                      listingId: p.listingId,
                      marketplaceTab: 'mithilak',
                      name,
                      price,
                      image,
                    });
                    triggerToast(`${name} added to cart!`);
                  } catch (err) {
                    triggerToast(err?.message || 'Could not add to cart');
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Top Selection Section */}
      {homeSections.topSelection?.length > 0 && (
        <div className="mb-5 md:mb-8">
          <LazySection height="400px">
            <TopSelection items={homeSections.topSelection} />
          </LazySection>
        </div>
      )}

      {/* 7. Brands / Artisans Spotlight Section */}
      {(homeSections.brandsSpotlight?.length > 0 || homeSections.topSelection?.length > 0) && (
        <div className="mb-5 md:mb-8">
          <LazySection height="350px">
            <BrandsSpotlight items={homeSections.brandsSpotlight?.length ? homeSections.brandsSpotlight : homeSections.topSelection} />
          </LazySection>
        </div>
      )}

      {/* 8. Best Quality Guaranteed Section */}
      {(homeSections.bestQualityGuaranteed?.length > 0 || homeSections.bestQuality?.length > 0 || homeSections.topSelection?.length > 0) && (
        <div className="mb-5 md:mb-8">
          <LazySection height="500px">
            <BestQuality items={homeSections.bestQualityGuaranteed?.length ? homeSections.bestQualityGuaranteed : (homeSections.bestQuality?.length ? homeSections.bestQuality : homeSections.topSelection)} />
          </LazySection>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white px-6 py-3 rounded-full text-[13px] font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Mithilak;
