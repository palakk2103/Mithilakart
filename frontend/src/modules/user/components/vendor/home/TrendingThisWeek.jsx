import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import existing mock images that closely match
import coordsImg from '../../../../../assets/products/product10.jpg'; // Clothes/Fashion
import necklaceImg from '../../../../../assets/products/product06.jpg'; // Necklace/Jewellery
import womenTopImg from '../../../../../assets/products/product11.webp'; // Women's Tops
import lipstickImg from '../../../../../assets/products/product05.jpg'; // Lip gloss/Lipstick

const trendingItems = [
  { id: 1, name: 'Co-ords', img: coordsImg, path: '/category-products?category=Fashion' },
  { id: 2, name: 'Necklaces', img: necklaceImg, path: '/category-products?category=Jewellery' },
  { id: 3, name: 'Women\'s Tops', img: womenTopImg, path: '/category-products?category=Fashion' },
  { id: 4, name: 'Lipsticks', img: lipstickImg, path: '/category-products?category=Cosmetics' },
];

// Custom SVGs matching the Mithila themes from the image
const HeaderFlower = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle mx-1">
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

const ViewAllIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block ml-0.5 align-middle">
    <path d="M6 4L14 12L6 20" stroke="#4B6C36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 4L21 12L13 20" stroke="#4B6C36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

const CardFlowerGarland = () => (
  <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="my-0.5 select-none w-[52px] min-[375px]:w-[62px] md:w-[75px] h-auto">
    {/* Left branch */}
    <path d="M60 12 C48 15, 34 16, 22 11" stroke="#4B6C36" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M48 13.5 C46.5 10.5, 42.5 10.5, 41 13" fill="#4B6C36" />
    <path d="M36 12.5 C34.5 9.5, 30.5 9.5, 29 12" fill="#4B6C36" />
    {/* Right branch */}
    <path d="M60 12 C72 15, 86 16, 98 11" stroke="#4B6C36" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M72 13.5 C73.5 10.5, 77.5 10.5, 79 13" fill="#4B6C36" />
    <path d="M84 12.5 C85.5 9.5, 89.5 9.5, 91 12" fill="#4B6C36" />
    {/* Small orange accent dots */}
    <circle cx="43" cy="15" r="1.5" fill="#D35400" />
    <circle cx="31" cy="14.5" r="1.5" fill="#D35400" />
    <circle cx="77" cy="15" r="1.5" fill="#D35400" />
    <circle cx="89" cy="14.5" r="1.5" fill="#D35400" />
    {/* Central Flower */}
    <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
    <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
    <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
    <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
    <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    {/* Leaf accents between petals */}
    <circle cx="55.5" cy="7.5" r="1.2" fill="#4B6C36" />
    <circle cx="64.5" cy="7.5" r="1.2" fill="#4B6C36" />
    <circle cx="55.5" cy="16.5" r="1.2" fill="#4B6C36" />
    <circle cx="64.5" cy="16.5" r="1.2" fill="#4B6C36" />
  </svg>
);

const ViewStoreDivider = () => (
  <svg viewBox="0 0 24 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 mt-0.5 w-[12px] md:w-[15px] h-auto">
    <path d="M2 3H9M15 3H22" stroke="#E67E22" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="3" r="1.5" fill="#4B6C36" />
  </svg>
);

const TrendingThisWeek = () => {
  const navigate = useNavigate();

  return (
    <div className="py-1 px-2.5 w-full max-w-[1600px] mx-auto select-none">
      <div className="bg-[#FCF7EE] rounded-[16px] md:rounded-[20px] p-2 md:p-3 text-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-[#F3E3CD]/60 font-raleway">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center">
            <HeaderFlower />
            <h3 className="text-[11px] md:text-sm font-black text-[#3C2415] uppercase tracking-wide font-montserrat">
              Trending This Week
            </h3>
            <HeaderFlower />
          </div>
          <button
            onClick={() => navigate('/categories')}
            className="text-[9px] md:text-xs font-bold text-[#4B6C36] hover:text-[#385227] flex items-center transition-colors duration-200"
          >
            View All
            <ViewAllIcon />
          </button>
        </div>

        {/* Horizontal Scrollable Row of Arch Cards */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {trendingItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex-shrink-0 w-[96px] min-[375px]:w-[106px] md:w-[142px] bg-[#FCF7EE] rounded-t-[1000px] rounded-b-[12px] md:rounded-b-[15px] p-1.5 md:p-2 flex flex-col items-center cursor-pointer hover:shadow-xs hover:border-[#E5D2BA] transition-all duration-300 border border-[#F1E1CE] group"
            >
              {/* Category Title */}
              <span className="text-[8.5px] min-[375px]:text-[10px] md:text-sm font-black text-[#3C2415] text-center mt-2 min-[375px]:mt-2.5 md:mt-4 mb-1 group-hover:text-[#D35400] transition-colors duration-200 w-full px-1.5 leading-tight break-words h-[28px] min-[375px]:h-[30px] md:h-[40px] flex items-center justify-center">
                {item.name}
              </span>

              {/* Dotted Ellipse Container */}
              <div className="relative w-[60px] min-[375px]:w-[70px] md:w-[95px] aspect-[1/1.25] flex items-center justify-center mb-0.5">
                {/* Concentric Beaded/Dotted Borders */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 100 125">
                  {/* Outer Orange Dots */}
                  <ellipse
                    cx="50"
                    cy="62.5"
                    rx="45"
                    ry="56"
                    fill="none"
                    stroke="#D35400"
                    strokeWidth="1.2"
                    strokeDasharray="2, 5"
                  />
                  {/* Inner Brown Dots */}
                  <ellipse
                    cx="50"
                    cy="62.5"
                    rx="41"
                    ry="51"
                    fill="none"
                    stroke="#7A5A44"
                    strokeWidth="0.8"
                    strokeDasharray="1, 3.5"
                />
                </svg>

                {/* Oval Clipped Image */}
                <div className="w-[76%] h-[82%] rounded-[50%/50%] overflow-hidden bg-white/70 flex items-center justify-center p-0.5 border border-[#F3E3CD]/30 shadow-inner group-hover:scale-102 transition-transform duration-300">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-[50%/50%]"
                  />
                </div>
              </div>

              {/* Mithila Floral Garland under the image */}
              <CardFlowerGarland />

              {/* View Store Action */}
              <span className="text-[6.8px] md:text-[9px] font-black text-[#4B6C36] tracking-wider uppercase mt-0.5 group-hover:text-[#385227] transition-colors duration-200">
                VIEW STORE
              </span>
              <ViewStoreDivider />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingThisWeek;
