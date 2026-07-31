import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Camera, ShoppingCart, 
  MapPin, ChevronDown, Bell, Star, LayoutGrid,
  Zap, Heart, Share2, Scan
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BannerCarousel from '../components/vendor/BannerCarousel';
import { fetchCartCount, addProductToCart } from '../utils/cartUtils';
import { getCategories, getCategoryProducts } from '../services/catalogApi';
import { getFlowHome } from '../services/storefrontApi';
import { extractList, findCategoryByName, mapProductForCard, mapHomeBanners } from '../utils/mappers';



const DEFAULT_BANNERS = [
  { id: 'g1', image: '/Gemini_Generated_Image_pxcb6vpxcb6vpxcb.png', title: 'Shop More Save More' },
  { id: 'g2', image: '/Gemini_Generated_Image_rhy76srhy76srhy7.png', title: 'Authentic Artisan Crafts' },
  { id: 'g3', image: '/Gemini_Generated_Image_unwuxnunwuxnunwu.png', title: 'Handcrafted Heritage' },
  { id: 'g4', image: '/Gemini_Generated_Image_xaqtwqxaqtwqxaqt.png', title: 'Festive Deals & Toys' }
];

const ToysLanding = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateCart = async () => {
      setCartCount(await fetchCartCount());
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const homeData = await getFlowHome('toys');
        if (homeData?.banners?.length && !cancelled) {
          setBanners(mapHomeBanners(homeData.banners, DEFAULT_BANNERS));
        }
        const sectionProducts = (homeData?.sections || []).flatMap((section) => section.products || []);
        if (sectionProducts.length && !cancelled) {
          setProducts(sectionProducts.map((item) => mapProductForCard(item)));
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to category lookup
      }

      try {
        const categories = await getCategories();
        const toyCategory = findCategoryByName(categories, 'toys') || findCategoryByName(categories, 'Toys');
        const categoryId = toyCategory?.id || toyCategory?._id;
        if (categoryId) {
          const data = await getCategoryProducts(categoryId, { limit: 20 });
          if (!cancelled) {
            setProducts(extractList(data).map((item) => mapProductForCard(item)));
          }
          return;
        }
      } catch {
        // Ignored
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (!cancelled) setProducts([]);
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProductClick = (product) => {
    navigate('/vendor/product-detail', { state: { product } });
  };

  return (
    <div className="bg-white min-h-screen pb-24 font-sans text-slate-900">
      {/* Banner Carousel */}
      <div className="bg-white pb-2">
        <BannerCarousel banners={banners} />
      </div>

      {/* Section: Great Savings Start Here */}
      <div className="px-4 py-6">
         <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <h2 className="text-[18px] font-black text-slate-800 tracking-tight">Great savings start here</h2>
            <div className="h-[1px] flex-1 bg-gray-100" />
         </div>

         {loading ? (
           <div className="grid grid-cols-2 gap-4">
             {[1, 2, 3, 4].map((n) => (
               <div key={n} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />
             ))}
           </div>
         ) : products.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             {products.map((product, idx) => (
               <div 
                 key={product.id || idx} 
                 onClick={() => handleProductClick(product)}
                 className="flex flex-col gap-2 group cursor-pointer border border-gray-100 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all"
               >
                 <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative flex items-center justify-center p-2">
                   <img src={product.image || product.img} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" alt={product.name || product.title} />
                 </div>
                 <div className="flex flex-col gap-1">
                   <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{product.name || product.title}</p>
                   <div className="flex items-center gap-2">
                     <span className="text-[14px] font-black text-slate-900">₹{product.price}</span>
                     {product.oldPrice && <span className="text-[11px] text-gray-400 line-through">₹{product.oldPrice}</span>}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="text-center py-12 bg-gray-50 rounded-2xl">
             <p className="text-slate-500 font-medium">No toys or baby products found.</p>
           </div>
         )}
      </div>

      {/* Sticky Bottom CTA for Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between z-50">
         <div className="flex flex-col">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Cart Total</span>
            <span className="text-[18px] font-black text-slate-900">{cartCount} Products</span>
         </div>
         <button 
           onClick={() => navigate('/vendor/cart')}
           className="bg-[#3E5A44] text-white px-8 py-3.5 rounded-xl font-black text-[13px] uppercase tracking-wider shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
         >
            Go to Cart
         </button>
      </div>
    </div>
  );
};

export default ToysLanding;
