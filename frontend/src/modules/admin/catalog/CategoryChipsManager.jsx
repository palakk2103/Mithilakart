import React, { useState, useEffect, useCallback } from 'react';
import { chipsApi, categoriesApi } from '../services/api';
import { extractList, mapChip } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { uploadCmsImage } from '../../../shared/services/uploadService';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const COMMERCE_FLOWS = [
  { id: 'standard', label: 'Standard' },
  { id: 'quick_shop', label: 'Quick Shop' },
  { id: 'fresh_grocery', label: 'Fresh Grocery' },
  { id: 'mithilak', label: 'Mithilak' },
];

const EMPTY = { label: '', imageUrl: '', categoryId: '', commerceFlow: 'standard', sortOrder: 0, isActive: true };

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

  const load = useCallback(async () => {
    setLoading(true);
    const [chipsRes, catsRes] = await Promise.all([chipsApi.getAll(), categoriesApi.getAll()]);
    if (chipsRes.error) toast.error(chipsRes.error);
    else setChips(extractList(chipsRes.data).map(mapChip));
    if (!catsRes.error) setCategories(extractList(catsRes.data));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flowChips = chips
    .filter((c) => (c.commerceFlow || 'standard') === activeFlow)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, commerceFlow: activeFlow, sortOrder: flowChips.length });
    setModalOpen(true);
  };

  const openEdit = (chip) => {
    setEditing(chip);
    setForm({
      label: chip.label,
      imageUrl: chip.imageUrl || '',
      categoryId: chip.categoryId || '',
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
      categoryId: form.categoryId || null,
      commerceFlow: form.commerceFlow,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
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
    const { error } = await chipsApi.update(chip.id, { isActive: !chip.active });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">Category Chips</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Top navigation chips on user home</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase">
          <Plus size={14} /> Add Chip
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {COMMERCE_FLOWS.map((flow) => (
          <button key={flow.id} onClick={() => setActiveFlow(flow.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${activeFlow === flow.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'}`}>
            {flow.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="space-y-2">
          {flowChips.map((chip, index) => (
            <div key={chip.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-300 w-6">#{index + 1}</span>
              {chip.imageUrl ? (
                <img src={chip.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
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
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Chip' : 'Create Chip'}>
        <div className="space-y-4">
          <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Label e.g. Beauty" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none">
            <option value="">Link to category (optional)</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Icon/image URL" className="flex-1 border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
            <label className="flex items-center px-4 py-3 bg-slate-100 rounded-xl cursor-pointer">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
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
