import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { financeApi, settingsApi } from '../services/api';
import { extractList, mapCommissionRule } from '../utils/mappers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const CommissionRules = () => {
  const [rules, setRules] = useState([]);
  const [baseRate, setBaseRate] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', rate: 10, isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [rulesRes, settingsRes] = await Promise.all([
      financeApi.getCommissionRules(),
      settingsApi.getAll(),
    ]);
    if (!rulesRes.error) setRules(extractList(rulesRes.data).map(mapCommissionRule).filter((r) => !r.isDefault));
    if (!settingsRes.error && settingsRes.data?.commission?.rate != null) {
      setBaseRate(Math.round(settingsRes.data.commission.rate * 100));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveBaseRate = async () => {
    const { error } = await settingsApi.updateCommission({ rate: Number(baseRate) / 100 });
    if (error) toast.error(error);
    else toast.success('Global commission rate updated');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', rate: 10, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setEditing(rule);
    setForm({
      name: rule.category || rule.name || '',
      rate: parseFloat(String(rule.rate).replace('%', '')) || 10,
      isActive: rule.status === 'Active',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Rule name is required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      rate: Number(form.rate) / 100,
      isActive: form.isActive,
      isDefault: false,
    };
    const result = editing
      ? await financeApi.updateCommissionRule(editing.id, payload)
      : await financeApi.createCommissionRule(payload);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? 'Rule updated' : 'Rule created');
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await financeApi.deleteCommissionRule(deleteTarget.id);
    if (error) toast.error(error);
    else {
      toast.success('Rule deleted');
      setDeleteTarget(null);
      load();
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Commission Policy</h1>
          <p className="text-slate-500 text-[11px] mt-1">Category-specific rules override the global base rate</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase">
          <Plus size={14} /> Create Rule
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Global Base Rate</p>
          <p className="text-lg font-black mt-1">Applied when no category rule matches</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            className="w-20 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-black text-center outline-none"
          />
          <span className="text-sm font-black">%</span>
          <button onClick={saveBaseRate} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase">Update Base</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {rules.map((rule, i) => (
              <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-[13px] font-black uppercase">{rule.category || rule.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(rule)} className="p-1.5 bg-slate-50 rounded-lg"><Edit2 size={12} /></button>
                    <button onClick={() => setDeleteTarget(rule)} className="p-1.5 bg-red-50 text-red-500 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                </div>
                <p className="text-xl font-black text-blue-600">{rule.rate}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{rule.status}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rule' : 'Create Rule'}>
        <div className="space-y-4">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Rule name / category" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <input type="number" min="0" max="100" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} placeholder="Rate %" className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none" />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active
          </label>
          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Rule
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} type="delete" message="Delete this commission rule?" />
    </div>
  );
};

export default CommissionRules;
