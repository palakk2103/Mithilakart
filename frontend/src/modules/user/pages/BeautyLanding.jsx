import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Star, Heart,
  Sparkles, Gem, Crown, FlaskConical, ChevronRight
} from 'lucide-react';

// ── Assets ──────────────────────────────────────────────
import LipstickDeal  from '../../../assets/products/product12.jpg';
import LipGloss      from '../../../assets/products/product11.webp';
import LipLiner      from '../../../assets/products/product10.jpg';
import Mascara       from '../../../assets/products/product09.jpg';
import MakeupHero    from '../../../assets/products/product08.jpg';
import PlumShampoo   from '../../../assets/products/product07.jpg';
import LorealShampoo from '../../../assets/products/product06.jpg';
import MatrixShampoo from '../../../assets/products/product05.jpg';
import JewelleryImg  from '../../../assets/products/product12.jpg';
import BeautyTab     from '../../../assets/products/product08.jpg';

import { getCategories, getCategoryProducts } from '../services/catalogApi';
import { getFlowHome } from '../services/storefrontApi';
import { extractList, findCategoryByName, mapProductForCard } from '../utils/mappers';
import { fetchCartCount, addProductToCart, dispatchCartUpdated } from '../utils/cartUtils';

// Banner Assets
import ImageBanner1 from '../../../assets/TopBanner/ImageBanner1.jpg';
import ImageBanner2 from '../../../assets/TopBanner/ImageBanner2.jpg';
import ImageBanner3 from '../../../assets/TopBanner/ImageBanner3.webp';
import ImageBanner4 from '../../../assets/TopBanner/ImageBanner4.jpg';

// ── Sub-category config ──────────────────────────────────
const SUB_CATS = [
  { id: 'Beauty',        label: 'Beauty',        Icon: Sparkles,    dataKey: 'Beauty'        },
  { id: 'Art. Jewellery',label: 'Art. Jewellery', Icon: Gem,         dataKey: 'Art. Jewellery'},
  { id: '1g Gold',       label: '1g Gold',        Icon: Crown,       dataKey: '1g Gold'       },
  { id: 'Cosmetics',     label: 'Cosmetics',      Icon: FlaskConical,dataKey: 'Cosmetics'     },
];

const HOME_BANNERS = [
  { id: 1, image: '/Gemini_Generated_Image_pxcb6vpxcb6vpxcb.png', title: 'Mithila Splendor' },
  { id: 2, image: '/Gemini_Generated_Image_rhy76srhy76srhy7.png', title: 'Cultural Heritage' },
  { id: 3, image: '/Gemini_Generated_Image_unwuxnunwuxnunwu.png', title: 'Festive Handlooms' },
  { id: 4, image: '/Gemini_Generated_Image_xaqtwqxaqtwqxaqt.png', title: 'Exclusive Masterpieces' }
];

// ── Banners per sub-category ─────────────────────────────
const BANNERS = {
  'Beauty':        HOME_BANNERS,
  'Art. Jewellery': HOME_BANNERS,
  '1g Gold':       HOME_BANNERS,
  'Cosmetics':     HOME_BANNERS,
};

// ── Deal cards per sub-category ──────────────────────────
const DEALS = {
  'Beauty':        [{ label:'Lipsticks',    badge:'Up to 50% Off', img: LipstickDeal }, { label:'Serums',       badge:'From ₹299',    img: MakeupHero    }, { label:'Shampoos',    badge:'Min 30% Off',  img: PlumShampoo   }, { label:'Hair Masks',  badge:'Under ₹699',   img: MatrixShampoo }],
  'Art. Jewellery':[{ label:'Necklaces',    badge:'Up to 50% Off', img: JewelleryImg }, { label:'Earrings',     badge:'From ₹499',    img: JewelleryImg  }, { label:'Bracelets',   badge:'Min 40% Off',  img: JewelleryImg  }, { label:'Rings',       badge:'Under ₹1999',  img: JewelleryImg  }],
  '1g Gold':       [{ label:'Gold Coins',   badge:'BIS Hallmarked',img: JewelleryImg }, { label:'Gold Chains',  badge:'From ₹5999',   img: JewelleryImg  }, { label:'Gold Rings',  badge:'Min 10% Off',  img: JewelleryImg  }, { label:'Pendants',    badge:'Under ₹7000',  img: JewelleryImg  }],
  'Cosmetics':     [{ label:'Lip Gloss',    badge:'Up to 40% Off', img: LipGloss     }, { label:'Mascara',      badge:'From ₹199',    img: Mascara       }, { label:'Lip Liner',   badge:'Min 33% Off',  img: LipLiner      }, { label:'Face Serum',  badge:'Under ₹799',   img: MakeupHero    }],
};

// ── Trending items ───────────────────────────────────────
const TRENDING = {
  'Beauty':        [{ label:'Plum Shampoo',  img: PlumShampoo   }, { label:'Loreal Serum', img: LorealShampoo }, { label:'Matrix Mask',  img: MatrixShampoo }, { label:'Mascara',      img: Mascara       }],
  'Art. Jewellery':[{ label:'Pearl Choker',  img: JewelleryImg  }, { label:'Gold Pendant', img: JewelleryImg  }, { label:'Hoop Earrings',img: JewelleryImg  }, { label:'Stud Pack',    img: JewelleryImg  }],
  '1g Gold':       [{ label:'1g Coin',       img: JewelleryImg  }, { label:'Gold Chain',   img: JewelleryImg  }, { label:'Gold Bangle',  img: JewelleryImg  }, { label:'Nose Pin',     img: JewelleryImg  }],
  'Cosmetics':     [{ label:'Lip Gloss',     img: LipGloss      }, { label:'Lip Liner',    img: LipLiner      }, { label:'Mascara',      img: Mascara       }, { label:'Makeup Kit',   img: MakeupHero    }],
};

// ── Mini product card ────────────────────────────────────
const ProductCard = React.memo(({ product, onPress }) => (
  <div onClick={() => onPress(product)} className="flex flex-col cursor-pointer group active:scale-95 transition-transform">
    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
        <span className="text-[10px] font-bold text-slate-800">{product.rating}</span>
        <Star size={8} fill="currentColor" className="text-green-600" />
      </div>
      <div className="absolute top-2 right-2 bg-[#6FAE4A] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{product.discount}</div>
    </div>
    <div className="pt-1.5 px-0.5">
      <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{product.name}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[11px] text-gray-400 line-through">₹{product.oldPrice}</span>
        <span className="text-[13px] font-black text-slate-900">₹{product.price}</span>
      </div>
    </div>
  </div>
));

// ── Auto-advancing banner carousel ──────────────────────
const HeroBanner = ({ banners }) => {
  const [idx, setIdx] = useState(0);

  // Preload images
  useEffect(() => {
    banners.forEach((b) => {
      const img = new Image();
      img.src = b.image;
    });
  }, [banners]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx(p => (p + 1) % banners.length), 2500);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <div className="px-3 py-2">
      <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-md bg-gray-50">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={banners[idx].id}
            src={banners[idx].image}
            alt={banners[idx].title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {banners.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-4 bg-[#6FAE4A]' : 'w-1.5 bg-gray-300'}`} />
        ))}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────
const BeautyLanding = () => {
  const navigate  = useNavigate();
  const [active, setActive]     = useState('Beauty');
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const update = async () => setCartCount(await fetchCartCount());
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const homeData = await getFlowHome('beauty');
        const sectionProducts = (homeData?.sections || []).flatMap((section) => section.products || []);
        if (sectionProducts.length && !cancelled) {
          setProducts(sectionProducts.map((item) => mapProductForCard(item)));
          return;
        }
      } catch {
        // fall through to category lookup
      }

      try {
        const categories = await getCategories();
        const category = findCategoryByName(categories, active) || findCategoryByName(categories, 'Beauty');
        const categoryId = category?.id || category?._id;
        if (categoryId) {
          const data = await getCategoryProducts(categoryId, { limit: 24 });
          if (!cancelled) {
            setProducts(extractList(data).map((item) => mapProductForCard(item)));
          }
          return;
        }
      } catch {
        // ignore
      }

      if (!cancelled) setProducts([]);
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [active]);

  const handleProductClick = useCallback((product) => {
    navigate('/product-detail', {
      state: { product: { ...product, off: product.discount, label: 'Beauty Deal', brand: 'Brand', reviews: '1,200', delivery: 'Tomorrow' } }
    });
  }, [navigate]);

  const addToCart = useCallback(async (product) => {
    try {
      await addProductToCart(product, 1, 'beauty');
      dispatchCartUpdated();
    } catch {
      // cart API may require auth for some flows
    }
  }, []);

  const banners   = BANNERS[active]   || BANNERS['Beauty'];
  const deals     = DEALS[active]     || [];
  const trending  = TRENDING[active]  || [];

  return (
    <div className="bg-white min-h-screen pb-24" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>



      {/* ── Hero banner slider ── */}
      <HeroBanner banners={banners} />

      {/* ── Deal cards ── */}
      <div className="px-3 mt-2 md:max-w-[900px] md:mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[20px] font-bold text-slate-900" style={{ lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            Great Savings
          </h2>
          <button onClick={() => navigate('/all-offers')} className="flex items-center gap-0.5 text-[12px] font-bold text-[#6FAE4A]">
            See all <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {deals.map((d, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/category-products', { state: { category: active } })}
              className="bg-gradient-to-br from-[#f0f5ff] to-white rounded-2xl p-3 border border-blue-50 shadow-sm flex flex-col gap-2 cursor-pointer"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-white flex items-center justify-center p-2">
                <img src={d.img} alt={d.label} className="w-full h-full object-contain" loading="lazy" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-800 truncate">{d.label}</p>
                <span className="inline-block mt-1 bg-[#6FAE4A] text-white text-[9.5px] font-black px-2 py-0.5 rounded-full">{d.badge}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Trending items ── */}
      <div className="px-3 mt-5 md:max-w-[900px] md:mx-auto w-full">
        <h2 className="text-[20px] font-bold text-slate-900 mb-3" style={{ lineHeight: 1.2, letterSpacing: '-0.3px' }}>
          Trending Now
        </h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {trending.map((t, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/category-products', { state: { category: active } })}
              className="flex-shrink-0 w-[90px] flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-[80px] h-[80px] rounded-2xl overflow-hidden bg-[#f0f5ff] border border-blue-50 flex items-center justify-center p-2">
                <img src={t.img} alt={t.label} className="w-full h-full object-contain" loading="lazy" />
              </div>
              <p className="text-[10px] font-bold text-slate-700 text-center leading-tight line-clamp-2">{t.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Promo banner ── */}
      <div className="px-3 mt-5 md:max-w-[900px] md:mx-auto w-full">
        <div className="bg-gradient-to-r from-[#1259c3] to-[#6FAE4A] rounded-2xl p-4 flex items-center justify-between overflow-hidden relative">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <p className="text-white text-[11px] font-bold uppercase tracking-widest opacity-80">Limited Time</p>
            <h3 className="text-white text-[22px] font-black leading-tight mt-0.5">Up to 60% Off</h3>
            <p className="text-white/80 text-[11px] font-medium mt-1">On {active} products</p>
            <button
              onClick={() => navigate('/all-offers')}
              className="mt-3 bg-[#FFD500] text-[#1259c3] text-[11px] font-black px-4 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              Shop Now
            </button>
          </div>
          <img src={active === '1g Gold' || active === 'Art. Jewellery' ? JewelleryImg : LipstickDeal} alt="promo" className="w-24 h-24 object-contain relative z-10 drop-shadow-lg" />
        </div>
      </div>

      {/* ── Recommended products grid ── */}
      <div className="px-3 mt-5 md:max-w-[900px] md:mx-auto w-full">
        <h2 className="text-[20px] font-bold text-slate-900 mb-3" style={{ lineHeight: 1.2, letterSpacing: '-0.3px' }}>
          Recommended for You
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-5 md:gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onPress={handleProductClick} />
          ))}
        </div>
      </div>

      {/* ── Sticky bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cart Items</p>
          <p className="text-[17px] font-black text-slate-900">{cartCount} Products</p>
        </div>
        <button
          onClick={() => navigate('/cart')}
          className="bg-[#6FAE4A] text-white px-7 py-3 rounded-xl font-black text-[13px] uppercase tracking-wider shadow-md shadow-emerald-100 active:scale-95 transition-transform"
        >
          Go to Cart
        </button>
      </div>

    </div>
  );
};

export default BeautyLanding;


