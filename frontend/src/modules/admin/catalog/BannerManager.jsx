import React, { useState, useEffect } from 'react';
import { bannersApi } from '../services/api';
import { extractList } from '../utils/mappers';
import {
  Plus, Trash2, Edit2, Eye, EyeOff, Image as ImageIcon,
  GripVertical, ToggleLeft, ToggleRight, Save, X, Upload,
  ChevronDown, CheckCircle2, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// These match the exact category banners used in Home.jsx
const INITIAL_BANNERS = {
  'Home': [
    { id: 1, title: 'Summer Sale', subtitle: 'Up to 70% Off', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=300&fit=crop', link: '/home', active: true },
    { id: 2, title: 'New Arrivals', subtitle: 'Fresh Collections', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=300&fit=crop', link: '/home', active: true },
    { id: 3, title: 'Electronics Deal', subtitle: 'Best Tech Prices', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=300&fit=crop', link: '/home', active: true },
    { id: 4, title: 'Grocery Offers', subtitle: 'Daily Essentials', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&fit=crop', link: '/home', active: false },
  ],
  'Fashion': [
    { id: 5, title: 'Premium Fashion', subtitle: 'Designer Wear', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=300&fit=crop', link: '/vendor/toys', active: true },
    { id: 6, title: 'Summer Collection', subtitle: 'New Season', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=300&fit=crop', link: '/home', active: true },
  ],
  'Beauty': [
    { id: 7, title: 'Skin Care', subtitle: 'Glow Up Series', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=300&fit=crop', link: '/vendor/beauty', active: true },
    { id: 8, title: 'Makeup Kits', subtitle: 'Best Brands', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=300&fit=crop', link: '/vendor/beauty', active: true },
  ],
  'Toys': [
    { id: 9, title: 'Toy World', subtitle: 'Kids Favorites', image: 'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=800&h=300&fit=crop', link: '/vendor/toys', active: true },
    { id: 10, title: 'LEGO Sale', subtitle: '50% Off', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=300&fit=crop', link: '/vendor/toys', active: false },
  ],
  'Electronics': [
    { id: 11, title: 'Tech Deals', subtitle: 'Latest Gadgets', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=300&fit=crop', link: '/home', active: true },
  ],
};

const CATEGORY_TABS = ['Home', 'Fashion', 'Beauty', 'Toys', 'Electronics'];

const EMPTY_BANNER = { title: '', subtitle: '', image: '', link: '/home', active: true, targetCategory: 'Home' };

const BannerForm = ({ formData, setFormData, onSave, onCancel, label, categories }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3 mb-4"
  >
    <div className="flex justify-between items-center border-b border-blue-100 pb-2">
      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2">
         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Show in:</label>
         <select 
            value={formData.targetCategory}
            onChange={e => setFormData(p => ({ ...p, targetCategory: e.target.value }))}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
         >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
         </select>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Banner Title *</label>
        <input
          value={formData.title}
          onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Summer Sale"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
      </div>
      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subtitle</label>
        <input
          value={formData.subtitle}
          onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
          placeholder="e.g. Up to 70% Off"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Image URL *</label>
        <input
          value={formData.image}
          onChange={e => setFormData(p => ({ ...p, image: e.target.value }))}
          placeholder="https://... or upload image"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
      </div>
      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Link (on click)</label>
        <input
          value={formData.link}
          onChange={e => setFormData(p => ({ ...p, link: e.target.value }))}
          placeholder="/home or /vendor/beauty"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
      </div>
      <div className="flex items-end gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))}
            className="accent-blue-500 w-4 h-4"
          />
          <span className="text-[11px] font-bold text-slate-600">Active on publish</span>
        </label>
      </div>
    </div>
    {/* Preview */}
    {formData.image && (
      <div className="relative rounded-lg overflow-hidden h-20 bg-slate-100 border border-slate-200">
        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
        <div className="absolute bottom-2 left-3 text-white">
          <p className="text-[11px] font-black">{formData.title}</p>
          <p className="text-[9px] opacity-80">{formData.subtitle}</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    )}
    <div className="flex gap-2">
      <button onClick={onSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
        <Save size={12} /> Save Banner
      </button>
      <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-1.5">
        <X size={12} /> Cancel
      </button>
    </div>
  </motion.div>
);

const BannerManager = () => {
  const [banners, setBanners] = useState(INITIAL_BANNERS);
  const [activeTab, setActiveTab] = useState('Home');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_BANNER);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await bannersApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
      } else {
        setError(null);
        const grouped = {};
        extractList(data).forEach((b, i) => {
          const cat = b.category || b.targetCategory || 'Home';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push({
            id: b._id || b.id || i + 1,
            title: b.title || '',
            subtitle: b.subtitle || '',
            image: b.image || b.imageUrl || '',
            link: b.link || '/home',
            active: b.isActive !== false,
          });
        });
        if (Object.keys(grouped).length) setBanners(grouped);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const currentBanners = banners[activeTab] || [];

  const handleToggle = (id) => {
    setBanners(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(b => b.id === id ? { ...b, active: !b.active } : b)
    }));
  };

  const handleDelete = (id) => {
    setBanners(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(b => b.id !== id)
    }));
  };

  const handleEdit = (banner) => {
    setEditingId(banner.id);
    setFormData({ 
      title: banner.title, 
      subtitle: banner.subtitle, 
      image: banner.image, 
      link: banner.link, 
      active: banner.active,
      targetCategory: activeTab
    });
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!formData.title || !formData.image) return;
    
    const originalCategory = activeTab;
    const newCategory = formData.targetCategory;

    setBanners(prev => {
      const updatedBanners = { ...prev };
      
      if (originalCategory === newCategory) {
        // Simple update within same category
        updatedBanners[originalCategory] = prev[originalCategory].map(b => 
          b.id === editingId ? { ...b, ...formData } : b
        );
      } else {
        // Move to different category
        const bannerToMove = { ...prev[originalCategory].find(b => b.id === editingId), ...formData };
        updatedBanners[originalCategory] = prev[originalCategory].filter(b => b.id !== editingId);
        updatedBanners[newCategory] = [...(prev[newCategory] || []), bannerToMove];
        setActiveTab(newCategory); // Switch to the new category to show the moved banner
      }
      
      return updatedBanners;
    });
    
    setEditingId(null);
    setFormData(EMPTY_BANNER);
  };

  const handleAddNew = () => {
    if (!formData.title || !formData.image) return;
    const newId = Date.now();
    const targetCat = formData.targetCategory;

    setBanners(prev => ({
      ...prev,
      [targetCat]: [...(prev[targetCat] || []), { id: newId, ...formData }]
    }));
    
    setActiveTab(targetCat); // Switch to the target category
    setIsAdding(false);
    setFormData(EMPTY_BANNER);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Banner Manager</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-raleway">Control banners shown in the user home carousel</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData(EMPTY_BANNER); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={13} /> Add Banner
          </button>
          <button
            onClick={handleSaveAll}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${saved ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {saved ? 'Saved!' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setIsAdding(false); setEditingId(null); }}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}
          >
            {tab}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[8px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {(banners[tab] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <BannerForm
            label={`Creating new banner`}
            formData={formData}
            setFormData={setFormData}
            categories={CATEGORY_TABS}
            onSave={handleAddNew}
            onCancel={() => { setIsAdding(false); setFormData(EMPTY_BANNER); }}
          />
        )}
      </AnimatePresence>

      {/* Banner List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {currentBanners.map((banner, index) => (
            <motion.div
              key={banner.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
            >
              {editingId === banner.id ? (
                <BannerForm
                  label={`Editing banner`}
                  formData={formData}
                  setFormData={setFormData}
          categories={CATEGORY_TABS}
                  onSave={handleSaveEdit}
                  onCancel={() => { setEditingId(null); setFormData(EMPTY_BANNER); }}
                />
              ) : (
                <div className={`bg-white border rounded-xl overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-stretch gap-0 shadow-sm hover:shadow-md transition-all group ${!banner.active ? 'opacity-50' : 'border-slate-100'}`}>
                  {/* Drag Handle */}
                  <div className="w-8 flex items-center justify-center bg-slate-50 border-r border-slate-100 text-slate-300 cursor-grab hidden sm:flex">
                    <GripVertical size={16} />
                  </div>
                  {/* Image Preview */}
                  <div className="w-full sm:w-32 h-32 sm:h-auto bg-slate-100 flex-shrink-0 overflow-hidden relative">
                    {banner.image ? (
                      <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <span className={`absolute bottom-1.5 left-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${banner.active ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {banner.active ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-center">
                    <h3 className="text-[13px] font-bold text-slate-900 font-montserrat">{banner.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{banner.subtitle || '—'}</p>
                    <p className="text-[9px] text-blue-400 font-black mt-1.5 uppercase tracking-tighter">→ {banner.link}</p>
                  </div>
                  {/* Position */}
                  <div className="px-4 py-2 sm:py-0 flex items-center">
                    <span className="text-[10px] font-black text-slate-300 font-roboto">Position #{index + 1}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 px-4 py-3 sm:py-0 border-t sm:border-t-0 border-slate-50 justify-end">
                    <button onClick={() => handleToggle(banner.id)} className={`p-2 rounded-lg transition-all ${banner.active ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={banner.active ? 'Deactivate' : 'Activate'}>
                      {banner.active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => handleEdit(banner)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {currentBanners.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-xl py-16 flex flex-col items-center gap-3 text-slate-300">
            <ImageIcon size={36} />
            <p className="text-[11px] font-black uppercase tracking-widest">No banners for {activeTab} tab</p>
            <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-1.5">
              <Plus size={12} /> Add First Banner
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Layers size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">How it works</p>
          <p className="text-[11px] text-blue-400 font-medium mt-1 leading-relaxed">
            Banners are shown in the carousel on the <strong>user home page</strong> when a category tab is selected. The <strong>Home</strong> tab banners are shown by default. Toggle visibility to control what buyers see live.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BannerManager;
