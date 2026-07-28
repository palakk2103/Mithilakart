import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../../services/api';
import { extractList, mapTaxSlab } from '../../utils/mappers';
import { Plus, Edit2, Trash2, Loader2, Save } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const EMPTY = { name: '', rate: 18, region: 'IN', isActive: true };

const TaxConfig = () => {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await financeApi.getTaxConfigs();
    if (error) toast.error(error);
    else setSlabs(extractList(data).map(mapTaxSlab));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (slab) => {
    setEditing(slab);
    setForm({
      name: slab.category,
      rate: parseFloat(String(slab.gst).replace('%', '')) || 0,
      region: slab.region || 'IN',
      isActive: slab.status === 'Active',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Tax name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      rate: Number(form.rate) / 100,
      region: form.region || 'IN',
      isActive: form.isActive,
    };
    const result = editing
      ? await financeApi.updateTaxConfig(editing.id, payload)
      : await financeApi.createTaxConfig(payload);
    if (result.error) toast.error(result.error);
    else {
      toast.success(editing ? 'Tax slab updated' : 'Tax slab created');
      setModalOpen(false);
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await financeApi.deleteTaxConfig(deleteTarget.id);
    if (error) toast.error(error);
    else {
      toast.success('Tax slab deleted');
      setDeleteTarget(null);
      load();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 uppercase">Tax & Compliance</h1>
          <p className="text-slate-500 text-sm mt-1">GST slabs applied at order pricing</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase">
          <Plus size={16} /> Add Tax Slab
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">GST Rate</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {slabs.map((slab) => (
                <tr key={slab.id}>
                  <td className="px-6 py-5 font-bold">{slab.category}</td>
                  <td className="px-6 py-5 font-black text-blue-600">{slab.gst}</td>
                  <td className="px-6 py-5">{slab.region || 'IN'}</td>
                  <td className="px-6 py-5"><span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase">{slab.status}</span></td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => openEdit(slab)} className="p-2 text-slate-300 hover:text-blue-500"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteTarget(slab)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {slabs.length === 0 && <p className="p-8 text-center text-slate-400 text-sm font-bold">No tax slabs configured</p>}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Tax Slab' : 'Add Tax Slab'}>
        <div className="space-y-4">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name e.g. Standard GST" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input type="number" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} placeholder="Rate %" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} placeholder="Region" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
            <Save size={14} /> Save Slab
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} type="delete" message="Delete this tax slab?" />
    </div>
  );
};

export default TaxConfig;
