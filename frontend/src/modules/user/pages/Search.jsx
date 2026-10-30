import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, ArrowLeft, LayoutGrid, List, Mic, Clock, Plane, ShoppingBag, Sparkles, X } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import SearchInput from '../../../shared/components/SearchInput';
import { search } from '../services/userApi';
import { extractList, mapProductForCard } from '../utils/mappers';
import { getCurrentMarketplaceTab, productBelongsToTab } from '../../../shared/utils/marketplaceHelpers';
import { parsePrice } from '../../../shared/utils/priceFormatter';

import SamsungImg from '../../../assets/products/product01.jpg';

const MARKETPLACE_TAB_CONFIG = [
  {
    id: 'mithilakart',
    label: 'Mithilakart',
    iconType: 'image',
    imageSrc: '/mthibg.png',
    headerBg: 'bg-gradient-to-r from-[#2B5135] to-[#1E3B26]',
    pageBg: 'bg-[#eaf5ee]',
    textPrimary: 'text-[#2B5135]',
    borderPrimary: 'border-[#2B5135]',
    activeTabBg: 'bg-white text-[#2B5135]',
    tabPillBorder: 'border-white/30',
    searchPlaceholder: 'Search Mithilakart (Crafts, Fashion, Living)...',
  },
  {
    id: 'quick_shop',
    label: 'Quick Shop',
    iconType: 'clock',
    headerBg: 'bg-gradient-to-r from-[#F26522] to-[#FF7A00]',
    pageBg: 'bg-[#FFF5EE]',
    textPrimary: 'text-[#F26522]',
    borderPrimary: 'border-[#F26522]',
    activeTabBg: 'bg-white text-[#F26522]',
    tabPillBorder: 'border-white/30',
    searchPlaceholder: 'Search Quick Shop (Snacks, Electronics, Daily)...',
  },
  {
    id: 'mithilak',
    label: 'Mithilak',
    iconType: 'plane',
    headerBg: 'bg-gradient-to-r from-[#207C8A] to-[#144f58]',
    pageBg: 'bg-gradient-to-b from-[#e0f2f1]/60 via-[#f2faf9] to-[#ffffff]',
    textPrimary: 'text-[#207C8A]',
    borderPrimary: 'border-[#207C8A]',
    activeTabBg: 'bg-white text-[#207C8A]',
    tabPillBorder: 'border-white/30',
    searchPlaceholder: 'Search Mithilak (Handicrafts, Art, Heritage)...',
  },
  {
    id: 'groceries_fresh',
    label: 'Fresh & Groceries',
    iconType: 'bag',
    headerBg: 'bg-gradient-to-r from-[#F5B014] to-[#E59800]',
    pageBg: 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]',
    textPrimary: 'text-[#7A3E17]',
    borderPrimary: 'border-[#7A3E17]',
    activeTabBg: 'bg-white text-[#7A3E17]',
    tabPillBorder: 'border-white/30',
    searchPlaceholder: 'Search Fresh Fruits, Veggies, Atta, Dal...',
  },
];

const resolveTabKey = (val) => {
  if (!val) return null;
  const lower = String(val).toLowerCase().trim();
  if (lower === 'quickshop' || lower === 'quick_shop') return 'quick_shop';
  if (lower === 'freshgrocery' || lower === 'fresh_grocery' || lower === 'groceries_fresh') return 'groceries_fresh';
  if (lower === 'mithilak') return 'mithilak';
  if (lower === 'mithilakart' || lower === 'standard') return 'mithilakart';
  return null;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlQuery = searchParams.get('q') || '';
  const initialTab = resolveTabKey(searchParams.get('tab') || searchParams.get('flow')) || getCurrentMarketplaceTab() || 'mithilakart';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('Relevance');
  const [filterPrice, setFilterPrice] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [searchValue, setSearchValue] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery.trim());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);

  // Sync tab from URL if it changes externally
  useEffect(() => {
    const fromUrl = resolveTabKey(searchParams.get('tab') || searchParams.get('flow'));
    if (fromUrl && fromUrl !== activeTab) {
      setActiveTab(fromUrl);
    }
  }, [searchParams]);

  // Keep input in sync with URL query if URL changed externally (e.g. back/forward navigation)
  useEffect(() => {
    if (urlQuery !== searchValue && !isInitialMount.current) {
      setSearchValue(urlQuery);
      setDebouncedQuery(urlQuery.trim());
    }
  }, [urlQuery]);

  // Debounce user input so typing triggers real-time search without having to press Enter
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchValue.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Keep URL parameters in sync with debounced query
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (debouncedQuery !== currentQ) {
      const nextParams = new URLSearchParams(searchParams);
      if (debouncedQuery) {
        nextParams.set('q', debouncedQuery);
      } else {
        nextParams.delete('q');
      }
      nextParams.set('tab', activeTab);
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedQuery, activeTab]);

  // Keep localStorage flow markers consistent with active tab
  useEffect(() => {
    if (activeTab === 'quick_shop') {
      localStorage.setItem('isQuickShopFlow', 'true');
      localStorage.setItem('isFreshGroceryFlow', 'false');
      localStorage.setItem('isMithilakFlow', 'false');
    } else if (activeTab === 'groceries_fresh') {
      localStorage.setItem('isQuickShopFlow', 'false');
      localStorage.setItem('isFreshGroceryFlow', 'true');
      localStorage.setItem('isMithilakFlow', 'false');
    } else if (activeTab === 'mithilak') {
      localStorage.setItem('isQuickShopFlow', 'false');
      localStorage.setItem('isFreshGroceryFlow', 'false');
      localStorage.setItem('isMithilakFlow', 'true');
    } else {
      localStorage.setItem('isQuickShopFlow', 'false');
      localStorage.setItem('isFreshGroceryFlow', 'false');
      localStorage.setItem('isMithilakFlow', 'false');
    }
  }, [activeTab]);

  // Fetch search products scoped to active tab and debounced query
  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!term) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await search({ 
          q: term, 
          tab: activeTab, 
          marketplaceTab: activeTab, 
          limit: 50 
        });
        if (!cancelled) {
          const list = extractList(data);
          const mapped = list.map((p) => mapProductForCard(p, SamsungImg));
          // Scoped client fallback
          const scoped = mapped.filter((p) => productBelongsToTab(p, activeTab));
          setProducts(scoped.length > 0 ? scoped : mapped);
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
  }, [debouncedQuery, activeTab]);

  const handleSelectTab = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    if (searchValue.trim()) {
      newParams.set('q', searchValue.trim());
    }
    navigate(`/search?${newParams.toString()}`, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const clean = searchValue.trim();
    setDebouncedQuery(clean);
    const nextParams = new URLSearchParams(searchParams);
    if (clean) {
      nextParams.set('q', clean);
    } else {
      nextParams.delete('q');
    }
    nextParams.set('tab', activeTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleClear = () => {
    setSearchValue('');
    setDebouncedQuery('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.set('tab', activeTab);
    setSearchParams(nextParams, { replace: true });
  };

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
      setDebouncedQuery(speechToText.trim());
      navigate(`/search?q=${encodeURIComponent(speechToText)}&tab=${activeTab}`);
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

  const currentTabConfig = useMemo(() => {
    return MARKETPLACE_TAB_CONFIG.find((t) => t.id === activeTab) || MARKETPLACE_TAB_CONFIG[0];
  }, [activeTab]);

  // Apply filtering & sorting
  const sortedProducts = useMemo(() => {
    let list = [...products];

    // Price Filter
    if (filterPrice === 'under500') {
      list = list.filter((p) => (p.rawPrice ?? parsePrice(p.price)) < 500);
    } else if (filterPrice === '500-2000') {
      list = list.filter((p) => {
        const val = p.rawPrice ?? parsePrice(p.price);
        return val >= 500 && val <= 2000;
      });
    } else if (filterPrice === '2000+') {
      list = list.filter((p) => (p.rawPrice ?? parsePrice(p.price)) > 2000);
    }

    // Rating Filter
    if (filterRating > 0) {
      list = list.filter((p) => (Number(p.rating) || 0) >= filterRating);
    }

    // Sorting
    const getPrice = (p) => p.rawPrice ?? parsePrice(p.price) ?? 0;
    const getRating = (p) => Number(p.rating) || 0;
    const getPopularity = (p) => Number(p.popularity ?? p.reviewCount ?? 0);

    if (sortBy === 'Price: Low-High') {
      list.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === 'Price: High-Low') {
      list.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === 'Top Rated') {
      list.sort((a, b) => getRating(b) - getRating(a));
    } else if (sortBy === 'Relevance') {
      list.sort((a, b) => getPopularity(b) - getPopularity(a));
    }
    return list;
  }, [products, sortBy, filterPrice, filterRating]);

  const renderTabIcon = (tab, isActive) => {
    if (tab.id === 'mithilakart') {
      return <Sparkles size={13} strokeWidth={2.5} className={isActive ? 'text-[#2B5135]' : 'text-white'} />;
    }
    if (tab.iconType === 'clock') {
      return <Clock size={13} strokeWidth={2.5} className={isActive ? 'text-[#F26522]' : 'text-white'} />;
    }
    if (tab.iconType === 'plane') {
      return <Plane size={13} strokeWidth={2.5} className={isActive ? 'text-[#207C8A]' : 'text-white'} />;
    }
    return <ShoppingBag size={13} strokeWidth={2.5} className={isActive ? 'text-[#7A3E17]' : 'text-white'} />;
  };

  const activeSearchTerm = debouncedQuery || searchValue.trim();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${currentTabConfig.pageBg} text-slate-800 pb-20 transition-colors duration-300`}
    >
      {/* Search Header with Integrated Tabs */}
      <div className={`sticky top-0 z-40 ${currentTabConfig.headerBg} shadow-md transition-colors duration-300`}>
        <div className="p-3 md:p-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors active:scale-95 flex-shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeft size={22} />
          </button>
          
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
            <SearchInput
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(e);
                }
              }}
              placeholder={isListening ? "Listening..." : currentTabConfig.searchPlaceholder}
              rightElement={
                <div className="flex items-center gap-2">
                  {searchValue && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <Mic 
                    size={18} 
                    onClick={handleVoiceSearch}
                    className={`cursor-pointer hover:text-opacity-80 transition-colors ${
                      isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'
                    }`} 
                  />
                </div>
              }
            />
          </form>
        </div>

        {/* Marketplace Flow Tabs Bar */}
        <div className="px-3 pb-2.5 pt-0.5 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2">
          {MARKETPLACE_TAB_CONFIG.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black tracking-wide whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? `${tab.activeTabBg} shadow-sm border-white`
                    : `bg-white/15 text-white hover:bg-white/25 border-white/20 active:scale-95`
                }`}
              >
                {renderTabIcon(tab, isActive)}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-5xl">
        {/* Results Info & Display Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
           <div>
              <h2 className={`text-xs md:text-sm font-black uppercase tracking-wider ${currentTabConfig.textPrimary}`}>
                {activeSearchTerm ? `Results for "${activeSearchTerm}"` : `Type to search in ${currentTabConfig.label}`}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                {loading ? 'Searching products...' : `${sortedProducts.length} items found in ${currentTabConfig.label}`}
              </p>
           </div>
           
           <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
                 <button 
                   onClick={() => setViewMode('grid')}
                   title="Grid View"
                   className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? `${currentTabConfig.headerBg} text-white shadow-xs` : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <LayoutGrid size={15} />
                 </button>
                 <button 
                   onClick={() => setViewMode('list')}
                   title="List View"
                   className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? `${currentTabConfig.headerBg} text-white shadow-xs` : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <List size={15} />
                 </button>
              </div>
           </div>
        </div>

        {/* Sorting & Filter Controls */}
        <div className="flex flex-col gap-2 mb-5">
          {/* Sort row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">Sort:</span>
             {['Relevance', 'Price: Low-High', 'Price: High-Low', 'Top Rated'].map((tag) => (
               <button 
                 key={tag}
                 onClick={() => setSortBy(tag)}
                 className={`whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-xs border ${
                   sortBy === tag
                     ? `${currentTabConfig.headerBg} text-white border-transparent`
                     : `bg-white text-slate-700 hover:border-slate-300 border-slate-200/80`
                 }`}
               >
                  {tag}
               </button>
             ))}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
               <Filter size={10} /> Filter:
             </span>
             {[
               { id: 'all', label: 'All Prices' },
               { id: 'under500', label: '< ₹500' },
               { id: '500-2000', label: '₹500 - ₹2,000' },
               { id: '2000+', label: '> ₹2,000' },
             ].map((f) => (
               <button
                 key={f.id}
                 onClick={() => setFilterPrice(f.id)}
                 className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9.5px] font-bold transition-all border ${
                   filterPrice === f.id
                     ? `${currentTabConfig.headerBg} text-white border-transparent shadow-xs`
                     : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                 }`}
               >
                 {f.label}
               </button>
             ))}

             <button
               onClick={() => setFilterRating((prev) => (prev === 4 ? 0 : 4))}
               className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9.5px] font-bold transition-all border flex items-center gap-0.5 ${
                 filterRating === 4
                   ? `${currentTabConfig.headerBg} text-white border-transparent shadow-xs`
                   : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
               }`}
             >
               ★ 4+ Rated
             </button>

             {(filterPrice !== 'all' || filterRating > 0) && (
               <button
                 onClick={() => {
                   setFilterPrice('all');
                   setFilterRating(0);
                 }}
                 className="text-[9.5px] font-bold text-red-600 hover:underline px-1.5 whitespace-nowrap"
               >
                 Reset
               </button>
             )}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4" : "space-y-3"}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-xs animate-pulse">
                <div className="w-full aspect-square bg-slate-200 rounded-xl mb-3" />
                <div className="h-3.5 bg-slate-200 rounded-md w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-3" />
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Product Grid / List */}
        {!loading && sortedProducts.length > 0 && (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4" : "space-y-3"}>
             <AnimatePresence mode="popLayout">
               {sortedProducts.map((product) => (
                 <motion.div 
                   key={product.id || product.listingId || product._id}
                   layout
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.2 }}
                 >
                   <ProductCard product={product} />
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && activeSearchTerm && sortedProducts.length === 0 && (
          <div className="text-center py-14 bg-white rounded-3xl border border-slate-200/80 shadow-xs mt-4 p-6 max-w-md mx-auto">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
               <SearchIcon size={30} className="text-slate-400" />
             </div>
             <h3 className={`text-base font-black uppercase tracking-wider ${currentTabConfig.textPrimary}`}>
               No results in {currentTabConfig.label}
             </h3>
             <p className="text-xs text-slate-500 font-medium mt-1">
               We couldn't find any items matching "{activeSearchTerm}" in {currentTabConfig.label}.
             </p>

             <div className="mt-5 pt-4 border-t border-slate-100">
               <p className="text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-2.5">
                 Try searching in other tabs:
               </p>
               <div className="flex flex-wrap justify-center gap-1.5">
                 {MARKETPLACE_TAB_CONFIG.filter((t) => t.id !== activeTab).map((otherTab) => (
                   <button
                     key={otherTab.id}
                     onClick={() => handleSelectTab(otherTab.id)}
                     className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-700 transition-colors"
                   >
                     Search in {otherTab.label}
                   </button>
                 ))}
               </div>
             </div>

             <button 
               onClick={() => navigate('/home')}
               className={`mt-6 px-6 py-2.5 ${currentTabConfig.headerBg} text-white rounded-xl font-black uppercase tracking-wider text-[10px] shadow-sm active:scale-95 transition-transform`}
             >
                Explore Homepage
             </button>
          </div>
        )}

        {/* Initial Prompt When Query is Empty */}
        {!loading && !activeSearchTerm && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs mt-4 p-6 max-w-md mx-auto">
             <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
               <Sparkles size={28} className="text-emerald-600" />
             </div>
             <h3 className={`text-base font-black uppercase tracking-wider ${currentTabConfig.textPrimary}`}>
               Search in {currentTabConfig.label}
             </h3>
             <p className="text-xs text-slate-500 font-medium mt-1.5">
               Type keywords above or use voice search to discover top products.
             </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
