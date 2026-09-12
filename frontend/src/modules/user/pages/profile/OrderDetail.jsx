import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, CheckCircle2, RotateCcw, X,
  Truck, Wallet, Download, MapPin, User, Phone, Package, Clock, ReceiptText, Gift,
  ShieldCheck, Copy, Check, MessageCircle, XCircle, Star, ShoppingBag, AlertTriangle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAccountStore from '../../../../store/useAccountStore';
import { parsePrice, formatPrice } from '../../../../shared/utils/priceFormatter';
import { getOrderById, getOrderTracking, createReturn, getGameEligibility, cancelOrder } from '../../services/ordersApi';
import { addCartItem } from '../../services/cartApi';
import { getMyReturns } from '../../services/userApi';
import { mapOrderDetail, getEntityId } from '../../utils/mappers';
import LiveDeliveryMap from '../../../../shared/components/LiveDeliveryMap';
import useOrderSocket from '../../../../shared/hooks/useOrderSocket';
import DispatchDelayBanner from '../../../../shared/components/DispatchDelayBanner';
import FulfillmentStatus from '../../../../shared/components/FulfillmentStatus';
import { getDispatchSlaInfo } from '../../../../shared/utils/dispatchDelayUtils';
import CatchYourDeliveryGame from '../../components/common/CatchYourDeliveryGame';
import OrderInvoiceModal from '../../../../shared/components/OrderInvoiceModal';
import OrderRatingModal from '../../../../shared/components/OrderRatingModal';
import { soundEffects } from '../../../../shared/utils/soundEffects';

const STATUS_STEPS = [
  { key: 'pending', title: 'Checkout Started', desc: 'Payment pending.' },
  { key: 'placed', title: 'Order Placed', desc: 'Payment received — awaiting seller acceptance.' },
  { key: 'confirmed', title: 'Order Accepted', desc: 'Seller has accepted your order.' },
  { key: 'packed', title: 'Packed', desc: 'Your items are packed and ready.' },
  { key: 'shipped', title: 'Shipped', desc: 'Order picked up for delivery.' },
  { key: 'out_for_delivery', title: 'Out For Delivery', desc: 'Your package is on the way.' },
  { key: 'delivered', title: 'Delivered', desc: 'Your order has been delivered.' },
];

const COURIER_STATUS_STEPS = [
  { key: 'pending', title: 'Checkout Started', desc: 'Payment pending.' },
  { key: 'placed', title: 'Order Placed', desc: 'Payment confirmed — seller notified to prepare parcel.' },
  { key: 'confirmed', title: 'Order Accepted', desc: 'Seller accepted and started packing items.' },
  { key: 'packed', title: 'Packed & Labeled', desc: 'Package packed & shipping label with AWB generated.' },
  { key: 'shipped', title: 'Handed to Courier', desc: 'Parcel handed to national courier; transit initiated.' },
  { key: 'out_for_delivery', title: 'Out For Delivery', desc: 'Local courier hub dispatched rider for doorstep drop.' },
  { key: 'delivered', title: 'Delivered', desc: 'Package delivered safely to your address.' },
];

const formatTimelineDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
};

const buildTimeline = (tracking = [], currentStatus = 'pending', steps = STATUS_STEPS) => {
  const trackingByStatus = new Map(tracking.map((t) => [t.status, t]));
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);

  return steps.map((step, index) => {
    const entry = trackingByStatus.get(step.key);
    const active = currentStatus === 'cancelled' ? step.key === 'pending' : index <= Math.max(currentIdx, 0);
    return {
      title: step.title,
      date: formatTimelineDate(entry?.createdAt),
      desc: entry?.note || step.desc,
      active,
    };
  });
};

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const orders = useAccountStore((state) => state.orders);
  const [order, setOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [deliveryOtp, setDeliveryOtp] = useState(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ orderItemId: '', quantity: 1, reason: '' });
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [gameEligible, setGameEligible] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const loadOrder = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [detail, tracking, myReturns] = await Promise.all([
        getOrderById(orderId),
        getOrderTracking(orderId).catch(() => null),
        getMyReturns().catch(() => ({ items: [] })),
      ]);
      const mapped = mapOrderDetail({ ...detail, ...(tracking || {}) });
      setOrder(mapped);
      setTrackingData(tracking);
      const orderReturns = (myReturns?.items || []).filter(
        (r) => String(r.orderId) === String(mapped.mongoId) || String(r.orderId) === String(orderId)
      );
      setReturns(orderReturns);
      const otp = tracking?.deliveryOtp || tracking?.assignment?.deliveryOtp || mapped?.deliveryOtp || null;
      if (otp) setDeliveryOtp(otp);
    } catch {
      if (!isSilent) {
        const fallback = orders.find((o) => o.id === orderId) || null;
        setOrder(fallback);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orderId, orders]);

  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  // Resilient real-time polling fallback while order is in an active state
  useEffect(() => {
    const raw = order?.rawStatus || 'pending';
    const isActive = ['pending', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(raw);
    if (!isActive) return undefined;

    const timer = setInterval(() => {
      loadOrder(true);
    }, 4000);

    return () => clearInterval(timer);
  }, [order?.rawStatus, loadOrder]);

  // "Catch Your Delivery" — purely additive, never blocks the order page:
  // a failed/ineligible check just hides the entry point.
  useEffect(() => {
    let cancelled = false;
    if (!orderId) return undefined;

    getGameEligibility(orderId)
      .then((data) => {
        if (!cancelled) setGameEligible(Boolean(data?.eligible));
      })
      .catch(() => {
        if (!cancelled) setGameEligible(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const socketOrderId = order?.mongoId || orderId;

  const handleStatusUpdate = useCallback((payload) => {
    if (payload?.status) {
      setOrder((prev) => prev ? {
        ...prev,
        rawStatus: payload.status,
        status: payload.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      } : prev);
      if (payload.status === 'delivered') {
        soundEffects.playDeliveredFanfare();
      } else {
        soundEffects.playNotification();
      }
      loadOrder(true);
    }
  }, [loadOrder]);

  const handleLocationUpdate = useCallback((payload) => {
    if (payload?.lat == null || payload?.lng == null) return;
    setTrackingData((prev) => ({
      ...(prev || {}),
      partnerLocation: {
        lat: payload.lat,
        lng: payload.lng,
        updatedAt: payload.updatedAt,
      },
    }));
  }, []);

  const handleDeliveryOtp = useCallback((payload) => {
    if (payload?.otp) {
      setDeliveryOtp(payload.otp);
      soundEffects.playNotification();
      toast.success('Your Delivery OTP has arrived!', { icon: '🔐' });
    }
  }, []);

  useOrderSocket(socketOrderId, 'customer', {
    onStatusUpdate: handleStatusUpdate,
    onLocationUpdate: handleLocationUpdate,
    onDeliveryOtp: handleDeliveryOtp,
  });

  const handleCopyOtp = () => {
    if (!deliveryOtp) return;
    navigator.clipboard?.writeText?.(deliveryOtp);
    setCopiedOtp(true);
    toast.success('OTP copied to clipboard!');
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard?.writeText?.(awb);
    setCopiedAwb(true);
    toast.success('Courier AWB copied to clipboard!');
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const isCourierOrder = Boolean(
    order?.fulfilmentType === 'courier' ||
    order?.commerceFlow === 'standard' ||
    order?.commerceFlow === 'mithilak' ||
    trackingData?.fulfilmentType === 'courier'
  );

  const deliveryUpdates = useMemo(() => {
    const shipment = trackingData?.shipment || order?.shipment;
    if (isCourierOrder && shipment?.checkpoints?.length) {
      return [...shipment.checkpoints].reverse().map((cp, index, arr) => ({
        title: String(cp.status || 'Update').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        date: formatTimelineDate(cp.at),
        desc: cp.note || cp.location || '',
        active: index === arr.length - 1,
      }));
    }
    return buildTimeline(
      trackingData?.tracking || order?.tracking || [],
      order?.rawStatus || 'pending',
      isCourierOrder ? COURIER_STATUS_STEPS : STATUS_STEPS
    );
  }, [trackingData, order, isCourierOrder]);

  const destination = trackingData?.destination || (order?.address?.lat ? {
    lat: order.address.lat,
    lng: order.address.lng,
  } : null);

  const partnerLocation = trackingData?.partnerLocation || order?.partnerLocation;
  const showLiveMap = !isCourierOrder && (order?.fulfilmentType === 'local_delivery' || Boolean(partnerLocation));
  const canRequestReturn = order?.rawStatus === 'delivered';
  const returnedItemIds = new Set(returns.map((r) => String(r.orderItemId)));
  const returnableItems = (order?.items || []).filter((item) => item.orderItemId && !returnedItemIds.has(String(item.orderItemId)));

  const handleOpenReturn = () => {
    const first = returnableItems[0];
    setReturnForm({
      orderItemId: first?.orderItemId || '',
      quantity: 1,
      reason: '',
    });
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!returnForm.orderItemId || !returnForm.reason.trim()) {
      toast.error('Select an item and enter a reason');
      return;
    }
    setReturnSubmitting(true);
    try {
      await createReturn(order.mongoId || orderId, {
        orderItemId: returnForm.orderItemId,
        quantity: Number(returnForm.quantity) || 1,
        reason: returnForm.reason.trim(),
      });
      toast.success('Return request submitted');
      setShowReturnModal(false);
      await loadOrder();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit return');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      await cancelOrder(order.id || order.mongoId || orderId, { reason: cancelReason });
      toast.success('Order cancelled successfully! Stock released & refund initiated.');
      setShowCancelModal(false);
      loadOrder(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const items = order.items || order.products || [];
      if (items.length === 0) {
        toast.error('No items found to reorder');
        return;
      }
      for (const item of items) {
        const pId = item.productId || item.id;
        const qty = item.quantity || item.qty || 1;
        if (pId) {
          await addCartItem({ productId: pId, quantity: qty }).catch(() => {});
        }
      }
      toast.success('All items added to bag!');
      navigate('/cart');
    } catch {
      toast.error('Could not reorder items');
    } finally {
      setIsReordering(false);
    }
  };

  const formatReturnStatus = (status) => String(status || 'requested').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <Package size={48} className="text-gray-300 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-gray-800">Order Not Found</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">We couldn't retrieve details for order #{orderId}.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const orderTotalPrice = order.items.reduce((acc, item) => acc + parsePrice(item.price), 0);
  const orderTotalOldPrice = order.items.reduce((acc, item) => {
    return acc + parsePrice(item.oldPrice || parsePrice(item.price) * 1.2);
  }, 0);
  const deliveryCharge = Number(order.deliveryCharge || 0);

  const handleDownloadInvoice = () => {
    setShowInvoiceModal(true);
  };

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#f3e8ff]/60 via-[#faf5ff] to-[#f5f3ff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF7A00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  return (
    <div className={`min-h-screen pb-20 font-sans text-slate-800 relative transition-colors duration-300 ${pageBg}`}>
      {!(isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      <div className={`sticky top-0 z-45 px-4 py-4 flex items-center justify-between border-b relative z-10 transition-colors duration-300 ${headerBg}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={`p-1 -ml-1 hover:bg-slate-50 rounded-full transition-colors ${headerTextColor}`}>
            <ArrowLeft size={22} />
          </button>
          <h1 className={`text-[17px] font-black tracking-tight ${headerTextColor}`}>Track Order</h1>
        </div>
        <span className="text-[11px] font-black text-[#3E5A44] bg-[#FFF8EE] px-3 py-1 rounded-full border border-emerald-100/50">
          ORDER ID: #{order.id}
        </span>
      </div>

      <div className="relative z-10">
        <div className="w-full mx-auto px-4 pt-5 space-y-5 pb-24">
          <DispatchDelayBanner order={order} role="user" />

          {/* CR-002 — live fulfillment state, entirely backend-driven. */}
          <FulfillmentStatus orderId={orderId} className="mb-4" />

          {gameEligible && (
            <button
              type="button"
              onClick={() => setShowGame(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/60 shadow-xs active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs flex-shrink-0">
                <Gift size={20} className="text-amber-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-[12.5px] font-black text-emerald-900">Catch Your Delivery</p>
                <p className="text-[10.5px] font-semibold text-emerald-700/60">Play now to win rewards</p>
              </div>
            </button>
          )}

          <CatchYourDeliveryGame
            orderId={orderId}
            isOpen={showGame}
            onClose={() => {
              setShowGame(false);
              // A play just used up this order's one attempt — hide the entry point.
              getGameEligibility(orderId)
                .then((data) => setGameEligible(Boolean(data?.eligible)))
                .catch(() => {});
            }}
          />

          <div className="bg-gradient-to-br from-[#3E5A44] to-[#042112] rounded-3xl p-6 text-white shadow-[0_8px_30px_rgba(8,66,36,0.12)] relative overflow-hidden border border-emerald-800/30">
            <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/15 flex-shrink-0">
                <Truck size={24} className="text-white" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Current Status</span>
                <h2 className="text-[18px] font-black tracking-tight mt-0.5">{order.status}</h2>
                <p className="text-[11.5px] font-medium text-emerald-100/70 mt-1 leading-normal">
                  {order.fulfilmentType === 'courier' && (trackingData?.shipment?.awb || order?.shipment?.awb) ? (
                    <>
                      AWB: <span className="text-yellow-400 font-bold">{trackingData?.shipment?.awb || order.shipment.awb}</span>
                      {(trackingData?.shipment?.courierName || order?.shipment?.courierName) && (
                        <> · {trackingData?.shipment?.courierName || order.shipment.courierName}</>
                      )}
                    </>
                  ) : trackingData?.assignment?.partnerName ? (
                    <>Delivery partner: <span className="text-yellow-400 font-bold">{trackingData.assignment.partnerName}</span></>
                  ) : (
                    <>Ordered on: <span className="text-yellow-400 font-bold">{order.date}</span></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Order Transparency Stage Banner */}
          <div className="bg-white rounded-3xl p-4.5 border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
              order.rawStatus === 'delivered'
                ? 'bg-emerald-100 text-emerald-800'
                : order.rawStatus === 'out_for_delivery' || order.rawStatus === 'shipped'
                ? 'bg-blue-100 text-blue-800 animate-pulse'
                : order.rawStatus === 'packed'
                ? 'bg-amber-100 text-amber-800'
                : order.rawStatus === 'confirmed'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {order.rawStatus === 'delivered' ? (
                <CheckCircle2 size={20} />
              ) : order.rawStatus === 'out_for_delivery' || order.rawStatus === 'shipped' ? (
                <Truck size={20} />
              ) : order.rawStatus === 'packed' ? (
                <Package size={20} />
              ) : order.rawStatus === 'confirmed' ? (
                <Package size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Transparency Update</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h4 className="text-[13px] font-black text-slate-800 mt-0.5">
                {isCourierOrder ? (
                  <>
                    {order.rawStatus === 'placed' && 'Awaiting Seller Confirmation'}
                    {order.rawStatus === 'confirmed' && 'Seller Accepted — Preparing Shipment'}
                    {order.rawStatus === 'packed' && 'Packed & Labeled — Ready for Courier Pickup'}
                    {order.rawStatus === 'shipped' && 'Handed Over to Courier Partner'}
                    {order.rawStatus === 'out_for_delivery' && 'Out For Delivery to Your Doorstep'}
                    {order.rawStatus === 'delivered' && 'Delivered Successfully!'}
                    {order.rawStatus === 'cancelled' && 'Order Cancelled'}
                    {!['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.rawStatus) && 'Processing Order'}
                  </>
                ) : (
                  <>
                    {order.rawStatus === 'placed' && 'Awaiting Seller Confirmation'}
                    {order.rawStatus === 'confirmed' && 'Seller Accepted — Preparing in Store'}
                    {order.rawStatus === 'packed' && 'Packed & Ready for Pickup'}
                    {order.rawStatus === 'shipped' && 'Rider Picked Up Package'}
                    {order.rawStatus === 'out_for_delivery' && 'Out For Delivery to Your Doorstep'}
                    {order.rawStatus === 'delivered' && 'Delivered Successfully!'}
                    {order.rawStatus === 'cancelled' && 'Order Cancelled'}
                    {!['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.rawStatus) && 'Processing Order'}
                  </>
                )}
              </h4>
              <p className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">
                {isCourierOrder ? (
                  <>
                    {order.rawStatus === 'placed' && 'Your order was received and sent to the seller. Packaging and courier scheduling will begin once accepted.'}
                    {order.rawStatus === 'confirmed' && 'The seller has accepted your order and is currently packing your items and generating the courier shipping label & AWB.'}
                    {order.rawStatus === 'packed' && 'Items are safely packed with shipping label attached. Awaiting pickup by the national courier partner.'}
                    {order.rawStatus === 'shipped' && 'The parcel has been handed over to the courier partner and is now in transit across logistics hubs.'}
                    {order.rawStatus === 'out_for_delivery' && 'Your package has arrived at the local delivery center and is out for final delivery.'}
                    {order.rawStatus === 'delivered' && 'Package has been delivered into your hands. Thank you for supporting Mithilakart artisans!'}
                    {order.rawStatus === 'cancelled' && 'This order has been cancelled.'}
                    {!['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.rawStatus) && 'We are updating your order details in real time.'}
                  </>
                ) : (
                  <>
                    {order.rawStatus === 'placed' && 'Your order was received and sent to the local artisan/seller. As soon as the seller accepts, packing will begin.'}
                    {order.rawStatus === 'confirmed' && 'The seller has accepted your order and is currently picking and preparing your items at the store/hub.'}
                    {order.rawStatus === 'packed' && 'Items are safely packed. A nearby delivery partner has been requested for pickup.'}
                    {order.rawStatus === 'shipped' && 'Your delivery partner has collected the package from the seller and is on the way.'}
                    {order.rawStatus === 'out_for_delivery' && 'Your delivery partner is nearby and heading toward your address! Keep your delivery OTP handy.'}
                    {order.rawStatus === 'delivered' && 'Package has been delivered into your hands. Thank you for supporting Mithilakart artisans!'}
                    {order.rawStatus === 'cancelled' && 'This order has been cancelled.'}
                    {!['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.rawStatus) && 'We are updating your order details in real time.'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Delivery OTP Card - local delivery only */}
          {!isCourierOrder && deliveryOtp && order.rawStatus !== 'delivered' && order.rawStatus !== 'cancelled' && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-[0_8px_25px_rgba(245,158,11,0.25)] relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-amber-100" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-100">Delivery Verification OTP</span>
                  </div>
                  <p className="text-[12px] font-medium text-amber-50 mt-1 max-w-sm leading-snug">
                    Share this 6-digit code with the delivery partner ONLY when they arrive at your door.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="self-start sm:self-auto bg-white text-slate-900 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-md active:scale-95 hover:bg-amber-50 transition-all flex-shrink-0"
                  title="Click to copy OTP"
                >
                  <span className="font-mono text-xl font-black tracking-widest text-slate-900">{deliveryOtp}</span>
                  {copiedOtp ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} className="text-slate-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Delivery Partner Details Card - local delivery only */}
          {!isCourierOrder && trackingData?.assignment?.partnerName && (
            <div className="bg-white rounded-3xl p-4.5 border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#3E5A44] flex items-center justify-center font-black">
                  <User size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Delivery Rider</span>
                  <h4 className="text-[14px] font-black text-slate-800">{trackingData.assignment.partnerName}</h4>
                  {trackingData.assignment.partnerPhone && (
                    <p className="text-[11.5px] text-slate-500 font-semibold">{trackingData.assignment.partnerPhone}</p>
                  )}
                </div>
              </div>
              {trackingData.assignment.partnerPhone && (
                <a
                  href={`tel:${trackingData.assignment.partnerPhone}`}
                  className="px-4 py-2 bg-[#3E5A44] hover:bg-[#2e4333] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Phone size={13} />
                  Call Rider
                </a>
              )}
            </div>
          )}

          {showLiveMap && (
            <div className="bg-white rounded-3xl p-4 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#3E5A44]" />
                Live Delivery Map
              </h3>
              <LiveDeliveryMap destination={destination} partnerLocation={partnerLocation} />
            </div>
          )}

          {/* National Courier Shipment Card (Standard Delivery) */}
          {isCourierOrder && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
              <div className="absolute right-[-20px] top-[-20px] w-36 h-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <Package size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Logistics Fulfillment</span>
                    <h3 className="text-[14px] font-black text-white">National Courier Delivery</h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {order.rawStatus?.replace(/_/g, ' ') || 'In Transit'}
                </span>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2.5 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Courier Partner</span>
                    <p className="text-[13px] font-bold text-white mt-0.5">
                      {trackingData?.shipment?.courierName || order?.shipment?.courierName || 'Standard Express Courier'}
                    </p>
                  </div>
                  {(trackingData?.shipment?.awb || order?.shipment?.awb) && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AWB Tracking #</span>
                      <div className="flex items-center gap-2 mt-0.5 justify-end">
                        <span className="font-mono text-xs font-black text-amber-300">
                          {trackingData?.shipment?.awb || order?.shipment?.awb}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAwb(trackingData?.shipment?.awb || order?.shipment?.awb)}
                          className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                          title="Copy AWB"
                        >
                          {copiedAwb ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed border-t border-white/5 pt-2">
                  ℹ️ This order is shipped across cities via national logistics cargo. Updates sync automatically as the parcel moves between hubs.
                </p>

                {(trackingData?.shipment?.labelUrl || order?.shipment?.labelUrl) && (
                  <div className="pt-1 border-t border-white/5">
                    <a
                      href={trackingData?.shipment?.labelUrl || order.shipment.labelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white transition-colors"
                    >
                      <Download size={14} />
                      Download Official Courier Shipping Label
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-5 flex items-center gap-2">
              <Clock size={16} className="text-[#3E5A44]" />
              Shipment Timeline
            </h3>
            <div className="space-y-6 pl-1.5">
              {deliveryUpdates.map((update, index) => {
                const isLast = index === deliveryUpdates.length - 1;
                return (
                  <div key={update.title} className="relative flex gap-5">
                    {!isLast && (
                      <div className="absolute left-[11px] top-[24px] bottom-[-28px] w-[2px] bg-slate-100" />
                    )}
                    <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      update.active
                        ? 'bg-emerald-50 text-[#3E5A44] border-2 border-[#3E5A44]'
                        : 'bg-slate-50 text-slate-300 border-2 border-slate-200'
                    }`}>
                      <CheckCircle2 size={12} className={update.active ? 'text-[#3E5A44]' : 'text-slate-300'} />
                    </div>
                    <div className="flex-1 -mt-0.5 pb-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-[13px] font-black text-slate-800 leading-none">{update.title}</h4>
                        {update.date && <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{update.date}</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{update.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
            <div className="px-5 py-4.5 border-b border-slate-100 flex items-center gap-2">
              <Package size={16} className="text-[#3E5A44]" />
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Order Items</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-5 flex gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 p-1.5 border border-slate-100/80">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 py-0.5">
                    <h4 className="text-[13px] font-black text-slate-850 leading-snug line-clamp-2">{item.name}</h4>
                    <p className="text-[10.5px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Qty: {item.quantity || 1}</p>
                    <p className="text-[13px] font-black text-[#3E5A44] mt-1.5">{formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {returns.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                <RotateCcw size={16} className="text-[#3E5A44]" />
                Return Requests
              </h3>
              <div className="space-y-3">
                {returns.map((ret) => (
                  <div key={getEntityId(ret)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">{ret.reason || 'Return requested'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Qty: {ret.quantity}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#3E5A44] bg-emerald-50 px-2 py-1 rounded-lg">
                      {formatReturnStatus(ret.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canRequestReturn && returnableItems.length > 0 && (
            <button
              onClick={handleOpenReturn}
              className="w-full bg-white border border-amber-200 text-amber-700 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-wider shadow-sm hover:bg-amber-50 transition-colors"
            >
              <RotateCcw size={16} />
              Request Return
            </button>
          )}

          <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
            <h3 className="text-[14px] font-black text-slate-800 tracking-tight flex items-center gap-2">
              <MapPin size={16} className="text-[#3E5A44]" />
              Delivery Details
            </h3>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                <User size={15} />
              </div>
              <div>
                <h4 className="text-[13px] font-black text-slate-800">Recipient</h4>
                <p className="text-[12px] text-slate-500 mt-0.5">{order.address?.name || '—'}</p>
                {order.address?.phone && (
                  <p className="text-[11.5px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                    <Phone size={11} /> {order.address.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4 border-t border-slate-50 pt-4">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                <MapPin size={15} />
              </div>
              <div>
                <h4 className="text-[13px] font-black text-slate-800">Address</h4>
                <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
                  {[order.address?.line1, order.address?.city, order.address?.pincode].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
            <div className="px-5 py-4.5 border-b border-slate-100 flex items-center gap-2">
              <ReceiptText size={16} className="text-[#3E5A44]" />
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Price Details</h3>
            </div>
            <div className="p-5 space-y-3.5 border-b border-slate-100">
              <div className="flex justify-between items-center text-[12.5px] font-medium text-slate-500">
                <span>Listing Price</span>
                <span className="font-bold text-slate-700">{formatPrice(orderTotalOldPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] font-medium text-slate-500">
                <span>Special Discount</span>
                <span className="font-bold text-[#3E5A44]">- {formatPrice(orderTotalOldPrice - orderTotalPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] font-medium text-slate-500">
                <span>Delivery Charges</span>
                <span className="font-bold text-slate-700">{formatPrice(deliveryCharge)}</span>
              </div>
              <div className="pt-3.5 border-t border-dashed border-slate-100 flex justify-between items-center text-[14px] font-black text-slate-800">
                <span>Total Paid Amount</span>
                <span className="text-[#3E5A44]">{formatPrice(orderTotalPrice + deliveryCharge)}</span>
              </div>
            </div>
            <div className="bg-slate-50/50 px-5 py-4 flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Payment Mode</span>
              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-100 shadow-2xs">
                <Wallet size={14} className="text-[#3E5A44]" />
                <span className="text-[12px] font-bold text-slate-800 capitalize">{order.paymentMethod || 'Cash On Delivery'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {/* Reorder Button */}
            <button
              onClick={handleReorder}
              disabled={isReordering}
              className="w-full bg-[#3E5A44] hover:bg-[#2d4232] text-white py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              <ShoppingBag size={18} />
              <span className="text-[13.5px] font-black uppercase tracking-wider">
                {isReordering ? 'Adding to Bag...' : '1-Click Reorder This Order'}
              </span>
            </button>

            {/* Rate Order Button for Delivered Orders */}
            {(order.rawStatus === 'delivered' || order.status?.toLowerCase() === 'delivered') && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                <Star size={16} className="fill-white" />
                <span>Rate Your Experience & Rider (5★)</span>
              </button>
            )}

            {/* Cancel Order Button for Placed Orders */}
            {(order.rawStatus === 'placed' || order.status?.toLowerCase() === 'order placed') && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <XCircle size={16} />
                <span>Cancel Order (Instant Refund)</span>
              </button>
            )}

            <button
              onClick={handleDownloadInvoice}
              className="w-full bg-white hover:bg-slate-50/60 active:bg-slate-50 text-slate-800 border border-slate-100 py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.01)] cursor-pointer"
            >
              <Download size={18} className="text-[#3E5A44]" />
              <span className="text-[13.5px] font-black uppercase tracking-wider">
                Download / Print GST Invoice
              </span>
            </button>

            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hello Mithilakart Support! I need help with my Order #${order.id} (Current Status: ${order.status}).`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-100 text-emerald-900 border border-emerald-200/80 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-xs"
            >
              <MessageCircle size={18} className="text-emerald-700" />
              <span className="text-[12.5px] font-bold">
                Need Help with this Order? Chat on WhatsApp
              </span>
            </a>
          </div>
        </div>
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">Request Return</h3>
              <button onClick={() => setShowReturnModal(false)} className="p-2 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</label>
                <select
                  value={returnForm.orderItemId}
                  onChange={(e) => setReturnForm((f) => ({ ...f, orderItemId: e.target.value }))}
                  className="w-full mt-1.5 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold"
                >
                  {returnableItems.map((item) => (
                    <option key={item.orderItemId} value={item.orderItemId}>
                      {item.name} (Qty: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={returnableItems.find((i) => i.orderItemId === returnForm.orderItemId)?.quantity || 1}
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full mt-1.5 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label>
                <textarea
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Describe the issue..."
                  className="w-full mt-1.5 border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <button
                onClick={handleSubmitReturn}
                disabled={returnSubmitting}
                className="w-full bg-[#3E5A44] text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-60"
              >
                {returnSubmitting ? 'Submitting...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Tax Invoice Modal */}
      <OrderInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />

      {/* Post-Delivery Rating Modal */}
      <OrderRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        order={order}
        onReviewSubmitted={() => loadOrder(true)}
      />

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle size={20} />
                <h3 className="text-base font-black">Cancel Order #{order.orderNumber || order.id}</h3>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this order? Any pre-paid amount will be refunded immediately to your original payment source.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Want to change delivery address">Want to change delivery address</option>
                <option value="Want to add more items">Want to add more items</option>
                <option value="Expected faster delivery">Expected faster delivery</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
