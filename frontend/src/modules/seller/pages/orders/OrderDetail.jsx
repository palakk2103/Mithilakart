/**
 * Order Detail Page
 * Full order details with timeline, customer info, products, and invoice.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Package, MapPin, CreditCard, User, Clock, CheckCircle2, Truck, ShoppingBag } from 'lucide-react';
import { PageHeader, StatusBadge } from '../../components/common';
import { Button, Card } from '../../components/ui';
import { getOrder } from '../../services/sellerApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
        <p className="text-gray-500">Order not found</p>
        <Button variant="secondary" onClick={() => navigate('/seller/orders')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const timelineSteps = [
    { label: 'Order Placed', date: order.placedAt, icon: ShoppingBag, done: true },
    { label: 'Confirmed', date: order.confirmedAt, icon: CheckCircle2, done: !!order.confirmedAt },
    { label: 'Packed', date: order.packedAt, icon: Package, done: !!order.packedAt },
    { label: 'Shipped', date: order.shippedAt, icon: Truck, done: !!order.shippedAt },
    { label: 'Delivered', date: order.deliveredAt, icon: CheckCircle2, done: !!order.deliveredAt },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title={`Order #${order.id}`} subtitle={`Placed on ${formatDate(order.placedAt, 'long')}`}>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/seller/orders')}>Back</Button>
        <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print Invoice</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <Card title="Order Timeline">
            <div className="flex items-center justify-between mt-4 relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
              <div className="absolute top-5 left-0 h-0.5 bg-[#2563EB] z-0"
                   style={{ width: `${(timelineSteps.filter(s => s.done).length - 1) / (timelineSteps.length - 1) * 100}%` }} />

              {timelineSteps.map((step, i) => (
                <div key={step.label} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.done ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    <step.icon size={18} />
                  </div>
                  <p className={`text-xs font-medium mt-2 ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  {step.date && <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(step.date, 'short')}</p>}
                </div>
              ))}
            </div>
          </Card>

          {/* Products */}
          <Card title="Products">
            <div className="space-y-3 mt-4">
              {(order.products || []).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                      <Package size={20} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{product.title}</p>
                      <p className="text-xs text-gray-400">Qty: {product.qty || product.quantity || 1}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency((product.price || 0) * (product.qty || product.quantity || 1))}</p>
                </div>
              ))}
            </div>

            {/* Price Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">{formatCurrency(order.totalAmount || 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="text-gray-900">{order.shippingCharge ? formatCurrency(order.shippingCharge) : 'Free'}</span></div>
              {(order.discount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600">-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100"><span>Total</span><span>{formatCurrency(order.finalAmount || order.totalAmount || 0)}</span></div>
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
            <div className="mt-3">
              <StatusBadge status={order.status} size="lg" />
              {order.trackingId && (
                <p className="text-xs text-gray-400 mt-3">Tracking ID: <span className="font-mono text-gray-600">{order.trackingId}</span></p>
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
    </div>
  );
};

export default OrderDetail;
