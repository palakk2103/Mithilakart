import React, { useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handleImageError, getProductImage } from '../../../../../shared/utils/imageUtils';

// Import the specific StillSection mock images showing jeans, cosmetics, jewellery, and mugs
import StillImg1 from '../../../../../assets/StillSection/StillImages1.png';
import StillImg2 from '../../../../../assets/StillSection/StillImages2.jpg';
import StillImg3 from '../../../../../assets/StillSection/StillImages3.jpg';
import StillImg4 from '../../../../../assets/StillSection/StillImages4.png';

// Custom header flower matching Mithila art
const HeaderFlower = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle mx-1.5">
    {/* Green petals (cross) */}
    <path d="M12 2C13.5 6.5 13.5 6.5 12 11C10.5 6.5 10.5 6.5 12 2Z" fill="#4B6C36" />
    <path d="M12 22C13.5 17.5 13.5 17.5 12 13C10.5 17.5 10.5 17.5 12 22Z" fill="#4B6C36" />
    <path d="M2 12C6.5 13.5 6.5 13.5 11 12C6.5 10.5 6.5 10.5 2 12Z" fill="#4B6C36" />
    <path d="M22 12C17.5 13.5 17.5 13.5 13 12C17.5 10.5 17.5 10.5 22 12Z" fill="#4B6C36" />
    {/* Orange petals (diagonals) */}
    <path d="M5.5 5.5C8.5 7.5 8.5 7.5 10 9C8.5 8.5 8.5 8.5 5.5 5.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.5 5.5C15.5 7.5 15.5 7.5 14 9C15.5 8.5 15.5 8.5 18.5 5.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.5 18.5C8.5 16.5 8.5 16.5 10 15C8.5 15.5 8.5 15.5 5.5 18.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.5 18.5C15.5 16.5 15.5 16.5 14 15C15.5 15.5 15.5 15.5 18.5 18.5Z" fill="#D35400" stroke="#D35400" strokeWidth="1.5" strokeLinecap="round" />
    {/* Center core */}
    <circle cx="12" cy="12" r="3" fill="#E67E22" />
    <circle cx="12" cy="12" r="1.2" fill="#FFF" />
  </svg>
);

// Arch Frame Overlay Drawing the Borders, Flowers and Leaf Garlands
const ArchFrameOverlay = () => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-10" viewBox="0 0 160 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer beaded arch */}
      <path
        d="M 8 155 L 8 72 A 72 72 0 0 1 152 72 L 152 155 Z"
        stroke="#D35400"
        strokeWidth="1.2"
        strokeDasharray="2 3"
      />
      {/* Inner thin solid arch */}
      <path
        d="M 11 155 L 11 74 A 69 69 0 0 1 149 74 L 149 155 Z"
        stroke="#7A5A44"
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* Floral ornaments */}
      {/* Top-Left Flower */}
      <g transform="translate(9, 73)">
        <path d="M-6 -6 C-12 -2 -12 -10 -6 -6" fill="#4B6C36" />
        <path d="M-6 6 C-12 2 -12 10 -6 6" fill="#4B6C36" />
        <circle cx="-2.5" cy="-2.5" r="2" fill="#D35400" />
        <circle cx="2.5" cy="-2.5" r="2" fill="#D35400" />
        <circle cx="-2.5" cy="2.5" r="2" fill="#D35400" />
        <circle cx="2.5" cy="2.5" r="2" fill="#D35400" />
        <circle cx="0" cy="0" r="3" fill="#E67E22" />
        <circle cx="0" cy="0" r="1.2" fill="#FFF" />
      </g>

      {/* Top-Right Flower */}
      <g transform="translate(151, 73)">
        <path d="M6 -6 C12 -2 12 -10 6 -6" fill="#4B6C36" />
        <path d="M6 6 C12 2 12 10 6 6" fill="#4B6C36" />
        <circle cx="-2.5" cy="-2.5" r="2" fill="#D35400" />
        <circle cx="2.5" cy="-2.5" r="2" fill="#D35400" />
        <circle cx="-2.5" cy="2.5" r="2" fill="#D35400" />
        <circle cx="2.5" cy="2.5" r="2" fill="#D35400" />
        <circle cx="0" cy="0" r="3" fill="#E67E22" />
        <circle cx="0" cy="0" r="1.2" fill="#FFF" />
      </g>

      {/* Bottom-Left trailing leaves */}
      <g transform="translate(9, 155)">
        <path d="M0 -15 C-4 -20 -8 -20 -3 -25" stroke="#4B6C36" strokeWidth="1" fill="none" />
        <path d="M0 -5 C-5 -8 -8 -5 -5 -12" stroke="#4B6C36" strokeWidth="1" fill="none" />
        <path d="M-3 -10 C-8 -10 -8 -7 -3 -7" fill="#4B6C36" />
        <path d="M-3 -17 C-8 -17 -8 -14 -3 -14" fill="#4B6C36" />
        <path d="M3 -7 C8 -7 8 -4 3 -4" fill="#4B6C36" />
        <path d="M3 -14 C8 -14 8 -11 3 -11" fill="#4B6C36" />
        <circle cx="-2" cy="-6" r="1" fill="#D35400" />
        <circle cx="2" cy="-12" r="1" fill="#D35400" />
      </g>

      {/* Bottom-Right trailing leaves */}
      <g transform="translate(151, 155)">
        <path d="M0 -15 C4 -20 8 -20 3 -25" stroke="#4B6C36" strokeWidth="1" fill="none" />
        <path d="M0 -5 C5 -8 8 -5 5 -12" stroke="#4B6C36" strokeWidth="1" fill="none" />
        <path d="M3 -10 C8 -10 8 -7 3 -7" fill="#4B6C36" />
        <path d="M3 -17 C8 -17 8 -14 3 -14" fill="#4B6C36" />
        <path d="M-3 -7 C-8 -7 -8 -4 -3 -4" fill="#4B6C36" />
        <path d="M-3 -14 C-8 -14 -8 -11 -3 -11" fill="#4B6C36" />
        <circle cx="2" cy="-6" r="1" fill="#D35400" />
        <circle cx="-2" cy="-12" r="1" fill="#D35400" />
      </g>

      {/* Bottom-Center Garland */}
      <g transform="translate(80, 155)">
        <path d="M0 0 C-15 3 -25 0 -35 -5" stroke="#4B6C36" strokeWidth="1.2" fill="none" />
        <path d="M0 0 C15 3 25 0 35 -5" stroke="#4B6C36" strokeWidth="1.2" fill="none" />
        <path d="M-15 0 C-18 -4 -22 -4 -20 1" fill="#4B6C36" />
        <path d="M-25 -2 C-28 -6 -32 -6 -30 -1" fill="#4B6C36" />
        <path d="M15 0 C18 -4 22 -4 20 1" fill="#4B6C36" />
        <path d="M25 -2 C28 -6 32 -6 30 -1" fill="#4B6C36" />
        <circle cx="-10" cy="3" r="1.2" fill="#D35400" />
        <circle cx="-20" cy="2" r="1.2" fill="#D35400" />
        <circle cx="10" cy="3" r="1.2" fill="#D35400" />
        <circle cx="20" cy="2" r="1.2" fill="#D35400" />
        <circle cx="0" cy="0" r="4.5" fill="#E67E22" />
        <circle cx="-5" cy="-4" r="2.5" fill="#D35400" />
        <circle cx="5" cy="-4" r="2.5" fill="#D35400" />
        <circle cx="-6" cy="2" r="2.5" fill="#D35400" />
        <circle cx="6" cy="2" r="2.5" fill="#D35400" />
        <circle cx="0" cy="5" r="2.5" fill="#D35400" />
        <circle cx="0" cy="0" r="1.8" fill="#FFF" />
      </g>
    </svg>
  );
};

// Pastel terracotta/beige background colors
const ARCH_BACKGROUNDS = [
  '#C99488', // Warm rose/terracotta
  '#DFC4AB', // Warm beige
  '#C99488', // Warm rose/terracotta
  '#C5AD9A', // Warm grey/brown
];

const BestQuality = ({ items = [] }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const products = (Array.isArray(items) && items.length)
    ? items.slice(0, 4).map((item, idx) => ({
        id: item.id || item._id || item.productId,
        name: item.title || item.name || 'Product',
        tag: item.tag || item.badge || 'Popular',
        img: item.image || item.img || (Array.isArray(item.images) ? item.images[0]?.url : null),
        price: item.price,
        mrp: item.mrp,
        brand: item.brand,
      }))
    : [];

  const handleProductClick = useCallback((product) => {
    if (!product.id) return;
    navigate('/product-detail', {
      state: {
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand || 'Premium Quality',
          price: product.price || 0,
          oldPrice: product.mrp || product.price,
          image: product.img,
          label: 'Best Quality',
        },
      },
    });
  }, [navigate]);

  if (!products.length) return null;

  return (
    <div className="py-3 px-3 w-full max-w-[1600px] mx-auto select-none bg-transparent">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center min-w-0 pr-2">
          <HeaderFlower />
          <h2 className="text-[13px] sm:text-[16px] md:text-[22px] font-black text-[#4E2812] uppercase tracking-normal sm:tracking-[0.08em] font-serif whitespace-nowrap truncate">
            {t('home.bestQuality') || 'Best Quality Guaranteed'}
          </h2>
          <HeaderFlower />
        </div>
        <button
          onClick={() => navigate('/all-offers')}
          className="w-8 h-8 rounded-full border border-[#D35400]/40 border-dashed flex items-center justify-center bg-[#FAF6EE]/50 hover:bg-[#F3E3CD]/30 active:scale-90 transition-all duration-200"
        >
          <ChevronRight size={16} className="text-[#4E2812]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Grid Layout matching TopSelection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((product, idx) => {
          const archBg = ARCH_BACKGROUNDS[idx % ARCH_BACKGROUNDS.length];
          return (
            <div
              key={product.id || idx}
              onClick={() => handleProductClick(product)}
              className="bg-transparent rounded-[20px] p-2.5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-300 border border-[#EADEC9] group"
            >
              {/* Image Container with Custom Arch Aspect Ratio */}
              <div className="relative w-full aspect-[16/17] flex items-center justify-center">
                {/* Arch Clipped Background & Image */}
                <div
                  className="absolute left-[5%] right-[5%] top-[5%] bottom-[8.5%] overflow-hidden rounded-t-full shadow-inner flex items-center justify-center p-1.5 group-hover:scale-[1.02] transition-transform duration-300"
                  style={{ backgroundColor: archBg }}
                >
                  <img
                    src={getProductImage(product.img || product.image)}
                    alt={product.name}
                    className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={handleImageError}
                  />
                </div>

                {/* Decorative Flowers and Borders Overlay */}
                <ArchFrameOverlay />
              </div>

              {/* Typography / Metadata */}
              <div className="mt-2.5 px-1.5 text-left">
                <span className="text-[9.5px] md:text-[11.5px] font-bold text-[#4B6C36] uppercase tracking-wider block truncate">
                  {product.name}
                </span>
                <span className="text-[12.5px] md:text-[16px] font-serif font-black text-[#4E2812] leading-tight mt-1 block truncate">
                  {product.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(BestQuality);
