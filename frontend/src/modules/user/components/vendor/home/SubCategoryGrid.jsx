import React, { useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useVendorStore from '../../../../../store/useVendorStore';
import { mapShopCategoryCards } from '../../../utils/mappers';
import { handleImageError } from '../../../../../shared/utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../../shared/context/LanguageContext';

const SubCategoryGrid = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { homeCategories, setSelectedCategory } = useVendorStore();

  const categoryItems = useMemo(
    () => mapShopCategoryCards(homeCategories, currentLanguage),
    [homeCategories, currentLanguage]
  );

  const handleCategorySelect = useCallback((item) => {
    const rawCategory = item.rawName || item.name;
    if (setSelectedCategory) {
      setSelectedCategory(rawCategory);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('category', rawCategory);
      return next;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSelectedCategory, setSearchParams]);

  if (!categoryItems.length) return null;

  return (
    <div className="py-4 px-3 w-full max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-4">
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

      {/* Single Row Horizontal Scroll Container */}
      <div className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-1 px-1">
        {categoryItems.map((item) => (
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
