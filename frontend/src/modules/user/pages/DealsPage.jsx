import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Camera, Mic, Scan, Star, Heart, Plus, ChevronDown, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAccountStore from '../../../store/useAccountStore';
import useVendorStore from '../../../store/useVendorStore';
import SearchInput from '../../../shared/components/SearchInput';
import { getDeals } from '../services/userApi';
import { extractList, mapDealsProducts } from '../utils/mappers';
import { addProductToCart } from '../utils/cartUtils';

const CornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[13px] md:h-[13px] opacity-85 select-none pointer-events-none">
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#65B842" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#65B842" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#65B842" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#65B842" />
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

const CardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#65B842" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#65B842" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#65B842" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#65B842" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
      <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
      <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
      <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
      <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
      <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    </svg>
  </div>
);

const DealsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionTitle = location.state?.title || "Today's Special Deals";
  const { isDarkMode } = useAccountStore();
  const { homeSections } = useVendorStore();
  
  const [wishlisted, setWishlisted] = useState({});
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      let mapped = [];
      try {
        const data = await getDeals();
        mapped = mapDealsProducts(data);
      } catch (err) {
        console.warn('getDeals API failed:', err);
      }

      // If API returns no products, gracefully fallback to passed deals from state or vendorStore
      if (!mapped || mapped.length === 0) {
        const rawDeals = location.state?.deals || homeSections?.todaysSpecialDeals || homeSections?.brandsSpotlight || [];
        if (rawDeals.length > 0) {
          mapped = rawDeals.map((d) => {
            const p = d.product || {};
            const price = d.product?.price ?? d.price ?? p.price ?? 0;
            const mrp = d.product?.mrp ?? d.mrp ?? p.mrp ?? (price ? Math.round(price * 1.35) : 0);
            const discount = d.product?.discount || d.discount || p.discount || (mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : 'DEAL');
            return {
              id: d.id || d.productId || p._id || p.id,
              productId: d.productId || p._id || p.id,
              name: d.title || d.name || p.title || p.name || 'Special Deal Product',
              title: d.title || d.name || p.title || p.name || 'Special Deal Product',
              price,
              mrp,
              oldPrice: mrp,
              image: d.img || d.image || p.image || 'https://via.placeholder.com/300',
              img: d.img || d.image || p.image || 'https://via.placeholder.com/300',
              brand: d.product?.brand || d.brand || p.brand || 'MITHILAKART',
              discount,
              rating: d.product?.rating || d.rating || p.rating || 4.7,
              reviewCount: d.product?.reviewCount || d.reviewCount || p.reviewCount || 24,
              label: 'Limited Deal',
              product: p && Object.keys(p).length > 0 ? p : d,
            };
          });
        }
      }

      if (!cancelled) {
        setProducts(mapped);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sectionTitle, location.state, homeSections]);

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    try {
      await addProductToCart(product);
      toast.success('Added to cart');
    } catch {
      toast.error('Could not add to cart');
    }
  };

  const toggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlisted(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success(wishlisted[id] ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name || p.title || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen pb-20 transition-colors duration-500 bg-[#f8f9fa] text-slate-900"
    >
      {/* Premium Adaptive Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-md border-b p-3 transition-all ${isDarkMode ? 'bg-black/90 border-[var(--color-gold)]/20' : 'bg-white/90 border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={isDarkMode ? 'text-[var(--color-gold)]' : 'text-slate-800'}>
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <SearchInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search items, brands, categories..."
              className="rounded-full shadow-xs"
              rightElement={
                <div className="flex items-center gap-2.5 text-slate-500">
                  <Camera 
                    size={17} 
                    className="cursor-pointer hover:text-slate-800 transition-colors" 
                    onClick={() => {
                      toast.loading("Analyzing image search...", { id: "deals-img" });
                      setTimeout(() => {
                        toast.dismiss("deals-img");
                        toast.success("Image search completed!");
                        navigate('/search?q=Handicraft');
                      }, 1500);
                    }}
                  />
                  <Mic size={17} className="cursor-pointer hover:text-slate-800 transition-colors" />
                  <Scan 
                    size={17} 
                    className="cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => {
                      toast.loading("Simulating barcode scanner...", { id: "deals-scan" });
                      setTimeout(() => {
                        toast.dismiss("deals-scan");
                        toast.success("Barcode recognized successfully!");
                        navigate('/search?q=Painting');
                      }, 1500);
                    }}
                  />
                </div>
              }
            />
          </div>
        </div>

        {/* Adaptive Page Title */}
        <div className="mt-3 px-1 flex items-center justify-between">
          <div>
            <h1 className={`text-base md:text-lg font-black uppercase tracking-[1px] ${isDarkMode ? 'text-[var(--color-gold)]' : 'text-slate-900'}`}>{sectionTitle}</h1>
            <div className={`w-10 h-1 mt-1 rounded-full ${isDarkMode ? 'bg-[var(--color-gold)] shadow-[0_0_10px_rgba(226,167,80,0.5)]' : 'bg-[#3E5A44] shadow-sm'}`}></div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {filteredProducts.length} deals available
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 bg-white border border-gray-100 rounded-2xl p-3 animate-pulse flex flex-col justify-between">
              <div className="aspect-square bg-gray-100 rounded-xl" />
              <div className="space-y-2 mt-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4 max-w-[1600px] mx-auto">
          {filteredProducts.map((product) => {
            const isItemWishlisted = wishlisted[product.id];
            return (
              <div
                key={product.id}
                onClick={() => navigate('/vendor/product-detail', { state: { product: product.product || product, productId: product.id } })}
                className="flex flex-col cursor-pointer group w-full h-full relative bg-[#FFFDF9] border border-[#EADCC9]/70 rounded-[18px] md:rounded-[24px] p-2 md:p-3 shadow-[0_2px_8px_rgba(61,35,20,0.015)] hover:shadow-[0_6px_18px_rgba(61,35,20,0.04)] hover:border-[#3E5A44]/35 transition-all duration-300 transform select-none justify-between"
              >
                {/* Inner Decorative Dashed Border */}
                <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[#D35400]/20 rounded-[15px] md:rounded-[20px]" />

                {/* Corner Ornaments */}
                <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><CornerFlower /></div>
                <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><CornerFlower /></div>
                <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><CornerFlower /></div>
                <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><CornerFlower /></div>

                {/* Product Image Section */}
                <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[#EADCC9]/40 p-1">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-[11px] md:rounded-[15px] group-hover:scale-[1.04] transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
                  >
                    <Heart
                      size={11}
                      className={`transition-colors ${isItemWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'stroke-[#3F2A20] fill-none'}`}
                    />
                  </button>

                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="absolute top-1.5 left-1.5 bg-[#3E5A44] text-white text-[7.5px] md:text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
                      {product.discount}
                    </div>
                  )}

                  {/* Rating Badge */}
                  {product.rating > 0 && (
                    <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded-[4px] shadow-xs border border-[#EADCC9]/30">
                      <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{product.rating}</span>
                      <Star size={7} fill="currentColor" className="text-amber-500 stroke-none" />
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="pt-2 pb-0.5 px-0.5 relative z-10 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-slate-400 text-[8.5px] md:text-[9.5px] font-bold block uppercase tracking-wider">
                      {product.brand || 'MITHILAKART'}
                    </span>
                    <h3 className="text-[11px] md:text-[13px] font-black text-[#3F2A20] line-clamp-1 leading-tight mt-0.5">
                      {product.name}
                    </h3>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[12px] md:text-[14px] font-black text-slate-900">₹{product.price}</span>
                      {product.mrp && (
                        <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-semibold">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="mt-2.5 flex items-center justify-between gap-1 pt-1 border-t border-[#EADCC9]/40">
                    <button
                      onClick={(e) => handleAddToCart(product.product || product, e)}
                      className="w-full py-1.5 px-2 bg-[#FFF8EE] hover:bg-[#3E5A44] text-[#3E5A44] hover:text-white border border-[#3E5A44]/30 rounded-xl text-[10px] md:text-[11px] font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs"
                    >
                      <ShoppingBag size={12} strokeWidth={2.2} />
                      <span>Add to Cart</span>
                    </button>
                  </div>

                  <CardBottomDivider />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#3E5A44] flex items-center justify-center mb-3 shadow-inner">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No deals match your search</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">Try different keywords or browse our catalog.</p>
          <button
            onClick={() => { setSearchQuery(''); navigate('/'); }}
            className="mt-4 px-5 py-2 bg-[#3E5A44] text-white text-xs font-bold rounded-xl active:scale-95 transition-transform shadow-sm"
          >
            Continue Shopping
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default DealsPage;

