import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Sparkles, Gift, Monitor, Gem, Shirt, Gamepad2, BookOpen, Zap, ChevronRight } from 'lucide-react';
import SEO from '../../../shared/components/SEO';

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

      return {
        id: chip.id,
        rawLabel: raw,
        label,
        isYouBuy,
        icon: iconMap[raw] || iconMap[chip.id] || <ShoppingBag size={18} className="text-[#3E5A44]" />,
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
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-3">
          {mainCategoriesList.map((cat, idx) => {
            const active = isCategoryActive(cat);

            if (active) {
              return (
                <div
                  key={idx}
                  onClick={() => handleCategoryClick(cat)}
                  className="relative flex flex-col items-center justify-center flex-shrink-0 w-[64px] h-[72px] rounded-[16px] transition-all duration-300 border border-[#EADCC9] bg-[#FFF8EE] shadow-sm cursor-pointer active:scale-95 overflow-hidden"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 2h1v1H2zm4 4h1v1H6z' fill='%23EADCC9' fill-opacity='0.15'/%3E%3C/svg%3E")`,
                    backgroundSize: '10px 10px',
                  }}
                >
                  {/* Dashed Circle with Icon + Flowers */}
                  <div className="relative w-[36px] h-[36px] rounded-full border border-dashed border-[#3E5A44]/75 bg-[#FFFBF7] flex items-center justify-center mt-1 shadow-3xs text-[#3E5A44]">
                    {cat.isYouBuy ? (
                      /* Shopping Bag with White Heart Cutout */
                      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#3E5A44">
                        <path d="M12 2C9.5 2 7.5 4 7.5 6.5H9c0-1.7 1.3-3 3-3s3 1.3 3 3h1.5C16.5 4 14.5 2 12 2z" />
                        <path d="M5 6.5h14c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2z" />
                        <path d="M12 16.8s-2.2-1.8-2.7-2.3c-.7-.7-1-1.3-1-1.8 0-1.2 1-2.2 2.2-2.2.7 0 1.3.4 1.5 1 .2-.6.8-1 1.5-1 1.2 0 2.2 1 2.2 2.2 0 .5-.3 1.1-1 1.8-.5.5-2.7 2.3-2.7 2.3z" fill="white" />
                      </svg>
                    ) : (
                      cat.icon
                    )}

                    {/* Top-Right Orange Flower Decoration */}
                    <div className="absolute -top-[5px] -right-[5px] w-[9px] h-[9px] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible">
                        <circle cx="12" cy="12" r="5.5" fill="#E26D22" />
                        <circle cx="12" cy="5" r="5.5" fill="#E26D22" />
                        <circle cx="12" cy="19" r="5.5" fill="#E26D22" />
                        <circle cx="5" cy="12" r="5.5" fill="#E26D22" />
                        <circle cx="19" cy="12" r="5.5" fill="#E26D22" />
                        <circle cx="12" cy="12" r="2.2" fill="#3E5A44" />
                      </svg>
                    </div>

                    {/* Bottom-Left small flower stem decoration */}
                    <div className="absolute -left-[5px] bottom-[3px] flex items-center gap-0.5">
                      <span className="w-1.2 h-1.2 rounded-full bg-[#E26D22] shadow-3xs" />
                      <span className="w-1.2 h-[1.2px] bg-[#3E5A44] rotate-12" />
                    </div>

                    {/* Bottom-Right small flower stem decoration */}
                    <div className="absolute -right-[5px] bottom-[3px] flex items-center gap-0.5">
                      <span className="w-1.2 h-[1.2px] bg-[#3E5A44] -rotate-12" />
                      <span className="w-1.2 h-1.2 rounded-full bg-[#E26D22] shadow-3xs" />
                    </div>
                  </div>

                  {/* Category Label at bottom */}
                  <span className="text-[9.5px] font-black text-center text-[#3E5A44] mt-1.5 leading-none">
                    {cat.label}
                  </span>

                  {/* Thick bottom line indicator */}
                  <div className="w-6 h-[2px] bg-[#3E5A44] rounded-full mt-1.5" />
                </div>
              );
            }

            return (
              <div
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-[50px] h-[50px] rounded-full bg-[#EADCC9]/20 border border-[#EADCC9]/55 flex items-center justify-center shadow-[0_1.5px_4px_rgba(0,0,0,0.015)] text-[#3E5A44]">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-bold text-[#3F2A20] mt-1.5 leading-none">
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

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
              onClick={() => navigate('/deals')}
              className="text-[11.5px] font-bold text-[#3E5A44] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              View All <ChevronRight size={13} strokeWidth={2.5} className="inline-block" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(homeSections.todaysSpecialDeals?.length ? homeSections.todaysSpecialDeals : homeSections.brandsSpotlight || []).slice(0, 3).map((deal) => (
              <div
                key={deal.id}
                onClick={() => navigate('/product-detail', { state: { productId: deal.id, product: deal.product } })}
                className="bg-white border border-[#EADCC9]/55 rounded-2xl p-2 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.015)]"
              >
                <div className="absolute top-2 left-2 bg-[#3E5A44] text-white text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
                  {deal.product?.discount || 'DEAL'}
                </div>

                <div className="w-full aspect-square bg-[#FAF9F5] border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-1.5 mt-4 mb-2">
                  <img
                    src={deal.img}
                    alt={deal.title || deal.name}
                    className="max-h-full max-w-full object-cover rounded-lg"
                  />
                </div>

                <div>
                  <span className="text-slate-450 text-[8.5px] font-black block">{deal.product?.brand || 'Seller'}</span>
                  <h3 className="text-[10px] font-black text-[#3F2A20] leading-tight mt-0.5 truncate">{deal.title || deal.name}</h3>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline gap-1">
                      {deal.product?.mrp ? (
                        <span className="text-[9px] text-slate-400 line-through">₹{deal.product.mrp}</span>
                      ) : null}
                      <span className="text-[11.5px] font-black text-slate-900">₹{deal.product?.price ?? deal.price}</span>
                    </div>
                    
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        try {
                          await addProductToCart({
                            id: deal.id,
                            name: deal.title || deal.name,
                            price: deal.product?.price ?? deal.price,
                            image: deal.img,
                          });
                          toast.success(`${deal.title || deal.name} added to cart!`);
                        } catch {
                          toast.error('Could not add to cart');
                        }
                      }}
                      className="p-1.5 bg-white border border-[#3E5A44]/30 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer active:scale-90"
                    >
                      <svg className="w-3.5 h-3.5 text-[#3F2A20]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                </div>
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
