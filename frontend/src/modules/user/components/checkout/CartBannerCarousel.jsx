import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCartBanners } from '../../services/cartApi';
import { handleImageError } from '../../../../shared/utils/imageUtils';

const FLOW_TO_API = { quickshop: 'quick_shop', freshgrocery: 'fresh_grocery', mithilak: 'mithilak', mithilakart: 'standard' };

/**
 * CART-1 promotional carousel at the top of the cart. Banners are the admin's
 * "Cart page carousel" banners for this tab; with none, nothing is shown.
 */
const CartBannerCarousel = ({ flow }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getCartBanners(FLOW_TO_API[flow] || 'standard')
      .then((list) => { if (!cancelled) { setBanners(Array.isArray(list) ? list : []); setIndex(0); } })
      .catch(() => { if (!cancelled) setBanners([]); });
    return () => { cancelled = true; };
  }, [flow]);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const id = setInterval(() => { if (!paused.current) setIndex((i) => (i + 1) % banners.length); }, 4500);
    return () => clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;
  const go = (d) => setIndex((i) => (i + d + banners.length) % banners.length);
  const open = (b) => { if (b.linkUrl) navigate(b.linkUrl); };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers"
      className="relative rounded-2xl overflow-hidden shadow-sm bg-white"
      onTouchStart={() => { paused.current = true; }}
      onTouchEnd={() => { paused.current = false; }}
    >
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((b) => (
          <button key={b.id || b._id} type="button" onClick={() => open(b)} className="w-full flex-shrink-0 aspect-[4.5/1] block" aria-label={b.title}>
            <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
          </button>
        ))}
      </div>
      {banners.length > 1 && (
        <>
          <button type="button" aria-label="Previous offer" onClick={() => go(-1)} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Next offer" onClick={() => go(1)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center"><ChevronRight size={18} /></button>
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1.5" aria-hidden>
            {banners.map((b, i) => <span key={b.id || b._id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}
          </div>
        </>
      )}
    </section>
  );
};

export default CartBannerCarousel;
