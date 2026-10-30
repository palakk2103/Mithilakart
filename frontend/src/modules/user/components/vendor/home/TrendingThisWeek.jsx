import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useVendorStore from '../../../../../store/useVendorStore';
import { handleImageError, getProductImage } from '../../../../../shared/utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../../shared/context/LanguageContext';

const HeaderFlower = ({ isMithilak }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle mx-1">
    <path d="M12 2C13.5 6.5 13.5 6.5 12 11C10.5 6.5 10.5 6.5 12 2Z" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M12 22C13.5 17.5 13.5 17.5 12 13C10.5 17.5 10.5 17.5 12 22Z" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M2 12C6.5 13.5 6.5 13.5 11 12C6.5 10.5 6.5 10.5 2 12Z" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M22 12C17.5 13.5 17.5 13.5 13 12C17.5 10.5 17.5 10.5 22 12Z" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M5.5 5.5C8.5 7.5 8.5 7.5 10 9C8.5 8.5 8.5 8.5 5.5 5.5Z" fill={isMithilak ? "#5DB6C3" : "#D35400"} stroke={isMithilak ? "#5DB6C3" : "#D35400"} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.5 5.5C15.5 7.5 15.5 7.5 14 9C15.5 8.5 15.5 8.5 18.5 5.5Z" fill={isMithilak ? "#5DB6C3" : "#D35400"} stroke={isMithilak ? "#5DB6C3" : "#D35400"} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.5 18.5C8.5 16.5 8.5 16.5 10 15C8.5 15.5 8.5 15.5 5.5 18.5Z" fill={isMithilak ? "#5DB6C3" : "#D35400"} stroke={isMithilak ? "#5DB6C3" : "#D35400"} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.5 18.5C15.5 16.5 15.5 16.5 14 15C15.5 15.5 15.5 15.5 18.5 18.5Z" fill={isMithilak ? "#5DB6C3" : "#D35400"} stroke={isMithilak ? "#5DB6C3" : "#D35400"} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" fill={isMithilak ? "#207C8A" : "#E67E22"} />
    <circle cx="12" cy="12" r="1.2" fill="#FFF" />
  </svg>
);

const ViewAllIcon = ({ isMithilak }) => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block ml-0.5 align-middle">
    <path d="M6 4L14 12L6 20" stroke={isMithilak ? "#207C8A" : "#4B6C36"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 4L21 12L13 20" stroke={isMithilak ? "#207C8A" : "#4B6C36"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

const CardFlowerGarland = ({ isMithilak }) => (
  <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="my-0.5 select-none w-[52px] min-[375px]:w-[62px] md:w-[75px] h-auto">
    <path d="M60 12 C48 15, 34 16, 22 11" stroke={isMithilak ? "#207C8A" : "#4B6C36"} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M48 13.5 C46.5 10.5, 42.5 10.5, 41 13" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M36 12.5 C34.5 9.5, 30.5 9.5, 29 12" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M60 12 C72 15, 86 16, 98 11" stroke={isMithilak ? "#207C8A" : "#4B6C36"} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M72 13.5 C73.5 10.5, 77.5 10.5, 79 13" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <path d="M84 12.5 C85.5 9.5, 89.5 9.5, 91 12" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
    <circle cx="43" cy="15" r="1.5" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="31" cy="14.5" r="1.5" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="77" cy="15" r="1.5" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="89" cy="14.5" r="1.5" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="60" cy="12" r="3.5" fill={isMithilak ? "#207C8A" : "#E67E22"} />
    <circle cx="60" cy="5.5" r="2.2" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="60" cy="18.5" r="2.2" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="53.5" cy="12" r="2.2" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
    <circle cx="66.5" cy="12" r="2.2" fill={isMithilak ? "#5DB6C3" : "#D35400"} />
  </svg>
);

const ViewStoreDivider = ({ isMithilak }) => (
  <svg viewBox="0 0 24 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 mt-0.5 w-[12px] md:w-[15px] h-auto">
    <path d="M2 3H9M15 3H22" stroke={isMithilak ? "#5DB6C3" : "#E67E22"} strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="3" r="1.5" fill={isMithilak ? "#207C8A" : "#4B6C36"} />
  </svg>
);

const TrendingThisWeek = ({ theme }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { homeSections } = useVendorStore();

  const isMithilak = theme === 'mithilak' || location.pathname.includes('/mithilak') || localStorage.getItem('isMithilakFlow') === 'true';

  const rawList = homeSections.trendingThisWeek?.length
    ? homeSections.trendingThisWeek
    : homeSections.stillLooking?.length
    ? homeSections.stillLooking
    : homeSections.topSelection || [];

  const trendingItems = rawList.map((item, index) => {
    const prod = item.product || {};
    const name = (currentLanguage !== 'en' && (prod.translations?.[currentLanguage]?.title || item.translations?.[currentLanguage]?.title)) 
      || item.title 
      || item.name 
      || item.label 
      || prod.title 
      || prod.name 
      || 'Trending Product';
    const image = getProductImage(item.img || item.image || prod.image || (Array.isArray(prod.images) ? prod.images[0]?.url : null));
    const price = item.price ?? prod.price;

    return {
      id: item.id || prod._id || prod.id || index,
      name,
      img: image,
      price,
      product: prod,
    };
  });

  const handleProductClick = useCallback((item) => {
    const prod = item.product || {};
    navigate('/product-detail', {
      state: {
        product: {
          id: item.id || prod._id || prod.id,
          name: item.name,
          brand: prod.brand || 'Trending Product',
          price: item.price || prod.price || 0,
          oldPrice: prod.mrp || item.mrp || item.price || 0,
          image: item.img,
          label: 'Trending This Week',
        },
      },
    });
  }, [navigate]);

  if (!trendingItems.length) return null;

  return (
    <div className={`w-full select-none ${isMithilak ? 'py-1 px-0' : 'py-1 px-2.5 max-w-[1600px] mx-auto'}`}>
      <div className={`transition-all duration-300 font-raleway ${
        isMithilak
          ? 'bg-gradient-to-r from-[#EBF7F9] to-[#F5FAFA] rounded-[18px] md:rounded-[22px] p-3 md:p-4 text-slate-800 shadow-[0_2px_12px_rgba(32,124,138,0.06)] border border-[#BCE3E8]'
          : 'bg-[#FCF7EE] rounded-[16px] md:rounded-[20px] p-2 md:p-3 text-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-[#F3E3CD]/60'
      }`}>
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center">
            <HeaderFlower isMithilak={isMithilak} />
            <h3 className={`text-[11px] md:text-sm font-black uppercase tracking-wide font-montserrat ${
              isMithilak ? 'text-[#1A4B53]' : 'text-[#3C2415]'
            }`}>
              {t('home.trendingThisWeek', { defaultValue: 'Trending This Week' })}
            </h3>
            <HeaderFlower isMithilak={isMithilak} />
          </div>
          <button
            onClick={() => navigate('/all-offers')}
            className={`text-[9px] md:text-xs font-bold flex items-center transition-colors duration-200 ${
              isMithilak ? 'text-[#207C8A] hover:text-[#165A64]' : 'text-[#4B6C36] hover:text-[#385227]'
            }`}
          >
            {t('common.viewAll', { defaultValue: 'View All' })}
            <ViewAllIcon isMithilak={isMithilak} />
          </button>
        </div>

        <div className={`flex overflow-x-auto no-scrollbar pb-1 ${isMithilak ? 'gap-2.5 md:gap-3.5' : 'gap-2'}`}>
          {trendingItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleProductClick(item)}
              className={`flex-shrink-0 flex flex-col items-center cursor-pointer transition-all duration-300 group ${
                isMithilak
                  ? 'w-[96px] min-[375px]:w-[108px] md:w-[145px] bg-white rounded-t-[75px] md:rounded-t-[90px] rounded-b-[14px] md:rounded-b-[18px] p-2 pt-3.5 md:p-2.5 md:pt-4.5 border border-[#BCE3E8]/80 hover:border-[#207C8A] hover:shadow-sm'
                  : 'w-[84px] min-[375px]:w-[94px] md:w-[130px] bg-[#FCF7EE] rounded-t-[75px] md:rounded-t-[90px] rounded-b-[12px] md:rounded-b-[15px] p-1.5 pt-3 md:p-2 md:pt-4 border border-[#F1E1CE] hover:shadow-xs hover:border-[#E5D2BA]'
              }`}
            >
              <span className={`text-[8px] min-[375px]:text-[9px] md:text-xs font-black text-center mt-1 mb-0.5 transition-colors duration-200 line-clamp-2 w-full px-0.5 leading-tight ${
                isMithilak ? 'text-[#1A4B53] group-hover:text-[#207C8A]' : 'text-[#3C2415] group-hover:text-[#D35400]'
              }`}>
                {item.name}
              </span>

              <div className={`relative aspect-[1/1.25] flex items-center justify-center mb-0.5 ${
                isMithilak ? 'w-[68px] min-[375px]:w-[78px] md:w-[105px]' : 'w-[60px] min-[375px]:w-[70px] md:w-[95px]'
              }`}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 100 125">
                  <ellipse cx="50" cy="62.5" rx="45" ry="56" fill="none" stroke={isMithilak ? "#207C8A" : "#D35400"} strokeWidth="1.2" strokeDasharray="2, 5" />
                  <ellipse cx="50" cy="62.5" rx="41" ry="51" fill="none" stroke={isMithilak ? "#5DB6C3" : "#7A5A44"} strokeWidth="0.8" strokeDasharray="1, 3.5" />
                </svg>

                <div className={`w-[76%] h-[82%] rounded-[50%/50%] overflow-hidden bg-white flex items-center justify-center p-1 shadow-inner group-hover:scale-102 transition-transform duration-300 border ${
                  isMithilak ? 'border-[#BCE3E8]/40' : 'border-[#F3E3CD]/30'
                }`}>
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply rounded-[50%/50%]"
                    loading="lazy"
                    onError={handleImageError}
                  />
                </div>
              </div>

              <CardFlowerGarland isMithilak={isMithilak} />

              <span className={`text-[9px] md:text-[11px] font-black tracking-wider uppercase mt-0.5 transition-colors duration-200 ${
                isMithilak ? 'text-[#207C8A] group-hover:text-[#165A64]' : 'text-[#4B6C36] group-hover:text-[#D35400]'
              }`}>
                {item.price ? `₹${item.price}` : t('product.viewProduct', { defaultValue: 'VIEW PRODUCT' })}
              </span>
              <ViewStoreDivider isMithilak={isMithilak} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrendingThisWeek);
