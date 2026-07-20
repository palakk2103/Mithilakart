import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { categoriesApi } from '../services/api';
import { extractList, mapCategory } from '../utils/mappers';
import { 
  Plus, Search, Edit2, Trash2, ChevronRight, 
  Layers, Package, Grid, Filter, MoreVertical,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await categoriesApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
        setCategories([]);
      } else {
        setError(null);
        setCategories(extractList(data).map(mapCategory));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-center max-w-5xl">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Category Manager</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-raleway">Manage platform hierarchy</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={14} />
          New Category
        </button>
      </div>

      {/* Stats Quick View - More Compact Width */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl">
        {[
          { label: 'Total', value: categories.length, icon: Grid, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active', value: categories.filter(c => c.status === 'Active').length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Drafts', value: categories.filter(c => c.status !== 'Active').length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-lg font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters - Compact Width */}
      <div className="flex gap-3 items-center max-w-xl">
        <div className="flex-1">
          <SearchInput 
            type="text" 
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
          <Filter size={14} />
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <AnimatePresence>
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.02 }}
              className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="relative h-20 overflow-hidden bg-slate-50">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest shadow-sm ${
                    category.status === 'Active' ? 'bg-green-500 text-white' : 
                    category.status === 'Draft' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                  }`}>
                    {category.status}
                  </span>
                </div>
              </div>
              
              <div className="p-3 flex-1 flex flex-col gap-2.5">
                <div>
                  <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight font-montserrat line-clamp-1 leading-tight">{category.name}</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 font-roboto leading-none">/{category.slug}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Package size={10} className="text-blue-500" />
                  <span className="text-[9px] font-bold text-slate-500 font-raleway leading-none">{category.count} Products</span>
                </div>

                <div className="pt-2 border-t border-slate-50 flex gap-1.5">
                  <button className="flex-1 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-1">
                    <Edit2 size={10} />
                    Manage
                  </button>
                  <button className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Category Card - Also Compact */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="group border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-4 gap-2 hover:border-blue-500 hover:bg-blue-50/20 transition-all min-h-[160px]"
        >
          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
            <Plus size={20} />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest font-montserrat">New Category</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CategoryManager;
