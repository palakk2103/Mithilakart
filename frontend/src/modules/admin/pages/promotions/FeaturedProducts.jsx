import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { 
  Star, TrendingUp, Search, Plus, 
  Trash2, GripVertical, ShoppingBag, CheckCircle2,
  AlertCircle, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { featuredApi } from '../../services/api';
import { extractList, mapFeaturedProduct } from '../../utils/mappers';

const FeaturedProducts = () => {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeTab, setActiveTab] = useState('Featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await featuredApi.getAll();
      if (cancelled) return;
      if (!error && data) {
        const products = extractList(data.products || data);
        const featuredRows = extractList(data.featured || data);
        const productById = new Map(products.map((p) => [String(p._id || p.id), p]));
        const items = featuredRows
          .map((row) => {
            const product = productById.get(String(row.productId)) || row.product || row;
            return {
              ...mapFeaturedProduct(product),
              featuredId: row._id || row.id,
            };
          })
          .filter((item) => item.name);
        setFeatured(items);
        setTrending([]);
      } else {
        setFeatured([]);
        setTrending([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Curation Hub</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Manage featured and trending products across the main storefront.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all">
          <Plus size={16} />
          Add to Collection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Featured Products */}
         <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shadow-inner">
                  <Star size={18} fill="currentColor" />
               </div>
               <h3 className="text-sm font-black text-slate-900 font-montserrat uppercase tracking-widest">Featured Selection</h3>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-slate-50 flex gap-4">
                  <SearchInput type="text" placeholder="Search product..." />
               </div>
               <div className="divide-y divide-slate-50">
                  {loading ? (
                    <div className="p-8 text-center text-slate-400 text-sm font-bold">Loading products...</div>
                  ) : featured.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm font-bold">No featured products found</div>
                  ) : featured.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4 group hover:bg-slate-50/50 transition-colors">
                       <GripVertical size={16} className="text-slate-200 cursor-grab active:cursor-grabbing" />
                       <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 font-montserrat leading-tight truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.category} • {item.price}</p>
                       </div>
                       <button className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
               </div>
               <div className="p-4 bg-slate-50/50 flex justify-center border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Drag products to change home display order</p>
               </div>
            </div>
         </div>

         {/* Trending Products */}
         <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-red-50 text-red-500 rounded-lg shadow-inner">
                  <TrendingUp size={18} />
               </div>
               <h3 className="text-sm font-black text-slate-900 font-montserrat uppercase tracking-widest">Trending Now</h3>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-slate-50 flex gap-4">
                  <SearchInput type="text" placeholder="Search product..." />
               </div>
               <div className="divide-y divide-slate-50">
                  {loading ? (
                    <div className="p-8 text-center text-slate-400 text-sm font-bold">Loading products...</div>
                  ) : trending.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm font-bold">No trending products found</div>
                  ) : trending.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4 group hover:bg-slate-50/50 transition-colors">
                       <GripVertical size={16} className="text-slate-200 cursor-grab active:cursor-grabbing" />
                       <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 font-montserrat leading-tight truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.category} • {item.price}</p>
                       </div>
                       <button className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
               </div>
               <div className="p-4 bg-slate-50/50 flex justify-center border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Limited to top 10 products for visibility</p>
               </div>
            </div>
         </div>
      </div>

      {/* Preview Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex items-center justify-between">
         <div className="absolute -right-20 -bottom-20 opacity-10">
            <LayoutGrid size={300} />
         </div>
         <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
               <CheckCircle2 size={32} />
            </div>
            <div>
               <h3 className="text-2xl font-black font-montserrat uppercase tracking-tight">Live Preview Ready</h3>
               <p className="text-xs opacity-60 mt-2 font-medium max-w-md leading-relaxed">
                  Your changes to featured and trending products are saved as drafts. Click publish to push them live to the mobile and web storefronts.
               </p>
            </div>
         </div>
         <button className="relative z-10 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
            Publish Changes
         </button>
      </div>
    </div>
  );
};

export default FeaturedProducts;
