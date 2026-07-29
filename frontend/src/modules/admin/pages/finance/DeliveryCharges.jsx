import React, { useState, useEffect, useCallback } from 'react';
import { financeApi, settingsApi } from '../../services/api';
import { extractList, mapDeliveryZone } from '../../utils/mappers';
import { Plus, Trash2, Edit2, MapPin, Loader2, Save } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const EMPTY = { name: '', baseCharge: 39, freeAbove: 500, pincodePrefix: '', isActive: true };

const DeliveryCharges = () => {
  const [zones, setZones] = useState([]);
  const [surcharges, setSurcharges] = useState({ codHandlingFee: 0, expressSurcharge: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [zonesRes, settingsRes] = await Promise.all([
      financeApi.getDeliveryCharges(),
      settingsApi.getAll(),
    ]);
    if (!zonesRes.error) setZones(extractList(zonesRes.data).map(mapDeliveryZone));
    if (!settingsRes.error) {
      const s = settingsRes.data?.settings || {};
      setSurcharges({
        codHandlingFee: s.codHandlingFee ?? 0,
        expressSurcharge: s.expressSurcharge ?? 0,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (zone) => {
    setEditing(zone);
    setForm({
      name: zone.name,
      baseCharge: parseFloat(String(zone.baseFee).replace(/[^\d.]/g, '')) || 0,
      freeAbove: parseFloat(String(zone.freeAbove).replace(/[^\d.]/g, '')) || 0,
      pincodePrefix: zone.pincodePrefix || zone.area?.replace('Pin: ', '') || '',
      isActive: zone.status !== 'Inactive',
    });
    setModalOpen(true);
  };

  const handleSaveZone = async () => {
    if (!form.name.trim()) {
      toast.error('Zone name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      baseCharge: Number(form.baseCharge) || 0,
      freeAbove: Number(form.freeAbove) || 0,
      pincodePrefix: form.pincodePrefix || null,
      isActive: form.isActive,
    };
    const result = editing
      ? await financeApi.updateDeliveryCharge(editing.id, payload)
      : await financeApi.createDeliveryCharge(payload);
    if (result.error) toast.error(result.error);
    else {
      toast.success(editing ? 'Zone updated' : 'Zone created');
      setModalOpen(false);
      load();
    }
  };

  const saveSurcharges = async () => {
    const { error } = await settingsApi.update({
      codHandlingFee: Number(surcharges.codHandlingFee) || 0,
      expressSurcharge: Number(surcharges.expressSurcharge) || 0,
    });
    if (error) toast.error(error);
    else toast.success('Surcharges saved');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await financeApi.deleteDeliveryCharge(deleteTarget.id);
    if (error) toast.error(error);
    else {
      toast.success('Zone deleted');
      setDeleteTarget(null);
      load();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 uppercase">Logistics Pricing</h1>
          <p className="text-slate-500 text-sm mt-1">Zone-based delivery fees — used at checkout immediately</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase">
          <Plus size={16} /> Add Zone
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50">
            {zones.map((zone) => (
              <div key={zone.id} className="p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><MapPin size={24} /></div>
                  <div>
                    <h4 className="font-black uppercase">{zone.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase mt-1">{zone.area}</p>
                    <p className="text-xs mt-2">Base: {zone.baseFee} · Free above: {zone.freeAbove}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(zone)} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteTarget(zone)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {zones.length === 0 && <p className="p-8 text-center text-slate-400 text-sm font-bold">No delivery zones configured</p>}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Additional Surcharges</h3>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">COD Handling Fee (₹)</label>
              <input type="number" value={surcharges.codHandlingFee} onChange={(e) => setSurcharges((p) => ({ ...p, codHandlingFee: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Express Surcharge (₹)</label>
              <input type="number" value={surcharges.expressSurcharge} onChange={(e) => setSurcharges((p) => ({ ...p, expressSurcharge: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <button onClick={saveSurcharges} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
              <Save size={14} /> Save Surcharges
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Zone' : 'Add Zone'}>
        <div className="space-y-4">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Zone name" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input value={form.pincodePrefix} onChange={(e) => setForm((p) => ({ ...p, pincodePrefix: e.target.value }))} placeholder="Pincode prefix (optional)" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input type="number" value={form.baseCharge} onChange={(e) => setForm((p) => ({ ...p, baseCharge: e.target.value }))} placeholder="Base charge ₹" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input type="number" value={form.freeAbove} onChange={(e) => setForm((p) => ({ ...p, freeAbove: e.target.value }))} placeholder="Free above ₹" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <button onClick={handleSaveZone} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase">Save Zone</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} type="delete" message="Delete this delivery zone?" />
    </div>
  );
};

export default DeliveryCharges;
