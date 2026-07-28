import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { categoriesApi } from '../services/api';
import { extractList, mapCategory } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { uploadCmsImage } from '../../../shared/services/uploadService';
import {
  Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Grid, Filter, Loader2, Upload, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const COMMERCE_FLOWS = [
  { value: 'standard', label: 'Mithilakart', tab: 'mithilakart' },
  { value: 'quick_shop', label: 'Quick Shop', tab: 'quick_shop' },
  { value: 'fresh_grocery', label: 'Groceries & Fresh', tab: 'groceries_fresh' },
  { value: 'mithilak', label: 'Mithilak', tab: 'mithilak' },
];

const VISIBLE_TABS = [
  { value: 'mithilakart', label: 'Mithilakart' },
  { value: 'mithilak', label: 'Mithilak' },
  { value: 'quick_shop', label: 'Quick Shop' },
  { value: 'groceries_fresh', label: 'Groceries & Fresh' },
];

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  imageUrl: '',
  iconUrl: '',
  sortOrder: 0,
  isActive: true,
  commerceFlows: ['standard'],
  visibleTabs: ['mithilakart'],
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const { data, error: apiError } = await categoriesApi.getAll();
    if (apiError) {
      setError(apiError);
      setCategories([]);
    } else {
      setError(null);
      setCategories(extractList(data).map(mapCategory));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const parentOptions = useMemo(
    () => categories.filter((cat) => !cat.parentId),
    [categories]
  );

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    || cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = (parentId = '') => {
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM, parentId, sortOrder: categories.length });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || '',
      imageUrl: category.imageUrl || category.image || '',
      iconUrl: category.iconUrl || '',
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
      commerceFlows: category.commerceFlows?.length ? category.commerceFlows : ['standard'],
      visibleTabs: category.visibleTabs?.length ? category.visibleTabs : ['mithilakart'],
    });
    setModalOpen(true);
  };

  const handleNameChange = (name) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slugify(name),
    }));
  };

  const toggleFlow = (flow) => {
    setForm((prev) => {
      const exists = prev.commerceFlows.includes(flow);
      const commerceFlows = exists
        ? prev.commerceFlows.filter((f) => f !== flow)
        : [...prev.commerceFlows, flow];
      const flowDef = COMMERCE_FLOWS.find((f) => f.value === flow);
      const tab = flowDef?.tab;
      let visibleTabs = prev.visibleTabs || [];
      if (tab) {
        visibleTabs = exists
          ? visibleTabs.filter((t) => t !== tab)
          : [...visibleTabs, tab];
      }
      return {
        ...prev,
        commerceFlows: commerceFlows.length ? commerceFlows : ['standard'],
        visibleTabs: visibleTabs.length ? visibleTabs : ['mithilakart'],
      };
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCmsImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description,
      parentId: form.parentId || null,
      imageUrl: form.imageUrl || null,
      iconUrl: form.iconUrl || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      commerceFlows: form.commerceFlows,
      visibleTabs: form.visibleTabs,
    };

    const result = editingCategory
      ? await categoriesApi.update(editingCategory.id, payload)
      : await categoriesApi.create(payload);

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingCategory ? 'Category updated' : 'Category created');
    setModalOpen(false);
    loadCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error: apiError } = await categoriesApi.delete(deleteTarget.id);
    if (apiError) {
      toast.error(apiError);
      return;
    }
    toast.success('Category deleted');
    setDeleteTarget(null);
    loadCategories();
  };

  const handleToggleActive = async (category) => {
    const { error: apiError } = await categoriesApi.update(category.id, {
      isActive: category.isActive === false,
    });
    if (apiError) {
      toast.error(apiError);
      return;
    }
    loadCategories();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center max-w-5xl">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Category Manager</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-raleway">Manage platform hierarchy — changes reflect on user app immediately</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={14} />
          New Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 max-w-3xl">
        {[
          { label: 'Total', value: categories.length, icon: Grid, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active', value: categories.filter((c) => c.isActive !== false).length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Inactive', value: categories.filter((c) => c.isActive === false).length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-bold">Loading categories...</span>
        </div>
      ) : (
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
                    src={category.imageUrl || category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest shadow-sm ${
                        category.isActive !== false ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'
                      }`}
                    >
                      {category.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  {category.parentName && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">
                      Sub of {category.parentName}
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col gap-2.5">
                  <div>
                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight font-montserrat line-clamp-1 leading-tight">{category.name}</h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 font-roboto leading-none">/{category.slug}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(category.commerceFlows || ['standard']).map((flow) => (
                      <span key={flow} className="text-[7px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {flow.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex gap-1.5">
                    <button
                      onClick={() => openEdit(category)}
                      className="flex-1 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-1"
                    >
                      <Edit2 size={10} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={() => openCreate()}
            className="group border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-4 gap-2 hover:border-blue-500 hover:bg-blue-50/20 transition-all min-h-[160px]"
          >
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
              <Plus size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest font-montserrat">New Category</p>
          </button>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Parent Category (sub-category)</label>
            <div className="relative">
              <select
                value={form.parentId}
                onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none"
              >
                <option value="">None (top-level)</option>
                {parentOptions.filter((p) => p.id !== editingCategory?.id).map((parent) => (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Visible marketplace tabs</label>
            <div className="flex flex-wrap gap-2">
              {COMMERCE_FLOWS.map((flow) => (
                <button
                  key={flow.value}
                  type="button"
                  onClick={() => toggleFlow(flow.value)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    form.commerceFlows.includes(flow.value)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {flow.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer pt-6">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="w-5 h-5 accent-blue-500"
              />
              <span className="text-sm font-bold text-slate-700">Active (visible to users)</span>
            </label>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category Image</label>
            <div className="flex gap-3 items-center">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="/uploads/cms/... or https://"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              />
              <label className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-all">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Preview" className="mt-3 h-24 w-full object-cover rounded-xl border border-slate-100" />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        type="delete"
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Products linked to this category may become uncategorized.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default CategoryManager;
