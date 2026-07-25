import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleImageError, getProductImage } from '../../../../../shared/utils/imageUtils';

const StillLookingSection = ({ items }) => {
  const navigate = useNavigate();

  const handleCardClick = useCallback((item) => {
    // Generate or use existing ID
    const productId = item.id || Math.random().toString(36).substr(2, 9);

    // Map categories based on labels for demo purposes
    let category = 'Fashion';
    if (item.label.toLowerCase().includes('neck')) category = 'Jewellery';
    if (item.label.toLowerCase().includes('lips')) category = 'Beauty';
    if (item.label.toLowerCase().includes('shamp')) category = 'Beauty';

    navigate(`/continue-shopping/${productId}`, {
      state: {
        product: {
          id: productId,
          name: item.label,
          brand: 'Trending Now',
          price: 599,
          oldPrice: 1299,
          discount: '54% off',
          rating: 4.5,
          image: item.img,
          category: category,
          label: 'Limited time deal'
        }
      }
    });
  }, [navigate]);


  return (
    <div className="px-2 mt-1.5 mb-1">
      <div className="bg-[#6FAE4A] rounded-xl p-2 md:p-6 shadow-sm relative overflow-hidden md:max-w-[1600px] md:mx-auto">
        {/* Diagonal Stripe Pattern */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(135deg, #fff 25%, transparent 25%, transparent 50%, #fff 50%, #fff 75%, transparent 75%, transparent)',
          backgroundSize: '12px 12px'
        }}></div>

        <h2 className="text-white text-[15px] md:text-[18px] md:text-center md:mb-4 font-black uppercase tracking-tight mb-2 pl-0.5 relative z-10">
          Trending This Week
        </h2>

        <div className="flex overflow-x-auto w-full gap-1.5 pb-0.5 no-scrollbar snap-x relative z-10 md:justify-center md:gap-5 md:overflow-x-visible">
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(item)}
              className="flex-shrink-0 bg-white rounded-lg p-1 w-[80px] md:w-[110px] md:p-2 md:rounded-xl shadow-sm flex flex-col gap-1 md:gap-2 snap-start cursor-pointer active:scale-95 transition-transform"
            >
              <div className="aspect-square rounded-md overflow-hidden bg-white flex items-center justify-center p-1 border border-gray-50">
                <img
                  src={getProductImage(item.img || item.image)}
                  alt={item.label}
                  className="w-full h-full object-contain mix-blend-multiply"
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>
              <div className="px-0.5">
                <p className="text-[9px] md:text-[11px] font-bold text-gray-600 leading-tight truncate">{item.label}</p>
                <p className="text-[8px] md:text-[9.5px] font-black text-[#6FAE4A] uppercase tracking-tighter mt-0.5">VIEW STORE</p>
              </div>
            </div>
          ))}
          <div className="flex-shrink-0 w-0.5 md:hidden" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(StillLookingSection);

