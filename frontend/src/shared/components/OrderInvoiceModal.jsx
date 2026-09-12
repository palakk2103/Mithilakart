import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';

export default function OrderInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.id || '00000'}`;
  const invoiceDate = order.date || new Date().toLocaleDateString('en-GB');
  const subtotal = order.subtotal || order.items?.reduce((acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1), 0) || order.total || 0;
  const deliveryCharge = order.deliveryCharge ?? 0;
  const discount = order.discount ?? 0;
  const total = order.total || (subtotal + deliveryCharge - discount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header Actions (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tax Invoice Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#3E5A44] hover:bg-[#2e4333] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Content */}
        <div className="p-8 print:p-0 print:m-0 text-slate-800 font-sans" id="printable-invoice">
          {/* Brand Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#3E5A44]">MITHILAKART</h1>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Authentic Cultural Artifacts & Local Commerce</p>
              <p className="text-[10px] text-slate-400 mt-1">Mithilakart E-Commerce Pvt. Ltd.</p>
              <p className="text-[10px] text-slate-400">GSTIN: 23AAECM1234F1Z5 · CIN: U52100MP2026PTC012345</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Original Tax Invoice
              </span>
              <p className="text-xs font-black text-slate-900 mt-2">Invoice: <span className="font-mono">{invoiceNumber}</span></p>
              <p className="text-[11px] text-slate-500 font-medium">Date: {invoiceDate}</p>
              <p className="text-[11px] text-slate-500 font-medium">Order: #{order.id}</p>
            </div>
          </div>

          {/* Billing & Shipping Meta */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Delivered To (Customer)</p>
              <p className="font-black text-slate-900 text-[13px]">{order.address?.name || 'Customer'}</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">{order.address?.line1 || order.address?.addressLine || 'Delivery Address'}</p>
              <p className="text-slate-600">{[order.address?.city, order.address?.state, order.address?.pincode].filter(Boolean).join(', ')}</p>
              {order.address?.phone && <p className="text-slate-500 mt-1">Phone: {order.address.phone}</p>}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Payment & Dispatch Details</p>
              <p className="text-slate-700"><span className="font-bold">Payment Method:</span> {String(order.paymentMethod || 'Prepaid').toUpperCase()}</p>
              <p className="text-slate-700 mt-0.5"><span className="font-bold">Payment Status:</span> <span className="text-emerald-700 font-semibold">{String(order.paymentStatus || 'Completed').toUpperCase()}</span></p>
              <p className="text-slate-700 mt-0.5"><span className="font-bold">Fulfillment Mode:</span> {order.fulfilmentType === 'courier' ? 'Standard Courier' : 'Hyperlocal Quick Delivery'}</p>
              <p className="text-slate-700 mt-0.5"><span className="font-bold">Order Status:</span> {order.status}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-3 w-8">#</th>
                  <th className="pb-3">Item Description</th>
                  <th className="pb-3 text-center w-16">Qty</th>
                  <th className="pb-3 text-right w-24">Unit Price</th>
                  <th className="pb-3 text-right w-24">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((item, idx) => {
                  const unitPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                  const itemTotal = unitPrice * (item.quantity || 1);
                  return (
                    <tr key={idx} className="py-2.5">
                      <td className="py-2.5 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-2.5">
                        <p className="font-black text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400">HSN: 996813 · 5% GST Included</p>
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-700">{item.quantity || 1}</td>
                      <td className="py-2.5 text-right font-medium text-slate-600">{formatPrice(unitPrice)}</td>
                      <td className="py-2.5 text-right font-black text-slate-900">{formatPrice(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Price Calculation Summary */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges:</span>
                <span className="font-bold">{deliveryCharge > 0 ? formatPrice(deliveryCharge) : 'FREE'}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 text-sm font-black pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-[#3E5A44]">{formatPrice(total)}</span>
              </div>
              <p className="text-[9px] text-slate-400 text-right italic mt-1">Inclusive of all applicable taxes</p>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#3E5A44]" />
              <span>Computer generated authorized invoice · No physical signature required.</span>
            </div>
            <span>Support: support@mithilakart.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
