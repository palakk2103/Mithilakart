import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart, Star } from 'lucide-react';
import { getProductById, getCategoryProducts } from '../services/catalogApi';
import { extractList, mapProductForCard } from '../utils/mappers';
import { fetchCartCount } from '../utils/cartUtils';

const ContinueShopping = () => {
  const { productId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Trending');
  const [clickedProduct, setClickedProduct] = useState(state?.product ? mapProductForCard(state.product) : null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchCartCount().then(setCartCount).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let product = state?.product ? mapProductForCard(state.product) : null;

        if (!product && productId) {
          const detail = await getProductById(productId);
          if (detail) product = mapProductForCard(detail);
        }

        if (cancelled) return;
        setClickedProduct(product);

        if (product?.categoryId) {
          const data = await getCategoryProducts(product.categoryId, { limit: 20 });
          if (cancelled) return;
          const list = extractList(data)
            .map((p) => mapProductForCard(p))
            .filter((p) => p.id !== product.id);
          setSimilarProducts(list);
        } else {
          setSimilarProducts([]);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const sortedSimilarProducts = useMemo(() => {
    const products = [...similarProducts];

    if (activeFilter === 'High rated') {
      return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (activeFilter === 'Brand name') {
      return products.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
    }

    return products;
  }, [similarProducts, activeFilter]);

  const filters = ['Trending', 'High rated', 'Brand name'];

  const handleProductClick = (product) => {
    navigate('/product-detail', { state: { product } });
  };

  const renderProductCard = (product, { compact = false } = {}) => (
    <div
      key={product.id}
      className={`flex-shrink-0 ${compact ? 'w-[130px]' : 'w-full'} bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100 flex flex-col cursor-pointer active:scale-95 transition-transform`}
      onClick={() => handleProductClick(product)}
    >
      <div className="aspect-square m-1.5 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100 flex items-center justify-center">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="px-2.5 pb-2.5 pt-0.5">
        {product.brand && (
          <p className="text-[8px] font-black text-slate-405 uppercase tracking-widest leading-none mb-1">{product.brand}</p>
        )}
        <h3 className="text-[11px] font-black text-slate-800 line-clamp-1 mb-1 leading-tight">{product.name}</h3>
        {product.off && (
          <div className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit mb-1.5">
            {product.off}
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-black text-slate-900">₹{product.price}</span>
          {product.oldPrice && (
            <span className="text-[9.5px] text-gray-400 line-through">₹{product.oldPrice}</span>
          )}
        </div>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-50">
            <Star size={8} fill="#e2a750" className="text-[#e2a750]" />
            <span className="text-[9px] font-black text-slate-800">{product.rating}</span>
          </div>
        )}
      </div>
    </div>
  );

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
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#e2a750] text-slate-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#6FAE4A]">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {loading && (
          <div className="text-center py-16 text-slate-400 font-bold text-sm">Loading…</div>
        )}

        {!loading && error && !clickedProduct && (
          <div className="text-center py-16 text-slate-400 font-bold text-sm">{error}</div>
        )}

        {!loading && clickedProduct && (
          <>
            {/* Section 1: This Product */}
            <div>
              <h2 className="text-[14px] font-black text-slate-900 mb-3 tracking-wider uppercase">This Product</h2>
              <div className="max-w-[220px]">
                {renderProductCard(clickedProduct)}
              </div>
            </div>

            {/* Section 2: Similar Products + Filters */}
            {sortedSimilarProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-black text-slate-900 tracking-wider uppercase">Similar Products</h2>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
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

                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3 mt-3">
                  {sortedSimilarProducts.map((product) => renderProductCard(product, { compact: true }))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContinueShopping;
