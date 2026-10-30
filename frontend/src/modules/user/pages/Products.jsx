import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { getProducts, getCategories } from '../services/catalogApi';
import { extractList, mapProductForCard } from '../utils/mappers';
import { getCurrentMarketplaceTab } from '../../../shared/utils/marketplaceHelpers';
import { parsePrice } from '../../../shared/utils/priceFormatter';
import { Filter, X, SlidersHorizontal, Star, RotateCcw } from 'lucide-react';

import SamsungImg from '../../../assets/products/product01.jpg';

const Products = () => {
  const [searchParams] = useSearchParams();
  const marketplaceTab = searchParams.get('tab') || getCurrentMarketplaceTab();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('Relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts({ limit: 48, marketplaceTab }),
          getCategories({ marketplaceTab }).catch(() => [])
        ]);

        if (!cancelled) {
          const mapped = extractList(productsData).map((p) => mapProductForCard(p, SamsungImg));
          setProducts(mapped);

          // Get categories from API or derive from products
          const apiCats = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
          if (apiCats.length > 0) {
            setCategories(apiCats.map(c => c.name || c.title).filter(Boolean));
          } else {
            const derived = Array.from(new Set(mapped.map(p => p.category).filter(Boolean)));
            setCategories(derived.length > 0 ? derived : ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty']);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [marketplaceTab]);

  const toggleCategory = (catName) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setSortBy('Relevance');
  };

  const hasActiveFilters = selectedCategories.length > 0 || minPrice !== '' || maxPrice !== '' || minRating > 0;

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || p.title || '').toLowerCase();
        return selectedCategories.some(cat => {
          const c = cat.toLowerCase();
          return pCat.includes(c) || pName.includes(c);
        });
      });
    }

    // Min Price
    if (minPrice !== '' && !isNaN(Number(minPrice))) {
      list = list.filter(p => (p.rawPrice ?? parsePrice(p.price)) >= Number(minPrice));
    }

    // Max Price
    if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
      list = list.filter(p => (p.rawPrice ?? parsePrice(p.price)) <= Number(maxPrice));
    }

    // Rating
    if (minRating > 0) {
      list = list.filter(p => (Number(p.rating) || 0) >= minRating);
    }

    // Sorting
    const getPrice = (p) => p.rawPrice ?? parsePrice(p.price) ?? 0;
    const getRating = (p) => Number(p.rating) || 0;
    const getPopularity = (p) => Number(p.popularity ?? p.reviewCount ?? 0);

    if (sortBy === 'Price: Low to High') {
      list.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === 'Price: High to Low') {
      list.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === 'Customer Rating') {
      list.sort((a, b) => getRating(b) - getRating(a));
    } else if (sortBy === 'Newest First') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'Relevance') {
      list.sort((a, b) => getPopularity(b) - getPopularity(a));
    }

    return list;
  }, [products, selectedCategories, minPrice, maxPrice, minRating, sortBy]);

  const FilterSidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="font-bold text-lg text-slate-850 flex items-center gap-2">
          <Filter size={18} /> Filters
        </h2>
        {hasActiveFilters && (
          <button 
            onClick={clearAllFilters}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} /> Clear All
          </button>
        )}
      </div>
      
      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="font-bold text-xs mb-2.5 uppercase tracking-wider text-slate-600">Category</h3>
        <ul className="space-y-1.5 text-sm text-slate-700 max-h-48 overflow-y-auto no-scrollbar pr-1">
          {categories.map((cat) => (
            <li key={cat} className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer w-full hover:text-slate-900 select-none py-0.5">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded text-[#3E5A44] focus:ring-[#3E5A44] cursor-pointer" 
                />
                <span className="text-xs font-medium">{cat}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <h3 className="font-bold text-xs mb-2.5 uppercase tracking-wider text-slate-600">Price Range</h3>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-[#3E5A44]" 
          />
          <span className="text-slate-400 font-bold">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded text-xs outline-none focus:border-[#3E5A44]" 
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: 'Under ₹500', min: '', max: '500' },
            { label: '₹500-₹2k', min: '500', max: '2000' },
            { label: '₹2k+', min: '2000', max: '' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setMinPrice(preset.min);
                setMaxPrice(preset.max);
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Ratings */}
      <div>
        <h3 className="font-bold text-xs mb-2.5 uppercase tracking-wider text-slate-600">Customer Ratings</h3>
        <div className="space-y-1 text-xs">
          {[
            { label: 'Any Rating', value: 0 },
            { label: '4★ & above', value: 4 },
            { label: '3★ & above', value: 3 },
          ].map((r) => (
            <div 
              key={r.label}
              onClick={() => setMinRating(r.value)}
              className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between select-none ${
                minRating === r.value 
                  ? 'bg-[#3E5A44] text-white font-bold' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1">
                {r.value > 0 && <Star size={12} fill="currentColor" />} {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="container mx-auto px-4 py-8 flex gap-6">
      {/* Desktop Sidebar Filters */}
      <aside className="hidden lg:block w-64 bg-white p-5 shadow-xs border border-gray-200 rounded-xl self-start">
        <FilterSidebarContent />
      </aside>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full p-5 flex flex-col shadow-xl z-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="font-bold text-base text-slate-850">Filter Products</h2>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <FilterSidebarContent />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-2.5 bg-[#3E5A44] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm"
            >
              Apply Filters ({filteredAndSortedProducts.length})
            </button>
          </div>
        </div>
      )}

      {/* Product Grid & Top Bar */}
      <div className="flex-1">
        <div className="bg-white p-3.5 sm:p-4 shadow-xs border border-gray-200 rounded-xl mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50"
            >
              <SlidersHorizontal size={14} />
              Filters {hasActiveFilters && '•'}
            </button>
            <h1 className="font-bold text-sm sm:text-base text-gray-800">
              {loading
                ? 'Loading products...'
                : error
                  ? 'Could not load products'
                  : `Showing ${filteredAndSortedProducts.length} of ${products.length} products`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 p-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#3E5A44] bg-white cursor-pointer"
            >
              <option value="Relevance">Sort by: Relevance</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
              <option value="Customer Rating">Customer Rating</option>
              <option value="Newest First">Newest First</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* Empty State */}
        {!loading && filteredAndSortedProducts.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-base font-bold text-slate-700">No products match your filter criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filters to view all products.</p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-[#3E5A44] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            <p className="text-sm text-gray-500 col-span-full">Loading...</p>
          ) : (
            filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
