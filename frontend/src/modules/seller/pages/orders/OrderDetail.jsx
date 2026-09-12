/**
 * Order Detail Page
 * Full order details with timeline, customer info, products, and invoice.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Package, MapPin, CreditCard, User, Clock, CheckCircle2, Truck, ShoppingBag, AlertCircle, FileText } from 'lucide-react';
import { PageHeader, StatusBadge } from '../../components/common';
import { Button, Card } from '../../components/ui';
import { getOrder, updateOrderStatus, getShipmentLabel } from '../../services/sellerApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useOrderSocket from '../../../../shared/hooks/useOrderSocket';
import toast from 'react-hot-toast';
import DispatchDelayBanner from '../../../../shared/components/DispatchDelayBanner';
import DispatchDelayTimer from '../../../../shared/components/DispatchDelayTimer';
import { getDispatchSlaInfo } from '../../../../shared/utils/dispatchDelayUtils';
import OrderInvoiceModal from '../../../../shared/components/OrderInvoiceModal';
import PackingSlipModal from '../../../../shared/components/PackingSlipModal';

// Base actions map — extended dynamically per order fulfillment type (Courier vs Hyperlocal)
const STATUS_ACTIONS = {
  placed: [
    { label: 'Accept Order', status: 'confirmed', variant: 'primary' },
    { label: 'Reject Order', status: 'cancelled', variant: 'danger' },
  ],
  confirmed: [
    { label: 'Mark as Packed', status: 'packed', variant: 'primary' },
  ],
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const refetchOrderSilently = async () => {
    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch {
      // ignore live refetch errors
    }
  };

  const handleStatusAction = async (nextStatus) => {
    try {
      setUpdating(true);
      await updateOrderStatus(id, nextStatus);
      toast.success(`Order marked as ${nextStatus.replace(/_/g, ' ')}`);
      await refetchOrderSilently();
    } catch (err) {
      toast.error(err?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const isCourierOrder = order?.fulfilmentType === 'courier' || order?.commerceFlow === 'standard' || order?.commerceFlow === 'mithilak';

  const availableActions = useMemo(() => {
    if (!order?.status) return [];
    if (order.status === 'placed') {
      return [
        { label: 'Accept Order', status: 'confirmed', variant: 'primary' },
        { label: 'Reject Order', status: 'cancelled', variant: 'danger' },
      ];
    }
    if (order.status === 'confirmed') {
      return [
        { label: 'Mark as Packed', status: 'packed', variant: 'primary' },
      ];
    }
    if (order.status === 'packed') {
      if (isCourierOrder) {
        return [
          { label: 'Handover to Courier (Mark Shipped)', status: 'shipped', variant: 'primary' },
        ];
      }
      return [];
    }
    if (order.status === 'shipped') {
      if (isCourierOrder) {
        return [
          { label: 'Mark Out for Delivery', status: 'out_for_delivery', variant: 'secondary' },
          { label: 'Mark Delivered by Courier', status: 'delivered', variant: 'primary' },
        ];
      }
      return [];
    }
    if (order.status === 'out_for_delivery') {
      if (isCourierOrder) {
        return [
          { label: 'Confirm Delivered by Courier', status: 'delivered', variant: 'primary' },
        ];
      }
      return [];
    }
    return [];
  }, [order?.status, isCourierOrder]);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleSocketUpdate = useCallback(() => {
    refetchOrderSilently();
  }, [id]);

  useOrderSocket(id, 'seller', { onStatusUpdate: handleSocketUpdate });

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{error || 'Order not found'}</p>
        <Button variant="secondary" onClick={() => navigate('/seller/orders')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const slaInfo = getDispatchSlaInfo(order);
  const isDelayed = slaInfo.isPending && (slaInfo.dispatchState === 'delayed' || slaInfo.dispatchState === 'escalated');

  const timelineSteps = [
    { label: 'Order Placed', date: order.placedAt, icon: ShoppingBag, done: true },
    { label: 'Accepted', date: order.confirmedAt, icon: CheckCircle2, done: !!order.confirmedAt },
    ...(isDelayed ? [{ label: 'Dispatch Delayed', date: order.delayedAt || null, icon: AlertCircle, done: true, isWarning: true }] : []),
    { label: 'Packed', date: order.packedAt, icon: Package, done: !!order.packedAt },
    { label: 'Shipped', date: order.shippedAt, icon: Truck, done: !!order.shippedAt },
    { label: 'Delivered', date: order.deliveredAt, icon: CheckCircle2, done: !!order.deliveredAt },
  ];

  const handlePrint = () => window.print();

  const handleDownloadLabel = async () => {
    try {
      const label = await getShipmentLabel(id);
      const url = label?.labelUrl;
      if (!url) {
        toast.error('Shipping label is not available yet');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch shipping label');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <PageHeader title={`Order #${order.orderNumber || order.id}`} subtitle={`Placed on ${formatDate(order.placedAt, 'long')}`}>
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate('/seller/orders')}>Back</Button>
        <Button variant="secondary" size="sm" icon={FileText} onClick={() => setShowPackingSlipModal(true)}>Packing Slip (KOT)</Button>
        <Button variant="secondary" size="sm" icon={Printer} onClick={() => setShowInvoiceModal(true)}>Print Invoice</Button>
        {isCourierOrder && order.shipment?.labelUrl && (
          <Button variant="secondary" size="sm" icon={Truck} onClick={handleDownloadLabel}>Shipping Label</Button>
        )}
      </PageHeader>

      <DispatchDelayBanner order={order} role="seller" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Timeline */}
          <Card title="Order Timeline">
            <div className="flex items-center justify-between mt-3 px-2 relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100 z-0" />
              <div className="absolute top-4 left-4 h-0.5 bg-slate-900 z-0 transition-all duration-300"
                   style={{ width: `${(timelineSteps.filter(s => s.done).length - 1) / Math.max(1, timelineSteps.length - 1) * 100}%` }} />

              {timelineSteps.map((step) => (
                <div key={step.label} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform duration-200 ${
                    step.isWarning
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : step.done
                      ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    <step.icon size={14} />
                  </div>
                  <p className={`text-[11px] font-bold mt-1.5 ${step.isWarning ? 'text-rose-600' : step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                  {step.date && <p className="text-[9.5px] text-slate-400 mt-0.2">{formatDate(step.date, 'short')}</p>}
                </div>
              ))}
            </div>
          </Card>

          {/* Products */}
          <Card title="Ordered Items">
            <div className="space-y-2.5 mt-2">
              {(order.products || []).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200/60 shrink-0">
                      <Package size={16} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{product.title}</p>
                      <p className="text-[10.5px] text-slate-400">Qty: {product.qty || product.quantity || 1}</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-900 shrink-0 pl-3">{formatCurrency((product.price || 0) * (product.qty || product.quantity || 1))}</p>
                </div>
              ))}
            </div>

            {/* Price Summary */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span className="font-semibold text-slate-800">{formatCurrency(order.totalAmount || 0)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Delivery Fee</span><span className="font-semibold text-slate-800">{order.shippingCharge ? formatCurrency(order.shippingCharge) : 'Free'}</span></div>
              {(order.discount || 0) > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Discount</span><span className="font-semibold text-emerald-600">-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100 text-slate-900"><span>Total</span><span>{formatCurrency(order.finalAmount || order.totalAmount || 0)}</span></div>
            </div>
          </Card>

          {/* Invoice Print Area */}
          <div className="seller-print-area hidden">
            <h2 className="text-xl font-bold mb-4">Invoice — #{order.id}</h2>
            <p>Date: {formatDate(order.placedAt, 'long')}</p>
            <p>Customer: {order.customer?.name}</p>
            <p>Total: {formatCurrency(order.finalAmount || order.totalAmount || 0)}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card title="Status">
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={isDelayed ? 'dispatch_delayed' : order.status} size="lg" />
                <DispatchDelayTimer order={order} size="md" />
              </div>
              {availableActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableActions.map((action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant={action.variant}
                      loading={updating}
                      onClick={() => handleStatusAction(action.status)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
              {order.trackingId && (
                <p className="text-xs text-gray-400 mt-3">Tracking ID: <span className="font-mono text-gray-600">{order.trackingId}</span></p>
              )}
              {isCourierOrder && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2.5 mt-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      📦 National Courier Shipment
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
                      Standard
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Courier Partner:</span>
                      <span className="font-bold text-slate-900">{order.shipment?.courierName || 'Mithilakart Logistics / Shiprocket'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">AWB Tracking:</span>
                      <span className="font-mono font-bold text-emerald-700">{order.shipment?.awb || 'Auto-generated on confirmation'}</span>
                    </div>
                    {order.shipment?.status && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Courier Status:</span>
                        <span className="font-semibold capitalize text-slate-800">{order.shipment.status.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>

                  {order.shipment?.labelUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Truck}
                      onClick={handleDownloadLabel}
                      className="w-full mt-1"
                    >
                      Download Shipping Label
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Customer */}
          <Card title="Customer Details">
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <User size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.customer?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{order.customer?.email || ''}</p>
                </div>
              </div>
              {order.customer?.phone && <p className="text-xs text-gray-500">📞 {order.customer.phone}</p>}
            </div>
          </Card>

          {/* Shipping Address */}
          <Card title="Shipping Address">
            <div className="mt-3 flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600 leading-relaxed">
                {order.address?.line1}, {order.address?.city}, {order.address?.state} — {order.address?.pincode}
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card title="Payment">
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">{order.payment?.method || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={order.payment?.status || 'pending'} size="sm" />
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Txn ID</span>
                  <span className="font-mono text-xs text-gray-600">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card title="Notes">
              <p className="text-sm text-gray-600 mt-3">{order.notes}</p>
            </Card>
          )}
        </div>
      </div>

      <OrderInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />
      <PackingSlipModal
        isOpen={showPackingSlipModal}
        onClose={() => setShowPackingSlipModal(false)}
        order={order}
      />
    </div>
  );
};

export default OrderDetail;
