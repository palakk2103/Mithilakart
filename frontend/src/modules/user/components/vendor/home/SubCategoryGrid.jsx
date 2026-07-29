import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useVendorStore from '../../../../../store/useVendorStore';
import { mapShopCategoryCards } from '../../../utils/mappers';

const SubCategoryGrid = () => {
  const navigate = useNavigate();
  const { homeCategories } = useVendorStore();

  const categoryItems = useMemo(() => mapShopCategoryCards(homeCategories), [homeCategories]);
  const categoryItemsTop = categoryItems.filter((item) => item.hasImage);
  const categoryItemsBottom = categoryItems.filter((item) => !item.hasImage);

  if (!categoryItems.length) return null;

  return (
    <div className="py-4 px-3 w-full max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-black text-[#3F2A20] tracking-tight">
          Shop by Categories
        </h2>
        <span
          onClick={() => navigate('/categories')}
          className="text-xs font-bold text-[#3E5A44] hover:text-[#2d4232] cursor-pointer hover:underline transition-colors"
        >
          View All
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-6 justify-items-center mb-3">
        {categoryItemsTop.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.path)}
            className="w-full flex flex-col items-center cursor-pointer group"
          >
            <div className="w-full aspect-[1/1.18] bg-white border border-[#EADCC9]/60 rounded-[20px] overflow-hidden flex flex-col items-center justify-between p-1.5 md:p-3 shadow-[0_3px_8px_rgba(61,35,20,0.015)] group-hover:shadow-[0_6px_15px_rgba(61,35,20,0.05)] group-hover:border-[#3E5A44]/40 transition-all duration-300 transform">
              <span className="text-[9.2px] sm:text-xs md:text-sm font-black text-[#3F2A20] text-center mt-2 px-0.5 leading-tight tracking-tight h-[20px] flex items-center justify-center">
                {item.name}
              </span>

              <div className="w-[88%] aspect-square rounded-[14px] overflow-hidden bg-[#FAF9F5] border border-[#EADCC9]/40 flex items-center justify-center p-0.5 mb-1.5 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-[11px] group-hover:scale-[1.04] transition-transform duration-500"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-[#3E5A44]">{item.name.charAt(0)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5 md:gap-6 justify-items-center">
        {categoryItemsBottom.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.path)}
            className="w-full bg-[#FFF8EE] border border-[#EADCC9]/50 rounded-xl py-1.5 px-0.5 text-center cursor-pointer hover:border-[#3E5A44]/40 hover:bg-white active:scale-98 transition-all duration-200"
          >
            <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-[#3F2A20] leading-tight block px-0.5">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubCategoryGrid;
