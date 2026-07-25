import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

import prod1 from '../../../assets/mithila/product01.png';
import prod2 from '../../../assets/mithila/product02.png';
import prod3 from '../../../assets/mithila/product03.png';
import prod4 from '../../../assets/mithila/product04.png';
import prod5 from '../../../assets/mithila/product05.png';
import prod6 from '../../../assets/mithila/product06.png';
import prod7 from '../../../assets/mithila/product07.png';
import prod8 from '../../../assets/mithila/product08.png';
import prod9 from '../../../assets/mithila/product09.png';
import prod10 from '../../../assets/products/product10.jpg';
import prod11 from '../../../assets/mithila/product11.png';
import prod12 from '../../../assets/products/product12.jpg';

import bannerIllustration from '../../../assets/banner_illustration.png';

const MITHILA_CATEGORIES = [
  {
    name: 'Mithila Festival & Cultural',
    img: prod1
  },
  {
    name: 'Mithila Paridhan',
    img: prod2
  },
  {
    name: 'Mithila Special Cuisines',
    img: prod3
  },
  {
    name: 'Mithila Lac Bangles',
    img: prod4
  },
  {
    name: 'Mithila Handcrafted Items',
    img: prod5
  },
  {
    name: 'Mithila Pooja Needs',
    img: prod6
  },
  {
    name: 'Mithila Books & Panchang',
    img: prod7
  },
  {
    name: 'Mithila Achaar',
    img: prod8
  }
];

const MITHILA_BEST_SELLERS = [
  {
    id: 'bs1',
    line1: 'Madhubani',
    line2: 'Wall Art',
    name: 'Madhubani Wall Art',
    img: prod9,
    price: 899,
    weight: '1 Unit',
    rating: 4.9
  },
  {
    id: 'bs2',
    line1: 'Handpainted',
    line2: 'Pot',
    name: 'Handpainted Pot',
    img: prod7,
    price: 699,
    weight: '1 Unit',
    rating: 4.8
  },
  {
    id: 'bs3',
    line1: 'Mithila',
    line2: 'Jewellery',
    name: 'Mithila Jewellery',
    img: prod11,
    price: 499,
    weight: '1 Set',
    rating: 4.7
  }
];

const getDisplayName = (name) => {
  if (name === 'Mithila Festival & Cultural') return 'Festival & Cultural';
  if (name === 'Mithila Special Cuisines') return 'Special Cuisines';
  if (name === 'Mithila Lac Bangles') return 'Lac Bangles';
  if (name === 'Mithila Handcrafted Items') return 'Handcrafted Decor';
  if (name === 'Mithila Pooja Needs') return 'Pooja Needs';
  if (name === 'Mithila Books & Panchang') return 'Books & Panchang';
  if (name === 'Mithila Achaar') return 'Mithila Achaar';
  return name;
};

const Mithilak = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
    localStorage.setItem('isFreshGroceryFlow', 'false');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="bg-transparent min-h-screen px-4 py-5 select-none pb-24">
      {/* Page Title Header */}
      <div className="mb-4 px-1">
        <h2 className="text-[19px] font-bold text-[#3F2A20] tracking-tight leading-none mb-1">
          Mithila Specialities
        </h2>
        <p className="text-[10px] text-[#207C8A] font-extrabold tracking-widest uppercase mt-1">
          HANDPICKED CULTURAL PRODUCTS
        </p>
      </div>

      {/* Promotional Banner */}
      <div className="mb-6 bg-gradient-to-r from-[#207C8A] to-[#144f58] rounded-2xl p-4 text-white relative overflow-hidden shadow-sm flex items-center justify-between h-[165px]">
        <div className="z-10 flex-1 max-w-[65%] flex flex-col justify-center h-full">
          <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
            MITHILA UTSAV
          </span>
          <h3 className="text-[17px] font-bold mt-2 leading-tight tracking-tight">
            Authentic Mithila Artistry
          </h3>
          <p className="text-[11.5px] text-white/90 font-medium mt-1">
            Flat 20% OFF on Paintings & Crafts
          </p>
        </div>
        <div className="absolute right-0 bottom-0 h-full w-[42%] flex items-end justify-end pointer-events-none overflow-hidden">
          <img
            src={bannerIllustration}
            alt="Mithila Artistry Illustration"
            className="h-[95%] object-contain object-bottom select-none pr-2"
          />
        </div>
      </div>

      {/* Category Grid (Mobile View) */}
      <div className="grid grid-cols-4 gap-y-5 gap-x-3 mb-7 md:hidden">
        {MITHILA_CATEGORIES.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              localStorage.setItem('isMithilakFlow', 'true');
              localStorage.setItem('isQuickShopFlow', 'false');
              navigate('/mithilak/category', { state: { category: item.name } });
            }}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
          >
            {/* Category Image Wrapper - White circle with light thin border */}
            <div className="w-[68px] h-[68px] rounded-full bg-white border border-[#EADCC9]/55 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.03)] overflow-hidden relative">
              <img
                src={item.img}
                alt={item.name}
                className="w-[82%] h-[82%] object-contain z-10"
                loading="lazy"
              />
              {/* White overlay ring to mask the black border line in the image */}
              <div className="absolute inset-0 rounded-full border-[5.5px] border-white z-20 pointer-events-none" />
            </div>
            
            {/* Category label text - strictly 6px (mt-1.5) to 8px (mt-2) top spacing */}
            <span className="text-[11.5px] font-semibold text-center text-gray-800 mt-2 leading-snug tracking-tight line-clamp-2 h-[34px] w-full flex items-start justify-center">
              {getDisplayName(item.name)}
            </span>
          </div>
        ))}
      </div>

      {/* Category Grid (Desktop View) */}
      <div className="hidden md:block md:max-w-[800px] md:mx-auto md:w-full md:mb-8">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md">
          <div className="grid grid-cols-4 gap-x-8 gap-y-6 justify-items-center">
            {MITHILA_CATEGORIES.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  localStorage.setItem('isMithilakFlow', 'true');
                  localStorage.setItem('isQuickShopFlow', 'false');
                  navigate('/mithilak/category', { state: { category: item.name } });
                }}
                className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform w-full max-w-[120px] mx-auto"
              >
                <div className="relative w-[76px] h-[76px] rounded-full overflow-hidden bg-white border border-[#EADCC9]/55 flex items-center justify-center group-hover:bg-slate-50 transition-colors duration-300 shadow-sm">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-[82%] h-[82%] object-contain z-10 group-hover:scale-[1.08] transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* White overlay ring to mask the black border line in the image */}
                  <div className="absolute inset-0 rounded-full border-[6.5px] border-white z-20 pointer-events-none" />
                </div>
                <span className="text-[13px] font-bold text-center text-slate-800 leading-tight tracking-tight mt-1 group-hover:text-[#207C8A] transition-colors">
                  {getDisplayName(item.name)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best Sellers Section */}
      <div className="md:max-w-[800px] md:mx-auto md:w-full">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-[17px] font-bold text-[#3F2A20] leading-none">Best Sellers</h2>
          <span 
            onClick={() => {
              localStorage.setItem('isMithilakFlow', 'true');
              localStorage.setItem('isQuickShopFlow', 'false');
              navigate('/mithilak/category', { state: { category: 'Mithila Handcrafted Items' } });
            }}
            className="text-[12px] text-[#207C8A] font-bold cursor-pointer hover:underline"
          >
            View All
          </span>
        </div>

        {/* Horizontal Cards Grid */}
        <div className="grid grid-cols-3 gap-3">
          {MITHILA_BEST_SELLERS.map((prod) => (
            <div 
              key={prod.id} 
              onClick={() => {
                localStorage.setItem('isMithilakFlow', 'true');
                localStorage.setItem('isQuickShopFlow', 'false');
                navigate('/product-detail', { state: { product: { ...prod, image: prod.img, qty: 1 } } });
              }}
              className="bg-white border border-[#3F2A20]/15 rounded-[20px] p-2.5 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              {/* Product Image Container */}
              <div className="w-full aspect-square bg-white rounded-[16px] flex items-center justify-center p-2.5 border border-[#3F2A20]/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)] mb-2.5">
                <img 
                  src={prod.img} 
                  alt={prod.name} 
                  className="max-h-full max-w-full object-contain rounded-md" 
                />
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[12px] font-extrabold text-[#3F2A20] block leading-tight">
                    {prod.line1}
                  </span>
                  <span className="text-[12px] font-extrabold text-[#3F2A20] block leading-tight">
                    {prod.line2}
                  </span>
                </div>

                {/* Price Tag */}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[13px] font-extrabold text-[#3F2A20]">₹{prod.price}</span>
                  
                  {/* Miniature Add Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
                      cart.push({ name: prod.name, price: prod.price, image: prod.img, cartId: Date.now(), qty: 1 });
                      localStorage.setItem('userCart', JSON.stringify(cart));
                      window.dispatchEvent(new Event('cartUpdated'));
                      triggerToast(`${prod.name} added to cart!`);
                    }}
                    className="p-1.5 bg-white border border-[#207C8A]/30 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer active:scale-90"
                  >
                    <svg className="w-3.5 h-3.5 text-[#3F2A20]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white px-6 py-3 rounded-full text-[13px] font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Mithilak;
