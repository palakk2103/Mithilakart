import React, { useState, useEffect } from 'react';
import { chipsApi } from '../services/api';
import { extractList, mapChip } from '../utils/mappers';
import {
  Plus, Trash2, Edit2, GripVertical, Save, X,
  CheckCircle2, Eye, EyeOff, Layers, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// These match EXACTLY the CATEGORIES array in CategoryNavbar.jsx
const INITIAL_CATEGORIES = [
  { id: 'for-you',     label: 'You Buy',     emoji: '🏠', active: true,  order: 1 },
  { id: 'beauty',      label: 'Beauty',      emoji: '💄', active: true,  order: 2 },
  { id: 'gifting',     label: 'Gifting',     emoji: '🎁', active: true,  order: 3 },
  { id: 'electronics', label: 'Electronics', emoji: '📱', active: true,  order: 4 },
  { id: 'jewellery',   label: 'Jewellery',   emoji: '💎', active: true,  order: 5 },
  { id: 'toys',        label: 'Toys',        emoji: '🧸', active: true,  order: 6 },
  { id: 'stationery',  label: 'Stationery',  emoji: '✏️', active: true,  order: 7 },
  { id: 'fashion',     label: 'Fashion',     emoji: '👗', active: true,  order: 8 },
  { id: 'electrical',  label: 'Electrical',  emoji: '⚡', active: false, order: 9 },
];

const BANNER_TABS = ['Home', 'Fashion', 'Beauty', 'Toys', 'Electronics', 'Jewellery', 'Art. Jewellery', '1g Gold', 'Cosmetics'];

const EMPTY_CAT = { label: '', emoji: '🏷️', active: true };

const CategoryChipsManager = () => {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_CAT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await chipsApi.getAll();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
      } else {
        setError(null);
        const mapped = extractList(data).map(mapChip);
        if (mapped.length) setCategories(mapped);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Banner tabs section
  const [bannerTabs, setBannerTabs] = useState(BANNER_TABS);
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);

  const handleToggle = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleDelete = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ label: cat.label, emoji: cat.emoji, active: cat.active });
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!formData.label) return;
    setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } : c));
    setEditingId(null);
    setFormData(EMPTY_CAT);
  };

  const handleAddNew = () => {
    if (!formData.label) return;
    const newId = formData.label.toLowerCase().replace(/\s+/g, '-');
    setCategories(prev => [...prev, {
      id: newId,
      label: formData.label,
      emoji: formData.emoji,
      active: formData.active,
      order: prev.length + 1
    }]);
    setIsAdding(false);
    setFormData(EMPTY_CAT);
  };

  const handleAddTab = () => {
    if (!newTabName.trim()) return;
    setBannerTabs(prev => [...prev, newTabName.trim()]);
    setNewTabName('');
    setIsAddingTab(false);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const CategoryForm = ({ onSave, onCancel, label }) => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3"
    >
      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category Name *</label>
          <input
            value={formData.label}
            onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
            placeholder="e.g. Home Decor"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Emoji / Icon</label>
          <input
            value={formData.emoji}
            onChange={e => setFormData(p => ({ ...p, emoji: e.target.value }))}
            placeholder="🏷️"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-bold outline-none focus:ring-2 focus:ring-blue-200 bg-white text-center"
            maxLength={4}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.active}
          onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))}
          className="accent-blue-500 w-4 h-4"
        />
        <span className="text-[11px] font-bold text-slate-600">Visible in app</span>
      </label>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
          <Save size={12} /> Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-1.5">
          <X size={12} /> Cancel
        </button>
      </div>
    </motion.div>
  );

  const activeCount = categories.filter(c => c.active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Category & Tab Manager</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-raleway">Control the category chips & banner tabs shown in the user app</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData(EMPTY_CAT); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={13} /> Add Category
          </button>
          <button
            onClick={handleSaveAll}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${saved ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {saved ? 'Saved!' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl">
        {[
          { label: 'Total', value: categories.length, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Visible', value: activeCount, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Hidden', value: categories.length - activeCount, color: 'text-slate-400', bg: 'bg-slate-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
              <LayoutGrid size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── SECTION 1: Category Chips (CategoryNavbar) ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-montserrat">Category Nav Chips</h2>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Appears in top scrollable nav bar</span>
        </div>

        {/* Live Preview */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 overflow-x-auto">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Live Preview</p>
          <div className="flex gap-1 flex-nowrap">
            {categories.filter(c => c.active).map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
                <span className="text-base">{cat.emoji}</span>
                <span className="text-[8px] font-bold text-slate-600 whitespace-nowrap">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {isAdding && (
            <CategoryForm
              label="Add new category chip"
              onSave={handleAddNew}
              onCancel={() => { setIsAdding(false); setFormData(EMPTY_CAT); }}
            />
          )}
        </AnimatePresence>

        {/* Category List */}
        <div className="space-y-2">
          <AnimatePresence>
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.02 }}
              >
                {editingId === cat.id ? (
                  <CategoryForm
                    label={`Editing: "${cat.label}"`}
                    onSave={handleSaveEdit}
                    onCancel={() => { setEditingId(null); setFormData(EMPTY_CAT); }}
                  />
                ) : (
                  <div className={`bg-white border rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group ${!cat.active ? 'opacity-50 border-slate-100' : 'border-slate-100'}`}>
                    <div className="text-slate-300 cursor-grab">
                      <GripVertical size={14} />
                    </div>
                    {/* Order */}
                    <span className="text-[10px] font-black text-slate-300 w-5 text-center font-roboto">#{index + 1}</span>
                    {/* Emoji */}
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-xl border border-slate-100 flex-shrink-0">
                      {cat.emoji}
                    </div>
                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-slate-900 font-montserrat leading-tight">{cat.label}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter font-roboto">ID: {cat.id}</p>
                    </div>
                    {/* Status */}
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${cat.active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {cat.active ? 'Visible' : 'Hidden'}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggle(cat.id)} className={`p-1.5 rounded-lg transition-all ${cat.active ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                        {cat.active ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button onClick={() => handleEdit(cat)} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── SECTION 2: Banner Tabs ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-montserrat">Home Banner Tabs</h2>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tabs for carousel banners in home page</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {bannerTabs.map((tab, i) => (
              <div key={i} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] font-bold text-slate-700">{tab}</span>
                <button onClick={() => setBannerTabs(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setIsAddingTab(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-black text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
            >
              <Plus size={11} /> Add Tab
            </button>
          </div>
          <AnimatePresence>
            {isAddingTab && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2">
                <input
                  value={newTabName}
                  onChange={e => setNewTabName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTab()}
                  placeholder="Tab name..."
                  className="border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-blue-200 w-40"
                  autoFocus
                />
                <button onClick={handleAddTab} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-black">Add</button>
                <button onClick={() => { setIsAddingTab(false); setNewTabName(''); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Layers size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">How it works</p>
          <p className="text-[11px] text-blue-400 font-medium mt-1 leading-relaxed">
            <strong>Category Chips</strong> appear in the scrollable navigation bar at the top of the user home page. <strong>Banner Tabs</strong> control which categories have a dedicated banner carousel section in the home page. Use the <strong>Banner Manager</strong> to add/edit the actual banner images for each tab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryChipsManager;
