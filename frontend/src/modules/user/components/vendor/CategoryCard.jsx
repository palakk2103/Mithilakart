import React from 'react';
import { handleImageError, getProductImage } from '../../../../shared/utils/imageUtils';

const CategoryCard = ({ item, onClick }) => {
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';
  const cardBg = isFreshGroceryFlow
    ? 'bg-[color:var(--fg-light,#FFF0A0)] border border-[color:var(--fg-dark,#7A3E17)]/20 shadow-2xs'
    : 'bg-[#fdebf3]';

  if (isMithilakFlow) {
    return (
      <div
        onClick={onClick}
        className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform select-none w-20"
      >
        {/* Category Image Wrapper - White circle with masking ring */}
        <div className="w-[66px] h-[66px] rounded-full bg-white border border-[#EADCC9]/55 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.03)] overflow-hidden relative">
          <img
            src={getProductImage(item.img || item.image)}
            alt={item.name}
            onError={handleImageError}
            className="w-[82%] h-[82%] object-contain z-10"
            loading="lazy"
          />
          {/* White overlay ring to mask the black border line in the image */}
          <div className="absolute inset-0 rounded-full border-[5.5px] border-white z-20 pointer-events-none" />
        </div>

        {/* Category Title */}
        <span className="text-[11px] font-semibold text-center text-[#3F2A20] mt-2 leading-tight tracking-tight min-h-[32px] w-full break-words">
          {item.name.replace('Mithila ', '')}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform select-none w-20"
    >
      {/* Category Image Wrapper with soft background */}
      <div className={`w-16 h-16 rounded-[22px] ${cardBg} overflow-hidden flex items-center justify-center p-2.5`}>
        <img
          src={getProductImage(item.img || item.image)}
          alt={item.name}
          onError={handleImageError}
          className="w-full h-full object-contain mix-blend-multiply"
          loading="lazy"
        />
      </div>

      {/* Category Title */}
      <span className="text-[11px] font-medium text-center text-gray-800 mt-2 leading-tight tracking-tight min-h-[32px] w-full break-words">
        {item.name}
      </span>
    </div>
  );
};

export default CategoryCard;

