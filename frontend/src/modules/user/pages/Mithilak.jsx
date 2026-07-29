import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useVendorStore from '../../../store/useVendorStore';
import { addProductToCart } from '../utils/cartUtils';
import { getCategories } from '../services/catalogApi';
import { mapMithilaCategoryCards } from '../utils/mappers';

import bannerIllustration from '../../../assets/banner_illustration.png';

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
  const [mithilaCategories, setMithilaCategories] = useState([]);
  const { fetchHomeSections, homeSections } = useVendorStore();

  useEffect(() => {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
    localStorage.setItem('isFreshGroceryFlow', 'false');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
    fetchHomeSections('mithilak');
  }, [fetchHomeSections]);

  useEffect(() => {
    let cancelled = false;

    getCategories({ commerceFlow: 'mithilak' })
      .then((data) => {
        if (!cancelled) setMithilaCategories(mapMithilaCategoryCards(data));
      })
      .catch(() => {
        if (!cancelled) setMithilaCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen px-4 py-5 select-none pb-24">
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
      <div className="mb-6 bg-gradient-to-r from-[#207C8A] to-[#5DB6C3] rounded-2xl p-4 text-white relative overflow-hidden shadow-sm flex items-center justify-between h-[165px]">
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
      <div className="grid grid-cols-4 gap-y-5 gap-x-2.5 mb-8 md:hidden">
        {mithilaCategories.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => {
              localStorage.setItem('isMithilakFlow', 'true');
              localStorage.setItem('isQuickShopFlow', 'false');
              navigate('/mithilak/category', { state: { category: item.name } });
            }}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
          >
            {/* Category Image Wrapper - White circle with light thin border */}
            <div className="w-[66px] h-[66px] rounded-full bg-white border border-[#EADCC9]/55 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.03)] overflow-hidden relative">
              <img
                src={item.img}
                alt={item.name}
                className="w-[82%] h-[82%] object-contain z-10"
                loading="lazy"
              />
              {/* White overlay ring to mask the black border line in the image */}
              <div className="absolute inset-0 rounded-full border-[5.5px] border-white z-20 pointer-events-none" />
            </div>
            
            {/* Category label text */}
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
            {mithilaCategories.map((item, idx) => (
              <div
                key={item.id || idx}
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
      <div className="md:max-w-[1600px] md:mx-auto md:w-full">
        <div className="flex items-center justify-between mb-4 px-1">
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
          {(homeSections.topSelection?.length ? homeSections.topSelection : homeSections.brandsSpotlight || []).slice(0, 6).map((prod) => {
            const name = prod.title || prod.name || prod.label || 'Product';
            const price = prod.product?.price ?? prod.price ?? 0;
            const image = prod.img || prod.image;
            const id = prod.id;

            return (
            <div 
              key={id} 
              onClick={() => {
                localStorage.setItem('isMithilakFlow', 'true');
                localStorage.setItem('isQuickShopFlow', 'false');
                navigate('/vendor/product-detail', { state: { productId: id, product: prod.product || prod } });
              }}
              className="bg-white border border-[#3F2A20]/15 rounded-[20px] p-2.5 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="w-full aspect-square bg-white rounded-[16px] flex items-center justify-center p-2.5 border border-[#3F2A20]/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)] mb-2.5">
                <img 
                  src={image} 
                  alt={name} 
                  className="max-h-full max-w-full object-contain rounded-md" 
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[12px] font-extrabold text-[#3F2A20] block leading-tight truncate">
                    {name}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[13px] font-extrabold text-[#3F2A20]">₹{price}</span>
                  
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      try {
                        await addProductToCart({ id, name, price, image });
                        triggerToast(`${name} added to cart!`);
                      } catch {
                        triggerToast('Could not add to cart');
                      }
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
          )})}
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
