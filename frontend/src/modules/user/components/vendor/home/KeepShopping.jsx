import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useVendorStore from '../../../../../store/useVendorStore';
import { mapShopCategoryCards } from '../../../utils/mappers';

const HeaderFlower = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle mx-1">
    <path d="M12 2C13.5 6.5 13.5 6.5 12 11C10.5 6.5 10.5 6.5 12 2Z" fill="#65B842" />
    <path d="M12 22C13.5 17.5 13.5 17.5 12 13C10.5 17.5 10.5 17.5 12 22Z" fill="#65B842" />
    <path d="M2 12C6.5 13.5 6.5 13.5 11 12C6.5 10.5 6.5 10.5 2 12Z" fill="#65B842" />
    <path d="M22 12C17.5 13.5 17.5 13.5 13 12C17.5 10.5 17.5 10.5 22 12Z" fill="#65B842" />
    <path d="M5.5 5.5C8.5 7.5 8.5 7.5 10 9C8.5 8.5 8.5 8.5 5.5 5.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.5 5.5C15.5 7.5 15.5 7.5 14 9C15.5 8.5 15.5 8.5 18.5 5.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.5 18.5C8.5 16.5 8.5 16.5 10 15C8.5 15.5 8.5 15.5 5.5 18.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.5 18.5C15.5 16.5 15.5 16.5 14 15C15.5 15.5 15.5 15.5 18.5 18.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" fill="#E67E22" />
    <circle cx="12" cy="12" r="1.2" fill="#FFF" />
  </svg>
);

const ViewAllIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block ml-0.5 align-middle">
    <path d="M6 4L14 12L6 20" stroke="#65B842" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 4L21 12L13 20" stroke="#65B842" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

const KeepShopping = () => {
  const navigate = useNavigate();
  const { homeCategories, homeSections } = useVendorStore();

  const categoriesData = useMemo(() => {
    const fromSections = (homeSections.keepShopping || []).map((item) => ({
      id: item.id,
      name: item.label || item.name,
      img: item.img,
      path: item.link || `/vendor/product-detail`,
    }));

    if (fromSections.length) return fromSections;
    return mapShopCategoryCards(homeCategories);
  }, [homeCategories, homeSections.keepShopping]);

  const handleCardClick = useCallback((item) => {
    navigate(item.path);
  }, [navigate]);

  if (!categoriesData.length) return null;

  return (
    <div className="py-2 px-3 w-full max-w-[1600px] mx-auto select-none">
      <div className="bg-[#FCF7EE] rounded-[20px] p-3 text-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-[#F3E3CD]/60 font-raleway">
        <div className="flex justify-between items-center mb-2.5 px-1">
          <h2 className="text-[15px] font-black text-[#3F2A20] tracking-tight flex items-center">
            Keep Shopping <HeaderFlower /> For
          </h2>
          <span
            onClick={() => navigate('/categories')}
            className="text-[10.5px] font-black text-[#65B842] uppercase tracking-tighter cursor-pointer flex items-center"
          >
            View All <ViewAllIcon />
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {categoriesData.slice(0, 8).map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-full aspect-square rounded-[14px] overflow-hidden bg-white border border-[#EADCC9]/50 flex items-center justify-center p-1 mb-1 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                {item.img ? (
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover rounded-[10px]" loading="lazy" />
                ) : (
                  <span className="text-[11px] font-black text-[#3E5A44]">{item.name.charAt(0)}</span>
                )}
              </div>
              <p className="text-[8.5px] md:text-[10px] font-bold text-[#3F2A20] text-center leading-tight line-clamp-2 px-0.5">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeepShopping;
