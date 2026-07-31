import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, ArrowLeft, LayoutGrid, List, Mic } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import SearchInput from '../../../shared/components/SearchInput';
import { search } from '../services/userApi';
import { extractList, mapProductForCard } from '../utils/mappers';

import SamsungImg from '../../../assets/products/product01.jpg';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [viewMode, setViewMode] = useState('grid');
  const [isListening, setIsListening] = useState(false);
  const [searchValue, setSearchValue] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await search({ q: query, limit: 40 });
        if (!cancelled) {
          setProducts(extractList(data).map((p) => mapProductForCard(p, SamsungImg)));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setSearchValue(speechToText);
      navigate(`/search?q=${encodeURIComponent(speechToText)}`);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#FFF5EE]' : 'bg-[#eaf5ee]');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#207C8A] to-[#144f58]' : isFreshGroceryFlow ? 'bg-gradient-to-r from-[#F5B014] to-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF7A00]' : 'bg-[#3E5A44]');
  const textPrimary = isMithilakFlow ? 'text-[#207C8A]' : isFreshGroceryFlow ? 'text-[#7A3E17]' : (isQuickShopFlow ? 'text-[#F26522]' : 'text-[#3E5A44]');
  const borderPrimary = isMithilakFlow ? 'border-[#207C8A]' : isFreshGroceryFlow ? 'border-[#7A3E17]' : (isQuickShopFlow ? 'border-[#F26522]' : 'border-[#3E5A44]');

  const filteredProducts = products;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${pageBg} text-slate-800 pb-20`}
    >
      {/* Search Header (Colored based on active tab) */}
      <div className={`sticky top-0 z-40 ${headerBg} p-4 flex items-center gap-4 shadow-md`}>
        <button onClick={() => navigate(-1)} className={isFreshGroceryFlow ? 'text-black' : 'text-white'}>
          <ArrowLeft size={24} />
        </button>
        <SearchInput
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/search?q=${e.target.value}`);
            }
          }}
          placeholder={isListening ? "Listening..." : "Search Mithilakart..."}
          rightElement={
            <Mic 
              size={18} 
              onClick={handleVoiceSearch}
              className={`cursor-pointer hover:text-opacity-80 transition-colors ${
                isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'
              }`} 
            />
          }
        />
      </div>

      <div className="container mx-auto px-2 py-4 md:px-4 md:py-6 max-w-4xl">
        {/* Results Info & Filters */}
        <div className="flex items-center justify-between mb-5">
           <div>
              <h2 className={`text-xs font-black uppercase tracking-widest ${textPrimary}`}>Results for "{query}"</h2>
              <p className="text-[10px] font-bold text-slate-450 mt-1 uppercase tracking-widest">{filteredProducts.length} items found</p>
           </div>
           <div className="flex items-center gap-3">
              <button className="p-2 bg-white rounded-lg border border-slate-150 text-slate-700 shadow-sm active:scale-95 transition-all">
                 <Filter size={16} />
              </button>
              <div className="flex bg-white p-1 rounded-lg border border-slate-150 shadow-sm">
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-1 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#3E5A44] text-white' : 'text-slate-400'}`}
                 >
                    <LayoutGrid size={14} />
                 </button>
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#3E5A44] text-white' : 'text-slate-400'}`}
                 >
                    <List size={14} />
                 </button>
              </div>
           </div>
        </div>

        {/* Sorting Tags */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar">
           {['Relevance', 'Newest', 'Price: Low-High', 'Price: High-Low', 'Top Rated'].map(tag => (
             <button 
               key={tag}
               className={`whitespace-nowrap px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-150 bg-white text-slate-700 hover:${borderPrimary} transition-all active:scale-95 shadow-sm`}
             >
                {tag}
             </button>
           ))}
        </div>

        {/* Product Grid */}
        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4" : "space-y-3"}>
           <AnimatePresence mode="popLayout">
             {filteredProducts.map((product) => (
               <motion.div 
                 key={product.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ duration: 0.3 }}
               >
                 <ProductCard product={product} />
               </motion.div>
             ))}
           </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm mt-8">
             <SearchIcon size={40} className="mx-auto text-slate-300 mb-3 opacity-50" />
             <h3 className={`text-base font-black uppercase tracking-widest ${textPrimary}`}>No results found</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">Try checking your spelling or use more general keywords</p>
             <button 
               onClick={() => navigate('/home')}
               className={`mt-5 px-6 py-2.5 ${headerBg} ${isFreshGroceryFlow ? 'text-black' : 'text-white'} rounded-xl font-black uppercase tracking-widest text-[9px] shadow-md`}
             >
                Go Back Home
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
