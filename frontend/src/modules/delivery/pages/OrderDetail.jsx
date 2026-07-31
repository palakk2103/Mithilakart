import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, CheckCircle2, Navigation, 
  ShieldCheck, ArrowRight, Camera, Trash2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getOrderById, getOrders, markPickup, markDelivered } from '../services/deliveryApi';
import useDeliveryLocationShare from '../hooks/useDeliveryLocationShare';

const STATUS_STEPS = [
  { key: 'accepted', label: 'Accepted', desc: 'Head to vendor' },
  { key: 'at_pickup', label: 'Pickup', desc: 'Collect package' },
  { key: 'in_transit', label: 'Transit', desc: 'On the way' },
  { key: 'delivered', label: 'Done', desc: 'Delivered' },
];

const formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
};

const mapAssignmentStatus = (status) => {
  if (status === 'picked_up') return 'in_transit';
  if (status === 'delivered') return 'delivered';
  if (status === 'assigned') return 'accepted';
  return 'accepted';
};

const mapApiOrder = (data = {}) => {
  const order = data.order || data.orderId || data;
  const assignment = data.assignment || data;
  const shipping = order.addressSnapshot || order.shippingAddress || data.shippingAddress || {};
  const pickup = order.pickupAddress || data.pickupAddress || {};

  return {
    id: order.id || order._id || assignment.orderId || data._id,
    customer: shipping.name || order.customerName || data.customerName || 'Customer',
    phone: shipping.phone || order.customerPhone || data.phone || '',
    address: formatAddress(shipping) || data.address || '—',
    lat: shipping.lat || data.lat,
    lng: shipping.lng || data.lng,
    pickupAddress: typeof pickup === 'string' ? pickup : formatAddress(pickup) || data.pickupAddress || 'Vendor location',
    pickupLat: pickup.lat || data.pickupLat,
    pickupLng: pickup.lng || data.pickupLng,
    items: order.itemCount || data.items || 1,
    earning: assignment.earningAmount ?? data.earningAmount ?? data.earning ?? 0,
    status: mapAssignmentStatus(assignment.status || data.status),
  };
};

const DeliveryOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('accepted');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const shareLocation = ['accepted', 'at_pickup', 'in_transit'].includes(currentStatus);
  useDeliveryLocationShare(shareLocation && !delivered);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        let data = null;
        try {
          data = await getOrderById(orderId);
        } catch {
          const list = await getOrders();
          const all = [...(list?.available || []), ...(list?.assigned || [])];
          const match = all.find((a) => String(a.orderId?._id || a.orderId || a._id) === String(orderId));
          data = match || null;
        }
        if (!data) throw new Error('Order not found');
        const mapped = mapApiOrder(data);
        setOrder(mapped);
        setCurrentStatus(mapped.status === 'delivered' ? 'delivered' : mapped.status);
        setDelivered(mapped.status === 'delivered');
      } catch (err) {
        toast.error(err?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) loadOrder();
  }, [orderId]);

  const statusIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);

  const handleNextStep = async () => {
    if (statusIndex === 0) {
      setCurrentStatus('at_pickup');
      return;
    }
    if (statusIndex === 1) {
      setActionLoading(true);
      try {
        const pickupOtp = sessionStorage.getItem(`delivery_pickup_otp_${order.id}`) || '0000';
        const pickupResult = await markPickup(order.id, pickupOtp);
        const otpCode = pickupResult?.deliveryOtp || pickupResult?.data?.deliveryOtp;
        if (otpCode) {
          sessionStorage.setItem(`delivery_customer_otp_hint_${order.id}`, String(otpCode));
          toast.success(`Package Picked Up! Delivery OTP: ${otpCode}`, { duration: 12000 });
        } else {
          toast.success('Package Picked Up! Proceeding to customer.');
        }
        setCurrentStatus('in_transit');
      } catch (err) {
        toast.error(err?.message || 'Failed to confirm pickup');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    setActionLoading(true);
    try {
      await markDelivered(order.id, otpInput);
      setOtpVerified(true);
      setTimeout(() => {
        handleMarkDelivered();
      }, 1500);
    } catch (err) {
      toast.error(err?.message || 'Incorrect OTP. Please check with customer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = () => {
    setCurrentStatus('delivered');
    setDelivered(true);
  };

  const getPrimaryButtonLabel = () => {
    if (statusIndex === 0) return 'Arrived at Pickup';
    if (statusIndex === 1) return 'Package Picked Up';
    if (statusIndex === 2) return 'Arrived at Customer';
    return 'Completed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <Package size={48} className="text-slate-300 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">We couldn't retrieve details for this delivery order.</p>
        <button
          onClick={() => navigate('/delivery/orders')}
          className="mt-6 px-6 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (delivered) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100 border-8 border-green-50">
            <CheckCircle2 size={56} className="text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">Delivery Successful!</h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Order #{order.id}</p>
        
        <div className="mt-8 p-5 bg-slate-900 rounded-2xl w-full">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earnings</p>
           <p className="text-3xl font-black text-white">₹{order.earning}.00</p>
        </div>

        <button onClick={() => navigate('/delivery/orders')}
          className="mt-8 w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-100 active:scale-95 transition-all">
          Finish Run
        </button>
      </div>
    );
  }

  return (
    <div className="pb-40 bg-[#f8fafc] min-h-screen">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-4 py-4 border-b border-slate-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-100 rounded-xl text-slate-700"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-sm font-black text-slate-900">Order #{order.id}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
             <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{currentStatus.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trip Status</h3>
             <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Step {statusIndex + 1}/4</span>
          </div>
          <div className="p-5 flex justify-between relative px-10">
            <div className="absolute top-[34px] left-12 right-12 h-0.5 bg-slate-100" />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(statusIndex / (STATUS_STEPS.length - 1)) * 100}%` }} className="absolute top-[34px] left-12 right-12 h-0.5 bg-blue-600 origin-left" />
            {STATUS_STEPS.map((step, i) => (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div animate={{ scale: step.key === currentStatus ? 1.2 : 1, backgroundColor: statusIndex >= i ? '#2563eb' : '#f1f5f9' }} className="w-5 h-5 rounded-full border-4 border-white shadow-sm" />
                <span className={`text-[8px] font-black uppercase ${statusIndex >= i ? 'text-blue-600' : 'text-slate-300'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white rounded-3xl border p-5 ${statusIndex < 2 ? 'border-blue-100 ring-4 ring-blue-50/50' : 'opacity-60'}`}>
          <div className="flex items-start justify-between mb-4">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Store</p><p className="text-base font-black text-slate-900">{order.storeName || order.sellerName || 'Seller Store'}</p></div>
            <button onClick={() => window.open(order.lat && order.lng ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`)} className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Navigation size={18} /></button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100"><MapPin size={14} className="text-blue-600" /><span className="truncate">{order.pickupAddress}</span></div>
        </div>

        <div className={`bg-white rounded-3xl border p-5 ${statusIndex >= 2 ? 'border-green-100 ring-4 ring-green-50/50' : 'opacity-60'}`}>
          <div className="flex items-start justify-between mb-4">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p><p className="text-base font-black text-slate-900">{order.customer}</p></div>
            <div className="flex gap-2">
              {order.phone && (
                <a href={`tel:${order.phone}`} className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><Phone size={18} /></a>
              )}
              <button onClick={() => window.open(order.pickupLat && order.pickupLng ? `https://www.google.com/maps/dir/?api=1&destination=${order.pickupLat},${order.pickupLng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickupAddress)}`)} className="w-10 h-10 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Navigation size={18} /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100"><MapPin size={14} className="text-green-600" /><span className="truncate">{order.address}</span></div>
        </div>

        <div id="otp-section" className={`bg-white rounded-3xl border p-6 transition-all ${statusIndex >= 2 ? 'border-amber-200 shadow-xl shadow-amber-50' : 'opacity-30 pointer-events-none'}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center"><ShieldCheck size={20} className="text-amber-600" /></div>
              <div><h3 className="text-sm font-black text-slate-900">Verify OTP</h3><p className="text-[10px] text-slate-400 font-bold uppercase">Final Step — Ask Customer</p></div>
            </div>
            {sessionStorage.getItem(`delivery_customer_otp_hint_${order.id}`) && (
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                OTP Hint: {sessionStorage.getItem(`delivery_customer_otp_hint_${order.id}`)}
              </span>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <input key={i} type="tel" maxLength={1} value={otpInput[i] || ''} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val) {
                  const newOtp = otpInput.split(''); newOtp[i] = val; setOtpInput(newOtp.join(''));
                  if (i < 3) e.target.nextSibling?.focus();
                } else {
                  const newOtp = otpInput.split(''); newOtp[i] = ''; setOtpInput(newOtp.join(''));
                  if (i > 0) e.target.previousSibling?.focus();
                }
              }} className="w-full aspect-square bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-black text-slate-900 focus:border-amber-400 outline-none" />
            ))}
          </div>
          <button onClick={handleVerifyOTP} disabled={otpInput.length < 4 || otpVerified || actionLoading} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest ${otpVerified ? 'bg-green-600 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-100 active:scale-95 transition-all'}`}>{otpVerified ? 'IDENTITY VERIFIED ✓' : 'VERIFY & COMPLETE'}</button>
        </div>

        <button onClick={() => setShowIssueModal(true)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-3xl">Report Issue</button>
      </div>

      {!delivered && (
        <div className="fixed bottom-6 left-6 right-6 z-50">
           <motion.button whileTap={{ scale: 0.95 }} onClick={handleNextStep} disabled={actionLoading || statusIndex >= 2} className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 ${statusIndex >= 2 ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-blue-600 text-white shadow-blue-200'}`}>
              {getPrimaryButtonLabel()} <ArrowRight size={18} />
           </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIssueModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full bg-white rounded-t-[40px] p-8 pb-12">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-black text-slate-900 mb-6">What happened?</h3>
              <div className="space-y-3">{['Store is closed', 'Customer unavailable', 'Vehicle breakdown', 'Other'].map(issue => (
                <button key={issue} onClick={() => setShowIssueModal(false)} className="w-full text-left p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">{issue}</button>
              ))}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryOrderDetail;
