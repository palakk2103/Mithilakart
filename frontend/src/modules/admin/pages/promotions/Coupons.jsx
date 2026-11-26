import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Filter, MoreVertical, 
  Download, CheckCircle2, XCircle, Clock, 
  Trash2, Edit2, Percent, Tag, Calendar,
  ArrowUpRight, Users, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { couponsApi } from '../../services/api';
import { extractList, formatDate, titleCaseStatus } from '../../utils/mappers';

const mapAdminCoupon = (coupon = {}) => {
  const now = Date.now();
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null;
  let status = 'Active';
  if (!coupon.isActive) status = 'Paused';
  else if (expiresAt && expiresAt < now) status = 'Expiring';
  else if (expiresAt && expiresAt - now < 7 * 24 * 60 * 60 * 1000) status = 'Expiring';

  return {
    id: coupon._id || coupon.id,
    code: coupon.code || '—',
    type: titleCaseStatus(coupon.type || 'percent'),
    value: coupon.type === 'percentage' || coupon.type === 'percent'
      ? `${coupon.value}%`
      : `₹${Number(coupon.value || 0).toLocaleString('en-IN')}`,
    minOrder: coupon.minOrderAmount ? `₹${Number(coupon.minOrderAmount).toLocaleString('en-IN')}` : '₹0',
    expiry: formatDate(coupon.expiresAt),
    usage: coupon.usageCount ?? 0,
    status,
    raw: coupon,
  };
};

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  perUserLimit: '1',
  usageLimit: '',
  expiresAt: '',
  isActive: true,
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCoupons = async () => {
    setLoading(true);
    const { data, error } = await couponsApi.getAll({ limit: 50 });
    if (!error) {
      setCoupons(extractList(data).map(mapAdminCoupon));
    } else {
      setCoupons([]);
      toast.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsAdding(true);
  };

  const openEdit = (coupon) => {
    const r = coupon.raw || {};
    setEditingId(coupon.id);
    setForm({
      code: r.code || '',
      description: r.description || '',
      type: r.type === 'fixed' || r.type === 'flat' ? 'fixed' : 'percent',
      value: r.value != null ? String(r.value) : '',
      minOrderAmount: r.minOrderAmount != null ? String(r.minOrderAmount) : '',
      maxDiscount: r.maxDiscount != null ? String(r.maxDiscount) : '',
      perUserLimit: r.perUserLimit != null ? String(r.perUserLimit) : '1',
      usageLimit: r.usageLimit != null ? String(r.usageLimit) : '',
      expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString().slice(0, 10) : '',
      isActive: r.isActive !== false,
    });
    setIsAdding(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    if (!code) { toast.error('Coupon code is required'); return; }
    if (!Number.isFinite(value) || value <= 0) { toast.error('Enter a valid discount value'); return; }
    if (form.type === 'percent' && value > 100) { toast.error('Percentage cannot exceed 100%'); return; }

    const payload = {
      code,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      type: form.type,
      value,
      ...(form.minOrderAmount !== '' ? { minOrderAmount: Math.max(0, Number(form.minOrderAmount)) } : {}),
      ...(form.maxDiscount !== '' ? { maxDiscount: Math.max(0, Number(form.maxDiscount)) } : {}),
      ...(form.perUserLimit !== '' ? { perUserLimit: Math.max(1, Math.round(Number(form.perUserLimit))) } : {}),
      ...(form.usageLimit !== '' ? { usageLimit: Math.max(1, Math.round(Number(form.usageLimit))) } : {}),
      ...(form.expiresAt ? { expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString() } : {}),
      isActive: form.isActive,
    };

    setSaving(true);
    const { error } = editingId
      ? await couponsApi.update(editingId, payload)
      : await couponsApi.create(payload);
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success(editingId ? 'Coupon updated' : 'Coupon created');
    setIsAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    loadCoupons();
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    const { error } = await couponsApi.delete(coupon.id);
    if (error) { toast.error(error); return; }
    toast.success('Coupon deleted');
    loadCoupons();
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      'Active': 'bg-green-50 text-green-600 border-green-100',
      'Expiring': 'bg-amber-50 text-amber-600 border-amber-100',
      'Paused': 'bg-slate-50 text-slate-400 border-slate-100',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Coupon Manager</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Create and manage promotional discounts and marketing offers.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={openCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', value: String(coupons.length), icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Coupons', value: String(coupons.filter((c) => c.status === 'Active').length), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Total Redeemed', value: String(coupons.reduce((s, c) => s + (c.usage || 0), 0)), icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Paused / Expiring', value: String(coupons.filter((c) => c.status !== 'Active').length), icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-roboto leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table & Filters */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search by coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="px-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Coupon Info</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Min. Order</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">Loading coupons...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No coupons found</p>
                    <p className="text-xs text-slate-400 mt-2">Create a coupon to start offering discounts.</p>
                  </td>
                </tr>
              ) : coupons.filter((coupon) => !searchQuery || coupon.code.toLowerCase().includes(searchQuery.toLowerCase())).map((coupon) => (
                <tr key={coupon.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-black shadow-inner">
                          <Tag size={18} />
                       </div>
                       <div>
                          <p className="font-black text-slate-900 font-montserrat leading-tight uppercase tracking-widest">{coupon.code}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{coupon.type}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-blue-600 font-roboto text-base">{coupon.value}</td>
                  <td className="px-6 py-5 font-bold text-slate-700">{coupon.minOrder}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                      <Calendar size={12} className="text-slate-300" />
                      {coupon.expiry}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-100">
                      {coupon.usage.toLocaleString()} Times
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={coupon.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(coupon)} aria-label="Edit coupon" className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all cursor-pointer">
                        <Edit2 size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(coupon)} aria-label="Delete coupon" className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Coupon Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.form
              onSubmit={handleSave}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-white h-full rounded-[32px] shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 font-montserrat uppercase">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                <button type="button" onClick={() => setIsAdding(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-10">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Coupon Code *</label>
                  <input required type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER2026" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-black focus:ring-4 focus:ring-blue-50 transition-all outline-none uppercase" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Description (Optional)</label>
                  <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Flat ₹100 off on ₹499+" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-semibold outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Discount Type</label>
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-4 focus:ring-blue-50 outline-none">
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Value *</label>
                    <input required min="1" step="any" type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-black outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Min. Order (₹)</label>
                    <input min="0" type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Max Discount (₹)</label>
                    <input min="0" type="number" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="Optional" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Limit per User</label>
                    <input min="1" type="number" value={form.perUserLimit} onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))} placeholder="1" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Usage Limit</label>
                    <input min="1" type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Expiry Date (Optional)</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                </div>

                <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 pt-1 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
                  Active (visible &amp; usable)
                </label>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Coupon'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
