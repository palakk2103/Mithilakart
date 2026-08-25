import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, CheckCircle2, RotateCcw, X,
  Truck, Wallet, Download, MapPin, User, Phone, Package, Clock, ReceiptText, Gift
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAccountStore from '../../../../store/useAccountStore';
import { parsePrice, formatPrice } from '../../../../shared/utils/priceFormatter';
import { getOrderById, getOrderTracking, createReturn, getGameEligibility } from '../../services/ordersApi';
import { getMyReturns } from '../../services/userApi';
import { mapOrderDetail, getEntityId } from '../../utils/mappers';
import LiveDeliveryMap from '../../../../shared/components/LiveDeliveryMap';
import useOrderSocket from '../../../../shared/hooks/useOrderSocket';
import DispatchDelayBanner from '../../../../shared/components/DispatchDelayBanner';
import FulfillmentStatus from '../../../../shared/components/FulfillmentStatus';
import { getDispatchSlaInfo } from '../../../../shared/utils/dispatchDelayUtils';
import CatchYourDeliveryGame from '../../components/common/CatchYourDeliveryGame';

const STATUS_STEPS = [
  { key: 'pending', title: 'Checkout Started', desc: 'Payment pending.' },
  { key: 'placed', title: 'Order Placed', desc: 'Payment received — awaiting seller acceptance.' },
  { key: 'confirmed', title: 'Order Accepted', desc: 'Seller has accepted your order.' },
  { key: 'packed', title: 'Packed', desc: 'Your items are packed and ready.' },
  { key: 'shipped', title: 'Shipped', desc: 'Order picked up for delivery.' },
  { key: 'out_for_delivery', title: 'Out For Delivery', desc: 'Your package is on the way.' },
  { key: 'delivered', title: 'Delivered', desc: 'Your order has been delivered.' },
];

const formatTimelineDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
};

const buildTimeline = (tracking = [], currentStatus = 'pending') => {
  const trackingByStatus = new Map(tracking.map((t) => [t.status, t]));
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return STATUS_STEPS.map((step, index) => {
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
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ orderItemId: '', quantity: 1, reason: '' });
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [gameEligible, setGameEligible] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
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
    } catch {
      const fallback = orders.find((o) => o.id === orderId) || null;
      setOrder(fallback);
    } finally {
      setLoading(false);
    }
  }, [orderId, orders]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

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
      loadOrder();
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

  useOrderSocket(socketOrderId, 'customer', {
    onStatusUpdate: handleStatusUpdate,
    onLocationUpdate: handleLocationUpdate,
  });

  const deliveryUpdates = useMemo(() => {
    const shipment = trackingData?.shipment || order?.shipment;
    if (order?.fulfilmentType === 'courier' && shipment?.checkpoints?.length) {
      return [...shipment.checkpoints].reverse().map((cp, index, arr) => ({
        title: String(cp.status || 'Update').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        date: formatTimelineDate(cp.at),
        desc: cp.note || cp.location || '',
        active: index === arr.length - 1,
      }));
    }
    return buildTimeline(trackingData?.tracking || order?.tracking || [], order?.rawStatus || 'pending');
  }, [trackingData, order]);

  const destination = trackingData?.destination || (order?.address?.lat ? {
    lat: order.address.lat,
    lng: order.address.lng,
  } : null);

  const partnerLocation = trackingData?.partnerLocation || order?.partnerLocation;
  const showLiveMap = order?.fulfilmentType === 'local_delivery' || Boolean(partnerLocation);
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
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert('Invoice download started...');
    }, 1500);
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

          {showLiveMap && (
            <div className="bg-white rounded-3xl p-4 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#3E5A44]" />
                Live Delivery Map
              </h3>
              <LiveDeliveryMap destination={destination} partnerLocation={partnerLocation} />
            </div>
          )}

          {order?.fulfilmentType === 'courier' && (trackingData?.shipment?.labelUrl || order?.shipment?.labelUrl) && (
            <div className="bg-white rounded-3xl p-4 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <a
                href={trackingData?.shipment?.labelUrl || order.shipment.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#3E5A44] hover:underline"
              >
                <Download size={16} />
                Download shipping label
              </a>
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

          <div className="pt-2">
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className={`w-full bg-white hover:bg-slate-50/60 active:bg-slate-50 text-slate-800 border border-slate-100 py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.01)] ${isDownloading ? 'opacity-50' : ''}`}
            >
              <Download size={18} className={isDownloading ? 'animate-bounce text-[#3E5A44]' : 'text-[#3E5A44]'} />
              <span className="text-[13.5px] font-black uppercase tracking-wider">
                {isDownloading ? 'Downloading...' : 'Download Invoice'}
              </span>
            </button>
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
    </div>
  );
};

export default OrderDetail;
