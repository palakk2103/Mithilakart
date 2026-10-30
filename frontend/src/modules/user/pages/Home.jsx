import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Sparkles, Gift, Monitor, Gem, Shirt, Gamepad2, BookOpen, Zap, ChevronRight, MoreHorizontal, Heart, Star } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import { getHeaderChipIcon } from '../../../shared/constants/headerChipIcons';

// Import Home Components
import LazySection from '../components/vendor/home/LazySection';
import StillLookingSection from '../components/vendor/home/StillLookingSection';
import TopSelection from '../components/vendor/home/TopSelection';
import BrandsSpotlight from '../components/vendor/home/BrandsSpotlight';
import BestQuality from '../components/vendor/home/BestQuality';
import KeepShopping from '../components/vendor/home/KeepShopping';
import RatingSection from '../components/vendor/home/RatingSection';
import SubCategoryGrid from '../components/vendor/home/SubCategoryGrid';
import TrendingThisWeek from '../components/vendor/home/TrendingThisWeek';

// Import Existing Shared Components
import CategoryProductsSection from '../components/vendor/CategoryProductsSection';
import SaleBanner from '../components/vendor/SaleBanner';
import BannerCarousel from '../components/vendor/BannerCarousel';

// Banner Assets

import useVendorStore from '../../../store/useVendorStore';
import toast from 'react-hot-toast';
import { addProductToCart } from '../utils/cartUtils';
import { mapHomeBanners, mapNavChips } from '../utils/mappers';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../shared/context/LanguageContext';

// Single category chip — extracted so the visible row, the hidden measuring row,
// and the width calculations all render the exact same markup.
const CategoryChip = ({ cat, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform outline-none"
    >
      <div
        className={`w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center transition-all ${
          active
            ? 'bg-[#FFF8EE] border-2 border-[#3E5A44] shadow-xs text-[#3E5A44]'
            : 'bg-[#EADCC9]/20 border border-[#EADCC9]/55 text-[#3E5A44] shadow-[0_1.5px_4px_rgba(0,0,0,0.015)]'
        }`}
      >
        {cat.isYouBuy ? (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
            <path d="M12 2C9.5 2 7.5 4 7.5 6.5H9c0-1.7 1.3-3 3-3s3 1.3 3 3h1.5C16.5 4 14.5 2 12 2z" />
            <path d="M5 6.5h14c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2z" />
            <path d="M12 16.8s-2.2-1.8-2.7-2.3c-.7-.7-1-1.3-1-1.8 0-1.2 1-2.2 2.2-2.2.7 0 1.3.4 1.5 1 .2-.6.8-1 1.5-1 1.2 0 2.2 1 2.2 2.2 0 .5-.3 1.1-1 1.8-.5.5-2.7 2.3-2.7 2.3z" fill="white" />
          </svg>
        ) : cat.imageUrl ? (
          <img src={cat.imageUrl} alt={cat.label} className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] object-contain rounded-full" />
        ) : (
          cat.icon
        )}
      </div>
      <span
        className={`text-[9.5px] sm:text-[10px] mt-1.5 leading-none text-center max-w-[64px] sm:max-w-[76px] truncate ${
          active ? 'font-black text-[#3E5A44]' : 'font-bold text-[#3F2A20]'
        }`}
      >
        {cat.label}
      </span>
      {active && (
        <div className="w-5 h-[2px] bg-[#3E5A44] rounded-full mt-1" />
      )}
    </button>
  );
};

// Mithila Decorative Corner Flower
const CornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[13px] md:h-[13px] opacity-85 select-none pointer-events-none">
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#65B842" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#65B842" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#65B842" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#65B842" />
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

// Mithila Bottom Flourish Divider
const CardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#65B842" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#65B842" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#65B842" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#65B842" />
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
const TodaysDealCard = React.memo(({ deal, onNavigate, onAddToCart }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const title = deal.title || deal.name;
  const brand = deal.product?.brand || 'MITHILAKART';
  const price = deal.product?.price ?? deal.price;
  const mrp = deal.product?.mrp;
  const discount = deal.product?.discount || (mrp && price && mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : null);
  const rating = deal.product?.rating || deal.product?.ratingAvg || 4.6;

  return (
    <div
      onClick={() => onNavigate(deal)}
      className="flex flex-col cursor-pointer group w-full h-full relative bg-[#FFFDF9] border border-[#EADCC9]/70 rounded-[18px] md:rounded-[24px] p-2 md:p-3 shadow-[0_2px_8px_rgba(61,35,20,0.015)] hover:shadow-[0_6px_18px_rgba(61,35,20,0.04)] hover:border-[#3E5A44]/35 transition-all duration-300 transform select-none justify-between"
    >
      {/* Inner Decorative Dashed Border */}
      <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[#D35400]/20 rounded-[15px] md:rounded-[20px]" />

      {/* Corner Ornaments */}
      <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><CornerFlower /></div>
      <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><CornerFlower /></div>
      <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><CornerFlower /></div>
      <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><CornerFlower /></div>

      {/* Product Image Section */}
      <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#EADCC9]/40 p-1">
        <img
          src={deal.img}
          alt={title}
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
          <div className="absolute top-1.5 left-1.5 bg-[#3E5A44] text-white text-[7.5px] md:text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
            {discount}
          </div>
        )}

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded-[4px] shadow-xs border border-[#EADCC9]/30">
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
            {title}
          </h3>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[12px] md:text-[14px] font-black text-slate-900">₹{price}</span>
            {mrp && (
              <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-semibold">₹{mrp}</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-2.5 flex items-center justify-between gap-1 pt-1 border-t border-[#EADCC9]/40">
          <button
            onClick={(e) => onAddToCart(deal, e)}
            className="w-full py-1.5 px-2 bg-[#FFF8EE] hover:bg-[#3E5A44] text-[#3E5A44] hover:text-white border border-[#3E5A44]/30 rounded-xl text-[10px] md:text-[11px] font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs"
          >
            <ShoppingBag size={12} strokeWidth={2.2} />
            <span>Add to Cart</span>
          </button>
        </div>

        <CardBottomDivider />
      </div>
    </div>
  );
});

const Home = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('You Buy');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { selectedCategory, setSelectedCategory, homeSections, homeBanners, homeChips, fetchHomeSections } = useVendorStore();

  useEffect(() => {
    fetchHomeSections('standard');
  }, [fetchHomeSections, currentLanguage]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setActiveTab(categoryParam);
    }
  }, [categoryParam, setSelectedCategory]);

  const categoryBanners = useMemo(() => {
    const fallbackBanners = [
      { id: 'g1', image: '/Gemini_Generated_Image_pxcb6vpxcb6vpxcb.png', title: 'Shop More Save More' },
      { id: 'g2', image: '/Gemini_Generated_Image_rhy76srhy76srhy7.png', title: 'Authentic Mithila Artistry' },
      { id: 'g3', image: '/Gemini_Generated_Image_unwuxnunwuxnunwu.png', title: 'Cultural Heritage Collection' },
      { id: 'g4', image: '/Gemini_Generated_Image_xaqtwqxaqtwqxaqt.png', title: 'Special Festival Handicrafts' }
    ];

    const homeBannerList = mapHomeBanners(homeBanners, fallbackBanners);

    return {
      'Home': homeBannerList,
      'You Buy': homeBannerList,
      'Toys': homeBannerList,
      'Beauty': homeBannerList,
      'Art. Jewellery': homeBannerList,
      '1g Gold': homeBannerList,
      'Cosmetics': homeBannerList,
      'Fashion': homeBannerList
    };
  }, [homeBanners]);

  const mainCategoriesList = useMemo(() => {
    const iconMap = {
      'You Buy': <ShoppingBag size={18} className="text-[#3E5A44]" />,
      Fashion: <Shirt size={18} className="text-[#3E5A44]" />,
      Beauty: <Sparkles size={18} className="text-[#3E5A44]" />,
      'Beauty & Care': <Sparkles size={18} className="text-[#3E5A44]" />,
      Electronics: <Monitor size={18} className="text-[#3E5A44]" />,
      Jewellery: <Gem size={18} className="text-[#3E5A44]" />,
      Toys: <Gamepad2 size={18} className="text-[#3E5A44]" />,
      'Kids & Toys': <Gamepad2 size={18} className="text-[#3E5A44]" />,
      Stationery: <BookOpen size={18} className="text-[#3E5A44]" />,
      Gifting: <Gift size={18} className="text-[#3E5A44]" />,
      Electrical: <Zap size={18} className="text-[#3E5A44]" />,
    };

    const chipsSource = (homeChips && homeChips.length > 0) ? homeChips : [
      { id: 'for-you', label: 'You Buy' },
      { id: 'fashion', label: 'Fashion' },
      { id: 'beauty', label: 'Beauty' },
      { id: 'electronics', label: 'Electronics' },
      { id: 'jewellery', label: 'Jewellery' },
      { id: 'toys', label: 'Toys' },
      { id: 'stationery', label: 'Stationery' },
      { id: 'gifting', label: 'Gifting' },
      { id: 'electrical', label: 'Electrical' },
    ];

    return mapNavChips(chipsSource).map((chip) => {
      const raw = chip.rawLabel || chip.label;
      const isYouBuy = raw === 'You Buy' || chip.label === 'You Buy' || chip.id === 'for-you';
      const label = isYouBuy 
        ? t('categories.for-you', { defaultValue: chip.label || 'You Buy' })
        : (chip.label || t(`categories.${chip.id}`, { defaultValue: raw }));

      // Admin-selected React icon (dynamic, works for any newly created
      // header category chip) takes priority; legacy hardcoded lookup and
      // the generic bag icon remain as fallbacks for chips without one.
      const DynamicIcon = getHeaderChipIcon(chip.iconKey);
      const icon = DynamicIcon
        ? <DynamicIcon size={18} className="text-[#3E5A44]" />
        : (iconMap[raw] || iconMap[chip.id] || <ShoppingBag size={18} className="text-[#3E5A44]" />);

      return {
        id: chip.id,
        rawLabel: raw,
        label,
        isYouBuy,
        imageUrl: chip.imageUrl,
        icon,
      };
    });
  }, [homeChips, t]);

  const isCategoryActive = useCallback((cat) => {
    const raw = cat.rawLabel || cat.label;
    const isDefault = selectedCategory === 'You Buy' || selectedCategory === 'Home' || !selectedCategory;
    if (cat.isYouBuy || raw === 'You Buy' || cat.label === 'सभी' || cat.label === 'सभ' || cat.id === 'for-you') {
      return isDefault;
    }
    return selectedCategory === raw || selectedCategory === cat.label || selectedCategory === cat.id;
  }, [selectedCategory]);

  const handleCategoryClick = useCallback((cat) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const raw = cat.rawLabel || cat.label;
    if (cat.isYouBuy || raw === 'You Buy' || cat.label === 'सभी' || cat.label === 'सभ' || cat.id === 'for-you') {
      setSelectedCategory('You Buy');
      setActiveTab('You Buy');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('category');
        return next;
      }, { replace: true });
    } else {
      setSelectedCategory(raw);
      setActiveTab(raw);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('category', raw);
        return next;
      }, { replace: true });
    }
  }, [setSelectedCategory, setSearchParams]);

  // ── "More" overflow handling for the top category chip row ──
  // Measures real chip widths in a hidden unconstrained row and dynamically
  // shows as many visible chips as can comfortably fit within the available width.
  const chipRowRef = useRef(null);
  const chipsMeasureContainerRef = useRef(null);
  const moreChipMeasureRef = useRef(null);
  const moreButtonRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [visibleChipCount, setVisibleChipCount] = useState(mainCategoriesList.length);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreMenuPos, setMoreMenuPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const recomputeVisibleChips = () => {
      const wrapper = chipRowRef.current;
      const measureContainer = chipsMeasureContainerRef.current;
      const totalChips = mainCategoriesList.length;

      if (!wrapper || !measureContainer || totalChips === 0) return;

      const chipElements = Array.from(measureContainer.children);
      if (chipElements.length === 0) return;

      const wrapperStyle = window.getComputedStyle(wrapper);
      const paddingLeft = parseFloat(wrapperStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(wrapperStyle.paddingRight) || 0;
      const availableWidth = Math.floor(wrapper.clientWidth - paddingLeft - paddingRight);

      if (availableWidth <= 0) return;

      const gap = parseFloat(wrapperStyle.columnGap || wrapperStyle.gap) || 12;
      const moreBtn = moreChipMeasureRef.current;
      const moreWidth = moreBtn ? Math.ceil(moreBtn.getBoundingClientRect().width) : 56;

      // Measure real rendered width of each category chip
      const chipWidths = chipElements.map((el) => Math.ceil(el.getBoundingClientRect().width));

      // 1. Check if ALL category chips can fit comfortably without the "More" button
      let totalAllWidth = 0;
      for (let i = 0; i < totalChips; i++) {
        totalAllWidth += chipWidths[i] + (i > 0 ? gap : 0);
      }

      if (totalAllWidth <= availableWidth) {
        // All categories fit! No need for the "More" button; 0 space reserved for More.
        setVisibleChipCount((prev) => (prev === totalChips ? prev : totalChips));
        return;
      }

      // 2. Not all categories fit. Reserve space for the "More" button and
      // find the maximum number of chips that can comfortably fit.
      let accumulatedWidth = 0;
      let count = 0;

      for (let i = 0; i < totalChips; i++) {
        const nextAccumulated = accumulatedWidth + chipWidths[i] + (i > 0 ? gap : 0);
        // Space needed if we display (i + 1) chips PLUS the "More" button:
        const requiredWithMore = nextAccumulated + gap + moreWidth;

        if (requiredWithMore <= availableWidth) {
          count = i + 1;
          accumulatedWidth = nextAccumulated;
        } else {
          break;
        }
      }

      // When total categories > 4, ensure at least 4 are visible before More
      // as explicitly requested: "agar 4 se jada h header category to is tareeke ka dikhna chahiye na kam se kam"
      const minVisible = totalChips > 4 ? 4 : 1;
      const finalCount = Math.min(totalChips - 1, Math.max(minVisible, count));
      setVisibleChipCount((prev) => (prev === finalCount ? prev : finalCount));
    };

    recomputeVisibleChips();

    // Double-check on next animation frame to guarantee dimensions after fonts/styles apply
    const frameId = requestAnimationFrame(recomputeVisibleChips);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        recomputeVisibleChips();
      });
      if (chipRowRef.current) ro.observe(chipRowRef.current);
      if (chipsMeasureContainerRef.current) ro.observe(chipsMeasureContainerRef.current);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(recomputeVisibleChips);
    }

    window.addEventListener('resize', recomputeVisibleChips);
    window.addEventListener('orientationchange', recomputeVisibleChips);

    return () => {
      cancelAnimationFrame(frameId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', recomputeVisibleChips);
      window.removeEventListener('orientationchange', recomputeVisibleChips);
    };
  }, [mainCategoriesList, selectedCategory, currentLanguage]);

  // Close the "More" dropdown on outside click, Escape, or page scroll (ignoring scroll inside the menu itself)
  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (e) => {
      if (
        (moreMenuRef.current && (moreMenuRef.current === e.target || moreMenuRef.current.contains(e.target))) ||
        (moreButtonRef.current && (moreButtonRef.current === e.target || moreButtonRef.current.contains(e.target)))
      ) {
        return;
      }
      setMoreOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    const handleScroll = (e) => {
      // Do not close if the scroll event occurred inside the dropdown menu itself
      if (
        moreMenuRef.current &&
        (e.target === moreMenuRef.current || moreMenuRef.current.contains(e.target))
      ) {
        return;
      }
      setMoreOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [moreOpen]);

  const toggleMoreMenu = useCallback(() => {
    if (!moreOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      const menuWidth = 220;
      const margin = 12;
      const left = Math.min(
        Math.max(rect.right - menuWidth, margin),
        window.innerWidth - menuWidth - margin
      );
      setMoreMenuPos({ top: rect.bottom + 8, left });
    }
    setMoreOpen((prev) => !prev);
  }, [moreOpen]);

  const hiddenChipsList = mainCategoriesList.slice(visibleChipCount);

  return (
    <>
      <SEO
        title="Quick Commerce & Everyday Essentials"
        description="Shop Mithilakart for groceries, fashion, electronics, beauty and authentic Mithila crafts — fast quick-commerce delivery and standard shipping, all in one place."
        path="/home"
      />
    <div className="pb-2 bg-transparent text-primary-dark">
      {/* 1. TOP HORIZONTAL CATEGORY ROW (Sticky Header Categories on Scroll) */}
      <div className="sticky top-[var(--mobile-header-height,170px)] md:top-[var(--desktop-header-height,57px)] z-40 bg-[#F6F8F3]/95 backdrop-blur-md shadow-[0_2px_8px_rgba(63,42,32,0.04)] border-b border-[#EADCC9]/40 py-2 mb-3 transition-all duration-200">
        <div ref={chipRowRef} className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar px-2 sm:px-3">
          {mainCategoriesList.slice(0, visibleChipCount).map((cat, idx) => (
            <CategoryChip key={cat.id ?? idx} cat={cat} active={isCategoryActive(cat)} onClick={() => handleCategoryClick(cat)} />
          ))}

          {hiddenChipsList.length > 0 && (
            <button
              ref={moreButtonRef}
              type="button"
              onClick={toggleMoreMenu}
              aria-haspopup="true"
              aria-expanded={moreOpen}
              aria-label="More categories"
              className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full bg-[#3E5A44] border border-[#3E5A44] text-white flex items-center justify-center shadow-xs">
                <MoreHorizontal size={18} />
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-bold text-[#3F2A20] mt-1.5 leading-none">
                {t('common.more', { defaultValue: 'More' })}
              </span>
            </button>
          )}
        </div>

        {/* Hidden measuring row: renders every chip (+ a ghost "More" chip) off-screen
            so we can read their real widths and decide how many actually fit above. */}
        <div
          aria-hidden="true"
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3"
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            width: 'max-content',
            contain: 'paint layout',
            opacity: 0,
            zIndex: -9999,
          }}
        >
          <div ref={chipsMeasureContainerRef} className="flex items-center gap-2 sm:gap-3">
            {mainCategoriesList.map((cat, idx) => (
              <CategoryChip key={cat.id ?? idx} cat={cat} active={isCategoryActive(cat)} onClick={() => {}} />
            ))}
          </div>
          <button ref={moreChipMeasureRef} type="button" tabIndex={-1} className="flex flex-col items-center flex-shrink-0">
            <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full bg-[#3E5A44] border border-[#3E5A44] text-white flex items-center justify-center shadow-xs">
              <MoreHorizontal size={18} />
            </div>
            <span className="text-[9.5px] sm:text-[10px] font-bold mt-1.5 leading-none">
              {t('common.more', { defaultValue: 'More' })}
            </span>
          </button>
        </div>
      </div>

      {/* "More" categories dropdown — fixed-positioned so it is never clipped by the
          horizontally-scrolling chip row, and repositions near screen edges. */}
      {moreOpen && hiddenChipsList.length > 0 && (
        <div
          ref={moreMenuRef}
          role="menu"
          aria-label="More categories"
          className="fixed z-[70] w-[220px] overflow-y-auto overscroll-contain touch-pan-y rounded-2xl border border-[#EADCC9] bg-white shadow-[0_12px_30px_rgba(63,42,32,0.18)] p-2"
          style={{
            top: moreMenuPos.top,
            left: moreMenuPos.left,
            maxHeight: `min(70vh, calc(100dvh - ${moreMenuPos.top + 76}px))`,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {hiddenChipsList.map((cat, idx) => {
            const active = isCategoryActive(cat);
            return (
              <button
                key={cat.id ?? `more-${idx}`}
                type="button"
                role="menuitem"
                onClick={() => {
                  handleCategoryClick(cat);
                  setMoreOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[12.5px] font-bold transition-colors cursor-pointer ${
                  active ? 'bg-[#3E5A44]/10 text-[#3E5A44]' : 'text-[#3F2A20] hover:bg-[#FFF8EE]'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-[#EADCC9]/25 flex items-center justify-center flex-shrink-0 text-[#3E5A44]">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.label} className="w-4 h-4 object-contain rounded-full" />
                  ) : (
                    cat.icon
                  )}
                </span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. HERO BANNER CAROUSEL (Auto-scrolling Banner Section) */}
      {(selectedCategory === 'You Buy' || selectedCategory === 'Home') && (
        <div className="px-3 mb-5 md:mb-8">
          <BannerCarousel banners={categoryBanners[selectedCategory] || categoryBanners['Home']} />
        </div>
      )}


      {/* 3. SHOP BY CATEGORIES SECTION */}
      {(selectedCategory === 'You Buy' || selectedCategory === 'Home') && (
        <div className="mb-5 md:mb-8">
          <SubCategoryGrid />
        </div>
      )}

      {/* 4. TRENDING THIS WEEK SECTION */}
      {(selectedCategory === 'You Buy' || selectedCategory === 'Home') && (
        <div className="mb-5 md:mb-8">
          <TrendingThisWeek />
        </div>
      )}

      {/* 5. TODAY'S SPECIAL DEALS SECTION */}
      {(selectedCategory === 'You Buy' || selectedCategory === 'Home') && (
        <div className="py-2 px-3 w-full max-w-[1600px] mx-auto select-none mb-5 md:mb-8">
          <div className="flex justify-between items-center mb-3.5 px-1">
            <h2 className="text-[15.5px] font-black text-[#3F2A20] tracking-tight">
              Today's Special Deals
            </h2>
            <span
              onClick={() => navigate('/deals', {
                state: {
                  deals: homeSections.todaysSpecialDeals?.length ? homeSections.todaysSpecialDeals : homeSections.brandsSpotlight || [],
                  title: "Today's Special Deals"
                }
              })}
              className="text-[11.5px] font-bold text-[#3E5A44] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              View All <ChevronRight size={13} strokeWidth={2.5} className="inline-block" />
            </span>
          </div>

          <div className="flex items-stretch gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1 -mx-1 px-1">
            {(homeSections.todaysSpecialDeals?.length ? homeSections.todaysSpecialDeals : homeSections.brandsSpotlight || []).map((deal) => (
              <div key={deal.id} className="w-[165px] sm:w-[195px] md:w-[220px] flex-shrink-0 snap-start flex flex-col">
                <TodaysDealCard
                  deal={deal}
                  onNavigate={(d) => navigate('/product-detail', { state: { productId: d.id, product: d.product } })}
                  onAddToCart={async (d, e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    try {
                      await addProductToCart({
                        id: d.productId || d.product?._id || d.product?.id || d.id,
                        listingId: d.listingId,
                        marketplaceTab: 'mithilakart',
                        name: d.title || d.name,
                        price: d.product?.price ?? d.price,
                        image: d.img,
                      });
                      toast.success(`${d.title || d.name} added to cart!`);
                    } catch (err) {
                      toast.error(err?.message || 'Could not add to cart');
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RESTORED PREVIOUS SECTIONS */}
      {(selectedCategory === 'You Buy' || selectedCategory === 'Home') && (
        <>

          <div className="mb-5 md:mb-8">
            <LazySection height="400px">
              <TopSelection items={homeSections.topSelection} />
            </LazySection>
          </div>

          <div className="mb-5 md:mb-8">
            <LazySection height="350px">
              <BrandsSpotlight items={homeSections.brandsSpotlight?.length ? homeSections.brandsSpotlight : homeSections.topSelection} />
            </LazySection>
          </div>

          <div className="mb-5 md:mb-8">
            <LazySection height="500px">
              <BestQuality items={homeSections.bestQualityGuaranteed?.length ? homeSections.bestQualityGuaranteed : (homeSections.bestQuality?.length ? homeSections.bestQuality : homeSections.topSelection)} />
            </LazySection>
          </div>


        </>
      )}

      {selectedCategory !== 'You Buy' && selectedCategory !== 'Home' && (
        <CategoryProductsSection 
          selectedCategory={selectedCategory}
          onResetToAll={() => {
            setSelectedCategory('You Buy');
            setActiveTab('You Buy');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('category');
              return next;
            }, { replace: true });
          }}
        />
      )}
      </div>
    </>
  );
};

export default React.memo(Home);
