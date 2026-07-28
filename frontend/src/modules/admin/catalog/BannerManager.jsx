import React, { useState, useEffect, useCallback } from 'react';
import { bannersApi } from '../services/api';
import { extractList } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { uploadCmsImage } from '../../../shared/services/uploadService';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const COMMERCE_FLOWS = [
  { id: 'standard', label: 'Standard Home' },
  { id: 'quick_shop', label: 'Quick Shop' },
  { id: 'fresh_grocery', label: 'Fresh Grocery' },
  { id: 'mithilak', label: 'Mithilak' },
];

const EMPTY = {
  title: '',
  imageUrl: '',
  linkUrl: '/vendor/home',
  commerceFlow: 'standard',
  sortOrder: 0,
  isActive: true,
};

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [activeFlow, setActiveFlow] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await bannersApi.getAll();
    if (error) {
      toast.error(error);
      setBanners([]);
    } else {
      setBanners(extractList(data));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  const flowBanners = banners
    .filter((b) => (b.commerceFlow || 'standard') === activeFlow)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, commerceFlow: activeFlow, sortOrder: flowBanners.length });
    setModalOpen(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '/vendor/home',
      commerceFlow: banner.commerceFlow || activeFlow,
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive !== false,
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
      toast.success('Banner image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error('Title and image are required');
      return;
    }
    setSaving(true);
    const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
    const result = editing
      ? await bannersApi.update(editing._id || editing.id, payload)
      : await bannersApi.create(payload);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? 'Banner updated' : 'Banner created');
    setModalOpen(false);
    loadBanners();
  };

  const toggleActive = async (banner) => {
    const id = banner._id || banner.id;
    const { error } = await bannersApi.update(id, { isActive: banner.isActive === false });
    if (error) toast.error(error);
    else loadBanners();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await bannersApi.delete(deleteTarget._id || deleteTarget.id);
    if (error) toast.error(error);
    else {
      toast.success('Banner deleted');
      setDeleteTarget(null);
      loadBanners();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Banner Manager</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Home screen carousels — live after save</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
          <Plus size={14} /> Add Banner
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {COMMERCE_FLOWS.map((flow) => (
          <button
            key={flow.id}
            onClick={() => setActiveFlow(flow.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              activeFlow === flow.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {flow.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flowBanners.map((banner) => (
            <div key={banner._id || banner.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-32 bg-slate-100">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleActive(banner)}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg ${banner.isActive !== false ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'}`}
                >
                  {banner.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-black text-sm text-slate-900">{banner.title}</h3>
                <p className="text-[10px] text-slate-400 truncate">{banner.linkUrl || '—'}</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(banner)} className="flex-1 py-2 bg-slate-50 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(banner)} className="p-2 bg-red-50 text-red-500 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {flowBanners.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm font-bold">No banners for this flow yet</div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Banner' : 'Create Banner'} size="lg">
        <div className="space-y-4">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Banner title" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} placeholder="Link URL e.g. /vendor/home" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <div className="flex gap-2">
            <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Image URL" className="flex-1 border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
            <label className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-xl cursor-pointer">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          {form.imageUrl && <img src={form.imageUrl} alt="" className="h-24 w-full object-cover rounded-xl" />}
          <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort order" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            Active
          </label>
          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Banner'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} type="delete" message="Delete this banner?" />
    </div>
  );
};

export default BannerManager;
