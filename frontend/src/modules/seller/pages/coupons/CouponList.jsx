/**
 * Coupon Management Page (List + Create inline)
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Plus, Ticket, Edit3, Trash2, Calendar, Percent, DollarSign, X } from 'lucide-react';
import { PageHeader, ConfirmModal, StatusBadge } from '../../components/common';
import { Card, Button, Badge } from '../../components/ui';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/sellerApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const CouponList = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, coupon: null });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCoupons();
      setCoupons(data?.coupons || []);
    } catch (err) {
      setError(err?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onCreateCoupon = async (data) => {
    try {
      await createCoupon({
        ...data,
        code: data.code?.toUpperCase(),
        value: Number(data.value),
        minOrder: data.minOrder ? Number(data.minOrder) : 0,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : 0,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : 100,
      });
      toast.success(`Coupon "${data.code}" created successfully!`);
      setShowCreateForm(false);
      reset();
      fetchCoupons();
    } catch (err) {
      toast.error(err?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCoupon(deleteModal.coupon?.id);
      toast.success('Coupon deleted');
      setDeleteModal({ open: false, coupon: null });
      fetchCoupons();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete coupon');
    }
  };

  const inputClass = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all";

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Coupons" subtitle={`${coupons.length} coupons created`}>
        <Button icon={showCreateForm ? X : Plus} variant={showCreateForm ? 'secondary' : 'primary'}
                onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Coupon'}
        </Button>
      </PageHeader>

      {/* Create Coupon Form */}
      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card title="Create New Coupon">
            <form onSubmit={handleSubmit(onCreateCoupon)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input {...register('code', { required: 'Code is required' })} placeholder="SALE50" className={inputClass} style={{ textTransform: 'uppercase' }} />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select {...register('type', { required: true })} className={inputClass}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                <input type="number" {...register('value', { required: 'Value is required', min: 1 })} placeholder="50" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                <input type="number" {...register('minOrder')} placeholder="500" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                <input type="number" {...register('maxDiscount')} placeholder="200" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                <input type="date" {...register('expiryDate', { required: true })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input type="number" {...register('usageLimit')} placeholder="100" className={inputClass} />
              </div>
              <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                <Button type="submit" icon={Plus} fullWidth>Create Coupon</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Coupon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((coupon, i) => (
          <motion.div key={coupon.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hover className="relative overflow-hidden">
              {/* Decorative stripe */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${coupon.status === 'active' ? 'bg-[#2563EB]' : 'bg-gray-300'}`} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${coupon.type === 'percentage' ? 'bg-purple-50' : 'bg-green-50'}`}>
                    {coupon.type === 'percentage' ? <Percent size={20} className="text-purple-600" /> : <DollarSign size={20} className="text-green-600" />}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">{coupon.code}</p>
                    <p className="text-xs text-gray-400">{coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}</p>
                  </div>
                </div>
                <StatusBadge status={coupon.status} size="sm" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Min Order</span><span className="text-gray-700 font-medium">{formatCurrency(coupon.minOrder || 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Max Discount</span><span className="text-gray-700 font-medium">{formatCurrency(coupon.maxDiscount || 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Usage</span><span className="text-gray-700 font-medium">{coupon.usageCount || 0}/{coupon.usageLimit || 0}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-1"><Calendar size={12} /> Expires</span>
                  <span className="text-gray-700 font-medium">{formatDate(coupon.expiryDate)}</span>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${coupon.usageLimit ? ((coupon.usageCount || 0) / coupon.usageLimit) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <Button size="xs" variant="ghost" icon={Edit3} onClick={() => toast.success('Edit coupon')}>Edit</Button>
                <Button size="xs" variant="ghost" icon={Trash2} className="text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteModal({ open: true, coupon })}>Delete</Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, coupon: null })}
        onConfirm={handleDelete}
        type="delete" title="Delete Coupon"
        message={`Delete coupon "${deleteModal.coupon?.code}"? This cannot be undone.`}
        confirmLabel="Delete Coupon"
      />
    </div>
  );
};

export default CouponList;
