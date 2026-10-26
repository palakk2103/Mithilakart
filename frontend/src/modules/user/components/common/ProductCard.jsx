import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useTabTheme from '../../../../shared/hooks/useTabTheme';

const ProductCard = ({ product, onClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryBg, primaryText, primaryBorder } = useTabTheme();

  const handleClick = () => {
    if (onClick) {
      onClick(product);
      return;
    }

    const prefix = location.pathname.startsWith('/vendor') ? '/vendor' : '';
    navigate(`${prefix}/product-detail`, {
      state: { product, productId: product.id },
    });
  };

  const imageSrc = product.image || product.img || product.imageUrl || product.images?.[0]?.url || product.images?.[0] || "https://via.placeholder.com/300x300";
  const title = product.title || product.name || '';
  const rating = product.rating || product.ratingAvg || 0;
  const reviewCount = product.reviewCount || product.ratingCount || 0;
  const oldPrice = product.oldPrice || product.mrp;
  const price = product.price;

  const deliveryBadge = product.deliveryEtaText ? (
    <>
      <span className={`${primaryText} font-bold`}>⚡ Quick</span> {product.deliveryEtaText}
    </>
  ) : product.deliveryPromiseMinutes ? (
    <>
      <span className={`${primaryText} font-bold`}>⚡ Quick</span> {product.deliveryPromiseMinutes} mins
    </>
  ) : (
    <>
      <span className={`${primaryText} font-bold`}>Prime</span> {t('product.deliveryTomorrow')}
    </>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border border-slate-100 flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-white p-2 md:p-4">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 p-1.5 md:top-3 md:right-3 md:p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-300 hover:text-red-500 transition-colors shadow-sm"
        >
          <Heart size={15} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
      <div className="p-2 md:p-3 flex flex-col flex-1">
        <h3 className="text-[11px] md:text-sm font-medium text-slate-800 line-clamp-2 leading-snug min-h-[30px] md:min-h-[40px]" title={title}>
          {title}
        </h3>

        {rating > 0 && (
          <div className="mt-1 md:mt-2 flex items-center gap-1.5">
            <div className={`${primaryBg} text-white text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded flex items-center font-bold`}>
              {rating} ★
            </div>
            {reviewCount > 0 && (
              <span className="text-slate-400 text-[10px] md:text-xs font-medium">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-1.5 md:mt-3 flex flex-col">
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            <span className="text-xs md:text-base font-bold text-slate-900">₹{price}</span>
            {oldPrice && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through">{t('product.mrp')} ₹{oldPrice}</span>
            )}
            {oldPrice && (
              <span className={`border ${primaryBorder} ${primaryText} text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight`}>
                {Math.round(((parseInt(oldPrice?.toString().replace(/,/g, '')) - parseInt(price?.toString().replace(/,/g, ''))) / parseInt(oldPrice?.toString().replace(/,/g, ''))) * 100)}% {t('product.off')}
              </span>
            )}
          </div>
          <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 md:mt-1 flex items-center gap-1">
            {deliveryBadge}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
