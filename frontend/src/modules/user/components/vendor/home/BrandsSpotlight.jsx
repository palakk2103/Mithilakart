import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BrandsSpotlight = ({ items = [] }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBrandClick = useCallback((card) => {
    const prodId = card.id || card.product?._id || card.product?.id;
    navigate('/product-detail', { 
      state: { 
        productId: prodId,
        product: card.product || { 
          id: prodId,
          name: card.sub || card.title,
          brand: card.brand || 'Featured',
          price: card.price || 999,
          oldPrice: card.mrp || 1499,
          image: card.img,
          label: 'Spotlight'
        } 
      } 
    });
  }, [navigate]);

  if (!Array.isArray(items) || !items.length) return null;

  return (
    <>
      {/* Mobile view (Untouched layout, only hidden on desktop) */}
      <div className="px-2 mt-2 mb-1 md:hidden">
        <h2 className="text-slate-900 mb-2 px-0.5 text-[15px] font-black uppercase tracking-tight">
          {t('home.brandsSpotlight')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {items.map((card, idx) => (
            <div
              key={idx}
              onClick={() => handleBrandClick(card)}
              className="flex flex-col gap-1 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm flex items-center justify-center p-2">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-[8px]">${t('common.noImage') || 'No Image'}</div>`;
                  }}
                />
                <div className="absolute top-1 right-1 bg-black/10 backdrop-blur-sm text-white text-[6px] px-1 py-0.5 rounded-sm font-bold border border-white/20">{t('common.ad') || 'AD'}</div>
                <div className="absolute bottom-0 left-0 right-0 bg-[#ff0000] text-white text-center py-0.5 text-[8.5px] font-black leading-tight">
                  {card.title}
                </div>
              </div>
              <div className="text-center px-0.5">
                <p className="text-[9px] font-bold text-slate-800 leading-tight line-clamp-1">{card.sub}</p>
                <p className="text-[8px] font-medium text-gray-400 line-clamp-1">{t('common.sponsored')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view (Purple/Indigo style banner layout mimicking the "People also viewed" container structure) */}
      <div className="hidden md:block md:max-w-[1600px] md:mx-auto md:px-2 md:mt-6">
        {/* Banner Header with background color and rounded-t corners */}
        <div className="bg-[#6FAE4A] text-white px-6 py-4 rounded-t-3xl flex items-center justify-between shadow-sm">
          <h2 className="text-[17px] font-black uppercase tracking-wider">
            {t('home.brandsSpotlight')}
          </h2>
          <div className="flex items-center gap-1.5 opacity-80 text-[11px] font-black">
            <span>⭐ {t('common.sponsored').toUpperCase()}</span>
          </div>
        </div>

        {/* White container panel with rounded-b corners containing the cards */}
        <div className="bg-white border-x border-b border-slate-100 rounded-b-3xl p-6 shadow-md">
          <div className="grid grid-cols-3 gap-6">
            {items.map((card, idx) => (
              <div
                key={idx}
                onClick={() => handleBrandClick(card)}
                className="flex flex-col gap-3.5 cursor-pointer group active:scale-95 transition-transform"
              >
                {/* Soft grey rounded image container box */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/60 flex items-center justify-center p-5 group-hover:bg-slate-100/60 transition-colors duration-300">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-black/10 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded font-black border border-white/20">{t('common.ad') || 'AD'}</div>
                </div>

                {/* Content placed below the image box */}
                <div className="px-1">
                  <h3 className="text-[13px] font-black text-slate-800 leading-snug group-hover:text-[#6FAE4A] transition-colors">{card.sub}</h3>
                  <p className="text-[12px] font-black text-rose-600 mt-1 uppercase tracking-wider">{card.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(BrandsSpotlight);
