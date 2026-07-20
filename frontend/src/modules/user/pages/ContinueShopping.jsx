import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart, Star } from 'lucide-react';
import { getProductById, getCategoryProducts } from '../services/catalogApi';
import { extractList, mapProductForCard, getEntityId } from '../utils/mappers';

const fallbackProduct = (productId) => ({
  id: productId,
  name: 'Premium Product',
  category: 'Fashion',
  price: '1299',
  oldPrice: '2499',
  discount: '48% OFF',
  rating: '4.5',
  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400&h=400',
  brand: 'Drasert',
});

const ContinueShopping = () => {
  const { productId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = React.useState('Trending');
  const [clickedProduct, setClickedProduct] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let product = state?.product ? mapProductForCard(state.product) : null;

      if (!product && productId) {
        try {
          const data = await getProductById(productId);
          const raw = data?.product || data;
          if (raw) product = mapProductForCard(raw);
        } catch {
          // keep fallback below
        }
      }

      if (cancelled) return;

      const resolved = product || fallbackProduct(productId);
      setClickedProduct(resolved);

      const categoryId = state?.product?.categoryId || product?.categoryId;
      if (categoryId) {
        try {
          const data = await getCategoryProducts(categoryId, { limit: 20 });
          if (!cancelled) {
            setCategoryProducts(extractList(data).map((item) => mapProductForCard(item)));
          }
        } catch {
          if (!cancelled) setCategoryProducts([]);
        }
      } else {
        setCategoryProducts([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [productId, state]);

  const relatedRecentlyViewed = useMemo(() => {
    if (!clickedProduct) return null;
    return (
      categoryProducts.find((p) => getEntityId(p) !== getEntityId(clickedProduct)) ||
      categoryProducts[0] ||
      clickedProduct
    );
  }, [clickedProduct, categoryProducts]);

  const similarProducts = useMemo(() => {
    if (!clickedProduct) return [];
    let products = categoryProducts.filter((p) => getEntityId(p) !== getEntityId(clickedProduct));

    if (activeFilter === 'High rated') {
      return [...products].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 10);
    }
    if (activeFilter === 'Best seller') {
      return [...products].reverse().slice(0, 10);
    }
    if (activeFilter === 'Brand name') {
      return [...products].sort((a, b) => (a.brand || '').localeCompare(b.brand || '')).slice(0, 10);
    }

    return products.slice(0, 10);
  }, [clickedProduct, categoryProducts, activeFilter]);

  const filters = ['Trending', 'High rated', 'Best seller', 'Brand name', 'Color'];

  const handleProductClick = (product) => {
    navigate('/product-detail', { state: { product } });
  };

  if (!clickedProduct) {
    return (
      <div className="bg-[#f4faf6] min-h-screen flex items-center justify-center text-sm font-bold text-slate-500">
        Loading products...
      </div>
    );
  }

  return (
    <div className="bg-[#f4faf6] min-h-screen pb-24 font-sans text-slate-800">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#6FAE4A] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full active:scale-95 transition-transform">
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-[17px] font-black tracking-tight text-white">Continue Shopping</h1>
        </div>
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate('/search')} className="p-1 hover:bg-white/10 rounded-full">
            <Search size={20} className="text-white" />
          </button>
          <div 
            onClick={() => navigate('/cart')} 
            className="relative p-1 hover:bg-white/10 rounded-full cursor-pointer"
          >
            <ShoppingCart size={20} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 bg-[#e2a750] text-slate-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#6FAE4A]">
              2
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Section 1: Recently Viewed */}
        <div>
          <h2 className="text-[14px] font-black text-slate-900 mb-3 tracking-wider uppercase">Recently Viewed</h2>

          <div className="grid grid-cols-2 gap-4">
            {[clickedProduct, relatedRecentlyViewed].map((product, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100/50 flex flex-col cursor-pointer active:scale-[0.98] transition-transform hover:shadow-xs"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100/55 flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-[#6FAE4A]/90 backdrop-blur-xs text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                      Last Viewed
                    </div>
                  )}
                </div>
                <div className="px-2.5 pb-2.5 pt-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{product.brand || 'Premium Brand'}</p>
                  <h3 className="text-[11.5px] font-black text-slate-800 line-clamp-1 leading-tight mb-1">{product.name}</h3>
                  <div className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit mb-1.5">
                    {product.discount || '50% off'}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-black text-slate-900">₹{product.price}</span>
                    <span className="text-[9.5px] text-gray-400 line-through">₹{product.oldPrice}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-slate-50">
                    <Star size={9} fill="#e2a750" className="text-[#e2a750]" />
                    <span className="text-[9.5px] font-black text-slate-800">{product.rating || '4.2'}</span>
                    <span className="text-[9.5px] text-slate-400 font-bold">(2.4k reviews)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Similar Products + Filters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-black text-slate-900 tracking-wider uppercase">Similar Products</h2>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {filters.map((filter, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black border transition-all ${
                  activeFilter === filter 
                    ? 'bg-[#6FAE4A] border-[#6FAE4A] text-white shadow-xs' 
                    : 'bg-white border-slate-100 text-slate-650 shadow-2xs'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Section 3: Horizontal Similar Product List */}
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3 mt-3">
            {similarProducts.map((product) => (
              <div 
                key={product.id}
                className="flex-shrink-0 w-[130px] bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-2.5 pb-2.5 pt-0.5">
                  <p className="text-[8px] font-black text-slate-405 uppercase tracking-widest leading-none mb-1">{product.brand || 'Boutique Collection'}</p>
                  <h3 className="text-[11px] font-black text-slate-800 line-clamp-1 mb-1 leading-tight">{product.name}</h3>
                  <div className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit mb-1.5">
                    {product.discount}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-black text-slate-900">₹{product.price}</span>
                    <span className="text-[9.5px] text-gray-400 line-through">₹{product.oldPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Explore Similar Trends */}
        <div>
          <h2 className="text-[14px] font-black text-slate-900 mb-3 tracking-wider uppercase">Explore Similar Trends</h2>
          
          {/* Trend Hashtags */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
            {['#Gingham', '#Oversized', '#SummerStripe', '#RetroCheck', '#PastelMix'].map((trend, idx) => (
              <button 
                key={idx}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black border transition-all ${
                  idx === 0 
                    ? 'bg-emerald-50 border-emerald-200 text-[#6FAE4A] shadow-xs' 
                    : 'bg-white border-slate-100 text-slate-650'
                }`}
              >
                {trend}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3">
            {similarProducts.slice(2, 7).map((product) => (
              <div 
                key={product.id}
                className="flex-shrink-0 w-[130px] bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-2.5 pb-2.5 pt-0.5">
                  <p className="text-[8px] font-black text-slate-405 uppercase tracking-widest leading-none mb-1">{product.brand || 'Boutique Collection'}</p>
                  <h3 className="text-[11px] font-black text-slate-800 line-clamp-1 mb-1 leading-tight">{product.name}</h3>
                  <div className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit mb-1.5">
                    {product.discount}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-black text-slate-900">₹{product.price}</span>
                    <span className="text-[9.5px] text-gray-400 line-through">₹{product.oldPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Bought Together */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-black text-slate-900 tracking-wider uppercase">Bought Together</h2>
            <button className="text-[10px] font-black text-[#6FAE4A] tracking-widest uppercase hover:underline">
              View all
            </button>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3">
            {similarProducts.slice(4, 9).map((product) => (
              <div 
                key={product.id}
                className="flex-shrink-0 w-[130px] bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-2.5 pb-2.5 pt-0.5">
                  <p className="text-[8px] font-black text-slate-405 uppercase tracking-widest leading-none mb-1">{product.brand || 'Boutique Collection'}</p>
                  <h3 className="text-[11px] font-black text-slate-800 line-clamp-1 mb-1 leading-tight">{product.name}</h3>
                  <div className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit mb-1.5">
                    {product.discount}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-black text-slate-900">₹{product.price}</span>
                    <span className="text-[9.5px] text-gray-400 line-through">₹{product.oldPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: You May Also Want to Shop for */}
        <div className="pb-8">
          <h2 className="text-[14px] font-black text-slate-900 mb-4 tracking-wider uppercase">You May Also Want to Shop for</h2>
          
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            {[
              { name: "Women's Flats", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Women's Trousers", img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Women's Jeans", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Women's Kurtas", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Accessories", img: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&q=80&w=200&h=200" }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="flex-shrink-0 w-[120px] bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)] p-2 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-black text-slate-800 text-center line-clamp-1">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinueShopping;
