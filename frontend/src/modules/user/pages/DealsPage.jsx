import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Camera, Mic, Scan, Star, Heart, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAccountStore from '../../../store/useAccountStore';
import { getDeals } from '../services/userApi';
import { extractList, mapDealsProducts } from '../utils/mappers';
import { addProductToCart } from '../utils/cartUtils';

const DealsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionTitle = location.state?.title || 'Deals for you';
  const { isDarkMode } = useAccountStore();
  
  const [wishlisted, setWishlisted] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDeals();
        if (!cancelled) {
          setProducts(mapDealsProducts(data));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load deals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sectionTitle]);

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
              placeholder="Search items, brands, categories..."
              rightElement={
                <div className="flex items-center gap-3 text-gray-550">
                  <Camera 
                    size={18} 
                    className="cursor-pointer hover:text-slate-750 transition-colors" 
                    onClick={() => {
                      toast.loading("Analyzing image search...", { id: "deals-img" });
                      setTimeout(() => {
                        toast.dismiss("deals-img");
                        toast.success("Image search completed!");
                        navigate('/search?q=Handicraft');
                      }, 1500);
                    }}
                  />
                  <Mic size={18} className="cursor-pointer hover:text-slate-750" />
                  <Scan 
                    size={18} 
                    className="cursor-pointer hover:text-slate-750 transition-colors"
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
        <div className="mt-4 px-1">
           <h1 className={`text-lg font-black uppercase tracking-[2px] ${isDarkMode ? 'text-[var(--color-gold)]' : 'text-slate-900'}`}>{sectionTitle}</h1>
           <div className={`w-10 h-1 mt-1 rounded-full ${isDarkMode ? 'bg-[var(--color-gold)] shadow-[0_0_10px_rgba(226,167,80,0.5)]' : 'bg-primary-dark shadow-sm'}`}></div>
        </div>
      </div>

      {/* Product List - Adaptive Grid */}
      <div className={`grid grid-cols-2 gap-px border-b ${isDarkMode ? 'bg-[var(--card-border)]/20 border-[var(--card-border)]/20' : 'bg-gray-200 border-gray-200'}`}>
         {products.map((product) => (
           <div 
             key={product.id} 
             onClick={() => navigate('/vendor/product-detail', { state: { product } })}
             className={`p-4 flex flex-col relative group border-[0.5px] transition-all ${isDarkMode ? 'bg-black border-[var(--card-border)]/10' : 'bg-white border-gray-100'}`}
           >
              {/* Adaptive Wishlist Button */}
              <button 
                onClick={(e) => toggleWishlist(product.id, e)}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md border shadow-lg active:scale-90 transition-all ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/80 border-gray-100'}`}
              >
                 <Heart size={18} className={wishlisted[product.id] ? "fill-red-500 text-red-500" : (isDarkMode ? "text-white/60" : "text-gray-400")} />
              </button>

              {/* Adaptive Image Container */}
              <div className={`aspect-square w-full mb-4 flex items-center justify-center p-4 relative rounded-2xl border overflow-hidden transition-all ${isDarkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-gray-50 border-gray-200/50'}`}>
                 <img src={product.image} alt={product.name} className={`w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ${isDarkMode ? 'mix-blend-lighten' : ''}`} />
                 
                 {/* Adaptive Quick Add Button */}
                 <button 
                   onClick={(e) => handleAddToCart(product, e)}
                   className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-110 z-20 ${isDarkMode ? 'bg-[var(--color-gold)] shadow-[0_5px_15px_rgba(226,167,80,0.4)]' : 'bg-primary-dark text-white shadow-[0_5px_15px_rgba(37,99,235,0.3)]'}`}
                 >
                    <Plus size={24} className={isDarkMode ? "text-black" : "text-white"} />
                 </button>
              </div>

              {/* Info */}
              <div className="space-y-1.5 px-1">
                 <div className="flex items-center gap-2">
                    <span className="bg-[#cc0c39] text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter shadow-md">{product.discount}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[var(--color-gold)]' : 'text-primary-dark'}`}>{product.label}</span>
                 </div>

                 <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black text-gray-500 mt-1 uppercase">₹</span>
                    <span className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.price}</span>
                    <span className="text-[10px] text-gray-500 line-through font-bold">₹{product.mrp}</span>
                 </div>

                 <h3 className={`text-[12px] font-black line-clamp-2 leading-relaxed h-[36px] tracking-tight ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
                    {product.name}
                 </h3>

                 <button className={`text-[11px] font-black transition-colors uppercase tracking-widest mt-1 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-primary-dark hover:text-blue-700'}`}>
                    Shop {product.brand} deals
                 </button>

                 <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-1">
                       <div className="flex gap-0.5">
                          {[1,2,3,4].map(i => <Star key={i} size={10} className={`${isDarkMode ? 'text-[var(--color-gold)] fill-[var(--color-gold)]' : 'text-orange-400 fill-orange-400'} shadow-sm`} />)}
                          <Star size={10} className="text-gray-300 fill-gray-300" />
                       </div>
                       <span className="text-[10px] text-gray-500 font-black">({product.reviews})</span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </motion.div>
  );
};

export default DealsPage;

