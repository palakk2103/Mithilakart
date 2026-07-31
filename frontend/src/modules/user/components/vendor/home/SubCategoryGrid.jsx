import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useVendorStore from '../../../../../store/useVendorStore';
import { mapShopCategoryCards } from '../../../utils/mappers';
import { handleImageError } from '../../../../../shared/utils/imageUtils';

const SubCategoryGrid = () => {
  const navigate = useNavigate();
  const { homeCategories } = useVendorStore();

  const categoryItems = useMemo(() => mapShopCategoryCards(homeCategories), [homeCategories]);

  if (!categoryItems.length) return null;

  return (
    <div className="py-4 px-3 w-full max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-black text-[#3F2A20] tracking-tight">
          Shop by Categories
        </h2>
        <span
          onClick={() => navigate('/categories')}
          className="text-xs font-bold text-[#65B842] hover:text-[#529C33] cursor-pointer hover:underline transition-colors"
        >
          View All
        </span>
      </div>

      {/* Single Row Horizontal Scroll Container */}
      <div className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-1 px-1">
        {categoryItems.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex-shrink-0 w-24 sm:w-28 md:w-36 flex flex-col items-center cursor-pointer group"
          >
            <div className="w-full aspect-[1/1.15] bg-white border border-[#EADCC9]/60 rounded-[20px] overflow-hidden flex flex-col items-center justify-between p-2 md:p-3 shadow-[0_3px_8px_rgba(61,35,20,0.015)] group-hover:shadow-[0_6px_15px_rgba(61,35,20,0.05)] group-hover:border-[#65B842]/40 transition-all duration-300 transform">
              <span className="text-[9.5px] sm:text-xs md:text-sm font-black text-[#3F2A20] text-center mt-1 px-0.5 leading-tight tracking-tight h-[20px] flex items-center justify-center truncate w-full">
                {item.name}
              </span>

              <div className="w-[88%] aspect-square rounded-[14px] overflow-hidden bg-[#FAF9F5] border border-[#EADCC9]/40 flex items-center justify-center p-0.5 mb-1 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
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
