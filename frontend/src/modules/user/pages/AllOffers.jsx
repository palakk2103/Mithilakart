import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, ShoppingCart, X, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../../../shared/components/SearchInput';
import { getOffers } from '../services/userApi';
import { mapOffers } from '../utils/mappers';
import { fetchCartCount } from '../utils/cartUtils';

const AllOffers = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOffers();
        if (!cancelled) {
          setOffers(mapOffers(data));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load offers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
      const totalCount = await fetchCartCount();
      setCartCount(totalCount);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const filteredOffers = offers.filter((offer) =>
    (offer.title || offer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offer.brand || offer.desc || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#f4faf6] min-h-screen pb-24 font-sans text-slate-805">
      {/* Sticky Header - Emerald Theme */}
      <div className="sticky top-0 z-50 bg-[#3E5A44] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4 flex-1">
          {!isSearchVisible ? (
            <>
              <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform p-1 hover:bg-white/10 rounded-full">
                <ArrowLeft size={22} className="text-white" />
              </button>
              <h1 className="text-[17px] font-black tracking-tight text-white uppercase">All Offers</h1>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full animate-in slide-in-from-right duration-200">
               <button onClick={() => {
                 setIsSearchVisible(false);
                 setSearchQuery('');
               }} className="p-1 hover:bg-white/10 rounded-full">
                  <ArrowLeft size={22} className="text-white" />
               </button>
                <SearchInput
                  autoFocus
                  type="text" 
                  placeholder="Search in offers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rightElement={
                    searchQuery && (
                      <X 
                        size={16} 
                        className="text-gray-400 cursor-pointer hover:text-gray-600" 
                        onClick={() => setSearchQuery('')}
                      />
                    )
                  }
                />
            </div>
          )}
        </div>

        {!isSearchVisible && (
          <div className="flex items-center gap-4 ml-4">
            <button onClick={() => setIsSearchVisible(true)} className="p-1.5 hover:bg-white/10 rounded-full">
              <Search size={20} className="text-white" />
            </button>
            <div 
              onClick={() => navigate('/vendor/cart')} 
              className="relative p-1.5 hover:bg-white/10 rounded-full cursor-pointer active:scale-95 transition-transform"
            >
              <ShoppingCart size={20} className="text-white" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#e2a750] text-slate-900 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#3E5A44]">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="px-5 py-4 bg-white/70 backdrop-blur-md border-b border-slate-100/50 shadow-2xs">
        <h2 className="text-[13px] text-slate-800 font-black uppercase tracking-wider">
          Top Selection <span className="text-slate-400 font-bold ml-1">({filteredOffers.length} Products)</span>
        </h2>
      </div>

      {/* Products Grid - Premium Floating Cards */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {loading ? (
          <p className="text-sm text-slate-500 col-span-2 text-center py-8">Loading offers...</p>
        ) : error ? (
          <p className="text-sm text-red-600 col-span-2 text-center py-8">{error}</p>
        ) : (
          filteredOffers.map((offer) => (
          <div 
            key={offer.id} 
            className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)] flex flex-col items-center justify-between active:scale-[0.98] transition-all cursor-pointer group hover:shadow-xs"
            onClick={() => navigate('/vendor/product-detail', { state: { product: offer } })}
          >
            <div className="aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-2 flex items-center justify-center w-full mb-3">
              <img 
                src={offer.image || offer.img} 
                alt={offer.title || offer.name} 
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <div className="text-center w-full space-y-1">
              <h3 className="text-[11.5px] font-black text-slate-800 line-clamp-1 leading-tight uppercase tracking-tight">{offer.title || offer.name}</h3>
              <div className="text-[9px] font-black text-[#3E5A44] bg-emerald-50 px-2 py-0.5 rounded-full w-fit mx-auto mt-0.5">
                {offer.brand || 'Special Offer'}
              </div>
              <div className="flex items-baseline gap-1 justify-center pt-1.5">
                <span className="text-[13px] font-black text-slate-900">₹{offer.price}</span>
                {offer.oldPrice && <span className="text-[9.5px] text-gray-400 line-through">₹{offer.oldPrice}</span>}
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Trust Badges Footer */}
      <div className="mt-8 px-6 py-6 flex flex-col items-center gap-3 text-slate-400/80">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#3E5A44]/70" />
          <span className="text-[11px] font-black uppercase tracking-wider">100% Authentic Products</span>
        </div>
        <p className="text-[10px] text-center leading-relaxed font-bold">
          Mithilakart Trust. Verified Sellers. Easy Returns.
        </p>
      </div>
    </div>
  );
};

export default AllOffers;
