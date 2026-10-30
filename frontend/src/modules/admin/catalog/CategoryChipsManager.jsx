import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { chipsApi, categoriesApi } from '../services/api';
import { extractList, mapChip, mapCategory } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { uploadCmsImage } from '../../../shared/services/uploadService';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { HEADER_CHIP_ICON_OPTIONS, getHeaderChipIcon } from '../../../shared/constants/headerChipIcons';

const COMMERCE_FLOWS = [
  { id: 'standard', label: 'Standard' },
  { id: 'quick_shop', label: 'Quick Shop' },
  { id: 'fresh_grocery', label: 'Fresh Grocery' },
  { id: 'mithilak', label: 'Mithilak' },
];

const EMPTY = { label: '', imageUrl: '', iconKey: '', categoryId: '', commerceFlow: 'standard', sortOrder: 0, isActive: true };

const CategoryChipsManager = () => {
  const [chips, setChips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFlow, setActiveFlow] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIconOptions = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    if (!q) return HEADER_CHIP_ICON_OPTIONS;
    return HEADER_CHIP_ICON_OPTIONS.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.key.includes(q) || opt.keywords?.some((k) => k.includes(q))
    );
  }, [iconSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    const [chipsRes, catsRes] = await Promise.all([chipsApi.getAll(), categoriesApi.getAll()]);
    if (chipsRes.error) toast.error(chipsRes.error);
    else setChips(extractList(chipsRes.data).map(mapChip));
    if (!catsRes.error) setCategories(extractList(catsRes.data).map(mapCategory));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flowChips = chips
    .filter((c) => (c.commerceFlow || 'standard') === activeFlow)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const openCreate = () => {
    setEditing(null);
    setIconSearch('');
    setForm({ ...EMPTY, commerceFlow: activeFlow, sortOrder: flowChips.length });
    setModalOpen(true);
  };

  const openEdit = (chip) => {
    setEditing(chip);
    setIconSearch('');
    setForm({
      label: chip.label,
      imageUrl: chip.imageUrl || '',
      iconKey: chip.iconKey || '',
      categoryId: chip.categoryId?._id || chip.categoryId || '',
      commerceFlow: chip.commerceFlow || activeFlow,
      sortOrder: chip.order ?? 0,
      isActive: chip.active !== false,
    });
    setModalOpen(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCmsImage(file);
      setForm((p) => ({ ...p, imageUrl: url }));
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error('Label is required');
      return;
    }
    setSaving(true);
    const payload = {
      label: form.label.trim(),
      imageUrl: form.imageUrl || null,
      iconKey: form.iconKey || null,
      categoryId: form.categoryId && String(form.categoryId).trim() !== '' ? String(form.categoryId).trim() : null,
      commerceFlow: form.commerceFlow,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: Boolean(form.isActive),
    };
    const result = editing
      ? await chipsApi.update(editing.id, payload)
      : await chipsApi.create(payload);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? 'Chip updated' : 'Chip created');
    setModalOpen(false);
    load();
  };

  const toggleActive = async (chip) => {
    const { error } = await chipsApi.update(chip.id, {
      label: chip.label,
      imageUrl: chip.imageUrl || null,
      categoryId: chip.categoryId || null,
      commerceFlow: chip.commerceFlow || 'standard',
      sortOrder: Number(chip.order) || 0,
      isActive: !chip.active,
    });
    if (error) toast.error(error);
    else load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await chipsApi.delete(deleteTarget.id);
    if (error) toast.error(error);
    else {
      toast.success('Chip deleted');
      setDeleteTarget(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">Category Chips</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Top navigation chips on user home</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={16} /> Add Chip
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {COMMERCE_FLOWS.map((flow) => (
          <button
            key={flow.id}
            onClick={() => setActiveFlow(flow.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeFlow === flow.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {flow.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="space-y-2">
          {flowChips.map((chip, index) => {
            const RowIcon = !chip.imageUrl ? getHeaderChipIcon(chip.iconKey) : null;
            return (
            <div key={chip.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-300 w-6">#{index + 1}</span>
              {chip.imageUrl ? (
                <img src={chip.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : RowIcon ? (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <RowIcon size={18} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">{chip.emoji}</div>
              )}
              <div className="flex-1">
                <p className="font-black text-sm">{chip.label}</p>
                <p className="text-[9px] text-slate-400 uppercase">{chip.active ? 'Visible' : 'Hidden'}</p>
              </div>
              <button onClick={() => toggleActive(chip)} className="p-2 rounded-lg bg-slate-50">{chip.active ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => openEdit(chip)} className="p-2 rounded-lg bg-slate-50"><Edit2 size={14} /></button>
              <button onClick={() => setDeleteTarget(chip)} className="p-2 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
            </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Chip' : 'Create Chip'}>
        <div className="space-y-4">
          <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Label e.g. Beauty" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none">
            <option value="">Link to category (optional)</option>
            {categories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.id || cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Icon/image URL" className="flex-1 border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
            <label className="flex items-center px-4 py-3 bg-slate-100 rounded-xl cursor-pointer">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                React Icon (used when no image URL is set)
              </label>
              {form.iconKey && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, iconKey: '' }))}
                  className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"
                >
                  <X size={11} /> Remove icon
                </button>
              )}
            </div>
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-3">
                {form.iconKey ? (
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm">
                    {(() => {
                      const SelectedIcon = getHeaderChipIcon(form.iconKey);
                      return SelectedIcon ? <SelectedIcon size={20} /> : null;
                    })()}
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-300 flex-shrink-0">
                    <Upload size={16} />
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Search icons e.g. fashion, grocery, phone..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredIconOptions.length === 0 ? (
                  <p className="col-span-6 text-xs text-slate-400 py-4 text-center">No icons matching "{iconSearch}"</p>
                ) : (
                  filteredIconOptions.map(({ key, label, Icon }) => {
                    const isSelected = form.iconKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={label}
                        onClick={() => setForm((p) => ({ ...p, iconKey: key }))}
                        className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white shadow-md scale-[1.03]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="Sort order" />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active
          </label>
          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} type="delete" message={`Delete chip "${deleteTarget?.label}"?`} />
    </div>
  );
};

export default CategoryChipsManager;
