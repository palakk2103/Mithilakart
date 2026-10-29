import SearchInput from '../../../shared/components/SearchInput';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../services/api';
import { extractList, mapCategory } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { uploadCmsImage } from '../../../shared/services/uploadService';
import {
  Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Grid, Filter, Loader2, Upload, ChevronDown, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const COMMERCE_FLOWS = [
  { value: 'standard', label: 'Mithilakart', tab: 'mithilakart' },
  { value: 'quick_shop', label: 'Quick Shop', tab: 'quick_shop' },
  { value: 'fresh_grocery', label: 'Groceries & Fresh', tab: 'groceries_fresh' },
  { value: 'mithilak', label: 'Mithilak', tab: 'mithilak' },
];

const VISIBLE_TABS = [
  { value: 'mithilakart', label: 'Mithilakart', flow: 'standard' },
  { value: 'mithilak', label: 'Mithilak', flow: 'mithilak' },
  { value: 'quick_shop', label: 'Quick Shop', flow: 'quick_shop' },
  { value: 'groceries_fresh', label: 'Groceries & Fresh', flow: 'fresh_grocery' },
];

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  parentIds: [],
  imageUrl: '',
  iconUrl: '',
  sortOrder: 0,
  isActive: true,
  commerceFlows: ['standard', 'mithilak', 'quick_shop', 'fresh_grocery'],
  visibleTabs: ['mithilakart', 'mithilak', 'quick_shop', 'groceries_fresh'],
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
  const [tabFilter, setTabFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [parentSearch, setParentSearch] = useState('');
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

  // Show each subcategory directly under its parent instead of a flat list.
  const orderedCategories = useMemo(() => {
    const ids = new Set(categories.map((c) => c.id));
    const childrenOf = new Map();
    categories.forEach((c) => {
      const pIds = c.parentIds?.length ? c.parentIds : (c.parentId ? [c.parentId] : []);
      pIds.forEach((pid) => {
        if (ids.has(pid)) {
          childrenOf.set(pid, [...(childrenOf.get(pid) || []), c]);
        }
      });
    });
    const ordered = [];
    const visitedInPath = new Set();
    const visit = (cat, depth) => {
      ordered.push({ ...cat, depth });
      (childrenOf.get(cat.id) || []).forEach((child) => {
        const edge = `${cat.id}->${child.id}`;
        if (!visitedInPath.has(edge)) {
          visitedInPath.add(edge);
          visit(child, depth + 1);
        }
      });
    };
    categories.filter((c) => {
      const pIds = c.parentIds?.length ? c.parentIds : (c.parentId ? [c.parentId] : []);
      return !pIds.length || !pIds.some((pid) => ids.has(pid));
    }).forEach((root) => visit(root, 0));
    return ordered;
  }, [categories]);

  // Available parent categories, excluding current category & its descendants to prevent circular loops
  const availableParentCategories = useMemo(() => {
    if (!editingCategory) return categories;
    const invalidIds = new Set([editingCategory.id]);
    let added = true;
    while (added) {
      added = false;
      categories.forEach((c) => {
        const pIds = c.parentIds?.length ? c.parentIds : (c.parentId ? [c.parentId] : []);
        if (pIds.some((pid) => invalidIds.has(pid)) && !invalidIds.has(c.id)) {
          invalidIds.add(c.id);
          added = true;
        }
      });
    }
    return categories.filter((c) => !invalidIds.has(c.id));
  }, [categories, editingCategory]);

  const filteredParentOptions = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    if (!q) return availableParentCategories;
    return availableParentCategories.filter((c) =>
      (c.name || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q)
    );
  }, [availableParentCategories, parentSearch]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tabMatches = (cat) => tabFilter === 'all' || (cat.visibleTabs || []).includes(tabFilter);

    if (!q) {
      return orderedCategories.filter(tabMatches);
    }

    // Build parent-child relationships
    const childrenMap = new Map();
    const parentMap = new Map();
    categories.forEach((c) => {
      const pIds = c.parentIds?.length ? c.parentIds : (c.parentId ? [c.parentId] : []);
      pIds.forEach((pid) => {
        parentMap.set(c.id, pid);
        const currentChildren = childrenMap.get(pid) || [];
        currentChildren.push(c.id);
        childrenMap.set(pid, currentChildren);
      });
    });

    // Collect all descendants (subcategories, sub-subcategories, etc.)
    const collectDescendantIds = (catId, set) => {
      const children = childrenMap.get(catId) || [];
      for (const childId of children) {
        if (!set.has(childId)) {
          set.add(childId);
          collectDescendantIds(childId, set);
        }
      }
    };

    // Collect all ancestors (parent, root)
    const collectAncestorIds = (catId, set) => {
      let currentParentId = parentMap.get(catId);
      while (currentParentId) {
        if (set.has(currentParentId)) break;
        set.add(currentParentId);
        currentParentId = parentMap.get(currentParentId);
      }
    };

    // Find direct matches (by name, slug, or parentName)
    const directMatches = new Set();
    categories.forEach((cat) => {
      const name = (cat.name || '').toLowerCase();
      const slug = (cat.slug || '').toLowerCase();
      const parentName = (cat.parentName || '').toLowerCase();
      if (name.includes(q) || slug.includes(q) || parentName.includes(q)) {
        directMatches.add(cat.id);
      }
    });

    // Combine matching IDs with all their subcategories and parents
    const visibleIds = new Set();
    directMatches.forEach((id) => {
      visibleIds.add(id);
      collectDescendantIds(id, visibleIds);
      collectAncestorIds(id, visibleIds);
    });

    return orderedCategories.filter((cat) => visibleIds.has(cat.id) && tabMatches(cat));
  }, [orderedCategories, categories, tabFilter, searchQuery]);

  const tabsOfParent = (parentId) => {
    const parent = categories.find((c) => c.id === parentId);
    return parent?.visibleTabs?.length ? parent.visibleTabs : null;
  };

  const tabFields = (tabs) => ({
    visibleTabs: tabs,
    commerceFlows: [...new Set(tabs.map((t) => VISIBLE_TABS.find((v) => v.value === t)?.flow).filter(Boolean))],
  });

  const openCreate = (parentId = '') => {
    setEditingCategory(null);
    setParentSearch('');
    const initialParentIds = parentId ? [parentId] : [];
    const parentTabs = parentId ? tabsOfParent(parentId) : null;
    setForm({
      ...EMPTY_FORM,
      ...(parentTabs ? tabFields(parentTabs) : {}),
      parentId,
      parentIds: initialParentIds,
      sortOrder: categories.length,
    });
    setModalOpen(true);
  };

  const toggleParentCategory = (pId) => {
    setForm((prev) => {
      const current = prev.parentIds || (prev.parentId ? [prev.parentId] : []);
      const exists = current.includes(pId);
      const nextParentIds = exists ? current.filter((id) => id !== pId) : [...current, pId];
      const nextParentId = nextParentIds[0] || '';

      let extra = {};
      if (!editingCategory && nextParentIds.length) {
        const combinedTabs = [...new Set(nextParentIds.flatMap((id) => tabsOfParent(id) || []))];
        if (combinedTabs.length) {
          extra = tabFields(combinedTabs);
        }
      }
      return {
        ...prev,
        parentIds: nextParentIds,
        parentId: nextParentId,
        ...extra,
      };
    });
  };

  const clearParentCategories = () => {
    setForm((prev) => ({
      ...prev,
      parentIds: [],
      parentId: '',
    }));
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setParentSearch('');
    const pIds = category.parentIds?.length
      ? category.parentIds
      : (category.parentId ? [category.parentId] : []);

    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: pIds[0] || '',
      parentIds: pIds,
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

  const toggleTab = (tabValue) => {
    setForm((prev) => {
      const currentTabs = prev.visibleTabs || [];
      const exists = currentTabs.includes(tabValue);
      const nextTabs = exists
        ? currentTabs.filter((t) => t !== tabValue)
        : [...currentTabs, tabValue];
      const finalTabs = nextTabs.length ? nextTabs : ['mithilakart'];

      const tabToFlowMap = {
        mithilakart: 'standard',
        mithilak: 'mithilak',
        quick_shop: 'quick_shop',
        groceries_fresh: 'fresh_grocery',
      };
      const flows = finalTabs.map((t) => tabToFlowMap[t]).filter(Boolean);

      return {
        ...prev,
        visibleTabs: finalTabs,
        commerceFlows: flows.length ? [...new Set(flows)] : ['standard'],
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
    const pIds = form.parentIds?.length
      ? form.parentIds
      : (form.parentId ? [form.parentId] : []);

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description,
      parentId: pIds[0] || null,
      parentIds: pIds,
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
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Category Manager</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-raleway">Manage platform hierarchy — changes reflect on user app immediately</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories/bulk-import"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50 transition-all"
          >
            <Upload size={14} />
            Bulk Import
          </Link>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} />
            New Category
          </button>
        </div>
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
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={tabFilter}
            onChange={(e) => setTabFilter(e.target.value)}
            className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm outline-none appearance-none"
            aria-label="Filter by marketplace tab"
          >
            <option value="all">All tabs</option>
            {VISIBLE_TABS.map((tab) => (
              <option key={tab.value} value={tab.value}>{tab.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-bold">Loading categories...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent / Level</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visible Marketplace Tabs</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredCategories.map((category, index) => (
                    <motion.tr
                      key={category.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ delay: index * 0.01 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3" style={{ paddingLeft: (category.depth || 0) * 28 }}>
                          {category.depth > 0 && <span className="text-slate-300 font-black">↳</span>}
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                            <img
                              src={category.imageUrl || category.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60'}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight font-montserrat leading-tight">{category.name}</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 font-roboto">/{category.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {category.parentNames?.length ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {category.parentNames.map((pName) => (
                              <span
                                key={pName}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-bold rounded-lg uppercase tracking-wider"
                              >
                                ↳ {pName}
                              </span>
                            ))}
                          </div>
                        ) : category.parentName ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-black rounded-lg uppercase tracking-wider">
                            Sub of {category.parentName}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-[8px] font-black rounded-lg uppercase tracking-wider">
                            Top Level
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {(category.visibleTabs?.length ? category.visibleTabs : category.commerceFlows || ['mithilakart']).map((tab) => {
                            const labelMap = {
                              mithilakart: 'Mithilakart',
                              mithilak: 'Mithilak',
                              quick_shop: 'Quick Shop',
                              groceries_fresh: 'Groceries & Fresh',
                              standard: 'Mithilakart',
                              fresh_grocery: 'Groceries & Fresh',
                            };
                            return (
                              <span key={tab} className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                                {labelMap[tab] || tab}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 ${
                            category.isActive !== false ? 'bg-green-500 text-white shadow-green-100' : 'bg-slate-400 text-white shadow-slate-100'
                          }`}
                        >
                          {category.isActive !== false ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(category.depth || 0) < 3 && (
                            <button
                              onClick={() => openCreate(category.id)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                            >
                              <Plus size={12} />
                              <span>+ Sub</span>
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(category)}
                            className="p-2 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(category)}
                            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
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
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Parent Categories (Department Selection)
                </label>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Select one or more parent categories using checkboxes (e.g. check both <b>Dairy Products</b> and <b>Drinks & Beverages</b> for Buttermilk). Leave all unchecked for a Top-Level category.
                </p>
              </div>
              {(form.parentIds?.length > 0 || form.parentId) && (
                <button
                  type="button"
                  onClick={clearParentCategories}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1 transition-colors"
                >
                  Clear Selection (Top-Level)
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2.5">
              {/* Search input for parent categories */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter parent categories..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100"
                />
                {parentSearch && (
                  <button
                    type="button"
                    onClick={() => setParentSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Selected parents summary chips */}
              {(() => {
                const selectedIds = form.parentIds?.length
                  ? form.parentIds
                  : (form.parentId ? [form.parentId] : []);
                if (selectedIds.length === 0) {
                  return (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <span>No parent selected &mdash; this will be created as a <b>Top-Level Category</b>.</span>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                      Selected ({selectedIds.length}):
                    </span>
                    {selectedIds.map((id) => {
                      const parentCat = categories.find((c) => c.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs"
                        >
                          {parentCat?.name || id}
                          <button
                            type="button"
                            onClick={() => toggleParentCategory(id)}
                            className="hover:bg-amber-600 rounded-full p-0.5 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Scrollable list of parent checkboxes */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border-t border-slate-100 pt-2">
                {filteredParentOptions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No categories matching "{parentSearch}"</p>
                ) : (
                  filteredParentOptions.map((parent) => {
                    const selectedIds = form.parentIds?.length
                      ? form.parentIds
                      : (form.parentId ? [form.parentId] : []);
                    const isChecked = selectedIds.includes(parent.id);
                    return (
                      <label
                        key={parent.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-bold'
                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleParentCategory(parent.id)}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                          <img
                            src={parent.imageUrl || parent.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60'}
                            alt={parent.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs block truncate">{parent.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">/{parent.slug}</span>
                        </div>
                        {isChecked && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            Selected
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Visible Marketplace Tabs (Storefronts) *</label>
            <p className="text-[11px] text-slate-500 mb-2 font-medium">
              Select which marketplace tabs this category will appear on for customers.
              {(form.parentIds?.length > 0 || form.parentId) && ' A subcategory only appears in tabs where its parent is also enabled.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {VISIBLE_TABS.map((tab) => {
                const isSelected = (form.visibleTabs || ['mithilakart']).includes(tab.value);
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => toggleTab(tab.value)}
                    className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-[1.02]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                );
              })}
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
              <div className="mt-3 relative group">
                <img
                  src={getImageUrl(form.imageUrl)}
                  alt="Category Preview"
                  onError={handleImageError}
                  className="h-28 w-full object-cover rounded-xl border border-slate-200 shadow-sm"
                />
              </div>
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
