import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useVendorStore from '../../../../../store/useVendorStore';
import { mapShopCategoryCards, findCategoryByName } from '../../../utils/mappers';
import { handleImageError, getImageUrl } from '../../../../../shared/utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../../shared/context/LanguageContext';

// Curated fallbacks for clothing & fashion subcategories when Admin hasn't set an image
import FashionHero from '../../../../../assets/products/product06.jpg';
import ClothesImg from '../../../../../assets/products/product15.webp';
import Tshirt from '../../../../../assets/products/product05.jpg';
import FlipFlops from '../../../../../assets/products/product07.jpg';
import JewelleryImg from '../../../../../assets/products/product12.jpg';
import FashionTabProduct from '../../../../../assets/products/product10.jpg';
import SmartGadgetsImg from '../../../../../assets/products/product01.jpg';

export const getFashionFallbackImage = (name = '') => {
  const n = String(name).toLowerCase();
  if (n.includes('t-shirt') || n.includes('polo') || n.includes('sports')) return Tshirt;
  if (n.includes('shirt') || n.includes('top') || n.includes('blouse') || n.includes('saree') || n.includes('kurti') || n.includes('dress') || n.includes('sleepwear')) return ClothesImg;
  if (n.includes('jeans') || n.includes('denim') || n.includes('trouser') || n.includes('formal') || n.includes('workwear') || n.includes('suit') || n.includes('blazer')) return FashionHero;
  if (n.includes('festive') || n.includes('ethnic') || n.includes('lehenga')) return FashionTabProduct;
  if (n.includes('shoe') || n.includes('boot') || n.includes('sandal') || n.includes('footwear') || n.includes('flip')) return FlipFlops;
  if (n.includes('watch') || n.includes('glass') || n.includes('frame')) return SmartGadgetsImg;
  if (n.includes('jewel') || n.includes('ring') || n.includes('chain') || n.includes('belt') || n.includes('tie') || n.includes('cufflink') || n.includes('wallet')) return JewelleryImg;
  return FashionHero;
};

const SubCategoryGrid = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { homeCategories, setSelectedCategory } = useVendorStore();

  const [activeTab, setActiveTab] = useState('all');

  // Top level categories
  const categoryItems = useMemo(
    () => mapShopCategoryCards(homeCategories, currentLanguage),
    [homeCategories, currentLanguage]
  );

  // Locate Men's Wear and Women's Wear nodes from category tree
  const mensWearNode = useMemo(() => {
    return (
      findCategoryByName(homeCategories, "Men's Wear") ||
      findCategoryByName(homeCategories, "Men's") ||
      findCategoryByName(homeCategories, 'Mens Wear')
    );
  }, [homeCategories]);

  const womensWearNode = useMemo(() => {
    return (
      findCategoryByName(homeCategories, "Women's Wear") ||
      findCategoryByName(homeCategories, "Women's") ||
      findCategoryByName(homeCategories, 'Womens Wear')
    );
  }, [homeCategories]);

  // Subcategories of Men's Wear (Casual Shirts, Jeans, Denim wear, Festive wear, Workwear, Sleepwear, etc.)
  const mensItems = useMemo(() => {
    const raw = Array.isArray(mensWearNode?.children) ? mensWearNode.children : [];
    return raw
      .filter((c) => c.isActive !== false)
      .map((c) => {
        const rawImg = c.imageUrl || c.iconUrl;
        const img = rawImg && !rawImg.includes('via.placeholder') ? getImageUrl(rawImg) : getFashionFallbackImage(c.name);
        return {
          id: c.id || c._id,
          name: c.name,
          rawName: c.name,
          slug: c.slug,
          parentCategory: 'Fashion',
          parentSubcategory: "Men's Wear",
          img,
        };
      });
  }, [mensWearNode]);

  // Subcategories of Women's Wear (Casual Shirts, Tops, Jeans, Kurti sets, Sarees, etc.)
  const womensItems = useMemo(() => {
    const raw = Array.isArray(womensWearNode?.children) ? womensWearNode.children : [];
    return raw
      .filter((c) => c.isActive !== false)
      .map((c) => {
        const rawImg = c.imageUrl || c.iconUrl;
        const img = rawImg && !rawImg.includes('via.placeholder') ? getImageUrl(rawImg) : getFashionFallbackImage(c.name);
        return {
          id: c.id || c._id,
          name: c.name,
          rawName: c.name,
          slug: c.slug,
          parentCategory: 'Fashion',
          parentSubcategory: "Women's Wear",
          img,
        };
      });
  }, [womensWearNode]);

  // Current display items based on active tab
  const displayItems = useMemo(() => {
    if (activeTab === 'mens') return mensItems;
    if (activeTab === 'womens') return womensItems;
    return categoryItems;
  }, [activeTab, mensItems, womensItems, categoryItems]);

  const handleCategorySelect = useCallback(
    (item) => {
      if (activeTab === 'mens') {
        if (setSelectedCategory) setSelectedCategory('Fashion');
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('category', 'Fashion');
          next.set('subcategory', item.rawName || item.name);
          return next;
        }, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (activeTab === 'womens') {
        if (setSelectedCategory) setSelectedCategory('Fashion');
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('category', 'Fashion');
          next.set('subcategory', item.rawName || item.name);
          return next;
        }, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const rawCategory = item.rawName || item.name;
      if (setSelectedCategory) {
        setSelectedCategory(rawCategory);
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('category', rawCategory);
          next.delete('subcategory');
          return next;
        },
        { replace: true }
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeTab, setSelectedCategory, setSearchParams]
  );

  if (!displayItems.length && !categoryItems.length) return null;

  return (
    <div className="py-4 px-3 w-full max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[15px] font-black text-[#3F2A20] tracking-tight">
          {t('home.shopByCategories', { defaultValue: 'Shop by Categories' })}
        </h2>
        <span
          onClick={() => navigate('/categories')}
          className="text-xs font-bold text-[#65B842] hover:text-[#529C33] cursor-pointer hover:underline transition-colors"
        >
          {t('common.viewAll', { defaultValue: 'View All' })}
        </span>
      </div>

      {/* Category & Subcategory Filter Tabs (All / Men's Wear / Women's Wear) */}
      <div className="flex items-center gap-2 mb-3.5 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 border ${
            activeTab === 'all'
              ? 'bg-[#3E5A44] text-white border-[#3E5A44] shadow-xs'
              : 'bg-white text-[#3F2A20] border-[#EADCC9]/80 hover:bg-[#FFF8EE]'
          }`}
        >
          {t('common.allCategories', { defaultValue: 'All Categories' })}
        </button>

        {mensItems.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('mens')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 border ${
              activeTab === 'mens'
                ? 'bg-[#3E5A44] text-white border-[#3E5A44] shadow-xs'
                : 'bg-white text-[#3F2A20] border-[#EADCC9]/80 hover:bg-[#FFF8EE]'
            }`}
          >
            <span>{t('categories.mensWear', { defaultValue: "Men's Wear" })}</span>
            <span
              className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'mens' ? 'bg-white/25 text-white' : 'bg-[#EADCC9]/60 text-[#3E5A44]'
              }`}
            >
              {mensItems.length}
            </span>
          </button>
        )}

        {womensItems.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('womens')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 border ${
              activeTab === 'womens'
                ? 'bg-[#3E5A44] text-white border-[#3E5A44] shadow-xs'
                : 'bg-white text-[#3F2A20] border-[#EADCC9]/80 hover:bg-[#FFF8EE]'
            }`}
          >
            <span>{t('categories.womensWear', { defaultValue: "Women's Wear" })}</span>
            <span
              className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'womens' ? 'bg-white/25 text-white' : 'bg-[#EADCC9]/60 text-[#3E5A44]'
              }`}
            >
              {womensItems.length}
            </span>
          </button>
        )}
      </div>

      {/* Single Row Horizontal Scroll Container */}
      <div className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-1 px-1">
        {displayItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleCategorySelect(item)}
            className="flex-shrink-0 w-[98px] sm:w-[112px] md:w-[130px] flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-full aspect-[1/1.22] bg-white border border-[#EADCC9]/60 rounded-[20px] overflow-hidden flex flex-col items-center justify-between p-2 md:p-2.5 shadow-[0_3px_8px_rgba(61,35,20,0.015)] group-hover:shadow-[0_6px_15px_rgba(61,35,20,0.05)] group-hover:border-[#65B842]/40 transition-all duration-300 transform">
              <div className="w-full h-[28px] sm:h-[32px] md:h-[34px] flex items-center justify-center px-0.5">
                <span className="text-[9.5px] sm:text-[11px] md:text-xs font-bold text-[#3F2A20] text-center leading-[1.18] tracking-tight line-clamp-2 break-words">
                  {item.name}
                </span>
              </div>

              <div className="w-[84%] aspect-square rounded-[14px] overflow-hidden bg-[#FAF9F5] border border-[#EADCC9]/40 flex items-center justify-center p-0.5 mb-0.5 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover rounded-[11px] group-hover:scale-[1.04] transition-transform duration-500"
                  />
                ) : (
                  <span className="text-[12px] font-black text-[#65B842]">{item.name.charAt(0)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubCategoryGrid;
