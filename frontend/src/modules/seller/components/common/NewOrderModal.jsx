import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, ShoppingBag, MapPin, Phone, User, Clock, X, AlertTriangle } from 'lucide-react';
import { updateOrderStatus, getOrder } from '../../services/sellerApi';
import { getTokens } from '../../../../shared/api/tokenStorage';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

// Web Audio API chime sound generator
const playAlertBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {
    // ignore audio restriction errors
  }
};

const NewOrderModal = () => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { accessToken } = getTokens('seller');
    if (!accessToken) return undefined;

    const streamUrl = `/api/v1/seller/stream?token=${encodeURIComponent(accessToken)}`;
    let eventSource = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = async (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.type === 'new_order') {
            playAlertBeep();
            if (data.order) {
              setActiveOrder(data.order);
            } else if (data.orderId) {
              try {
                const fullOrder = await getOrder(data.orderId);
                setActiveOrder(fullOrder);
              } catch {
                setActiveOrder({
                  id: data.orderId,
                  orderNumber: data.orderNumber || `#${data.orderId.slice(-6)}`,
                });
              }
            }
          }
        } catch (err) {
          console.error('Error parsing seller SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (err) {
      console.warn('EventSource failed to initialize:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleAction = async (status) => {
    if (!activeOrder?.id && !activeOrder?._id) return;
    const orderId = activeOrder.id || activeOrder._id;
    setLoading(true);

    try {
      await updateOrderStatus(orderId, status);
      if (status === 'confirmed') {
        toast.success(`Order ${activeOrder.orderNumber || ''} accepted!`);
      } else {
        toast.info(`Order ${activeOrder.orderNumber || ''} rejected`);
      }
      setActiveOrder(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  if (!activeOrder) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-5 text-white relative">
            <button
              onClick={() => setActiveOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-bounce">
                <Bell size={22} className="text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                  🚨 New Order Alert
                </span>
                <h2 className="text-xl font-bold font-montserrat mt-1">
                  Order #{activeOrder.orderNumber || activeOrder.id?.slice(-6)}
                </h2>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Customer Details */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <User size={16} className="text-blue-500" />
                <span>{activeOrder.customerName || 'Customer'}</span>
                {activeOrder.customerPhone && (
                  <span className="text-xs text-gray-500 font-normal flex items-center gap-1 ml-auto">
                    <Phone size={12} /> {activeOrder.customerPhone}
                  </span>
                )}
              </div>
              {activeOrder.address && (
                <p className="text-xs text-gray-500 flex items-start gap-2 pt-1 border-t border-gray-100">
                  <MapPin size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{activeOrder.address}</span>
                </p>
              )}
            </div>

            {/* Items List */}
            {Array.isArray(activeOrder.items) && activeOrder.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Items</p>
                <div className="space-y-2">
                  {activeOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <ShoppingBag size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatCurrency((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Metadata */}
            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div>
                <span className="text-[11px] font-medium text-gray-500">Total Amount</span>
                <p className="text-xl font-extrabold text-blue-600 font-montserrat">
                  {formatCurrency(activeOrder.total || 0)}
                </p>
              </div>
              <div className="flex gap-2">
                {activeOrder.paymentMethod && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700">
                    {activeOrder.paymentMethod}
                  </span>
                )}
                {activeOrder.commerceFlow && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500 text-white">
                    {activeOrder.commerceFlow.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => handleAction('confirmed')}
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60 text-sm"
            >
              <CheckCircle size={18} />
              <span>{loading ? 'Updating...' : 'Accept Order'}</span>
            </button>

            <button
              onClick={() => handleAction('cancelled')}
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60 text-sm"
            >
              <XCircle size={18} />
              <span>Reject Order</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewOrderModal;
