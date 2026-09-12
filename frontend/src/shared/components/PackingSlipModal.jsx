import React from 'react';
import { X, Printer, PackageCheck, Scissors } from 'lucide-react';
const formatPackingDate = (dateVal) => {
  if (!dateVal) return new Date().toLocaleString('en-IN');
  try {
    return new Date(dateVal).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateVal);
  }
};

export default function PackingSlipModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderNum = order.orderNumber || order.id || 'N/A';
  const placedTime = formatPackingDate(order.placedAt);
  const items = order.products || order.items || [];
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.qty || it.quantity) || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <PackageCheck size={18} className="text-emerald-400" />
            <span className="text-xs font-bold tracking-wider uppercase">Thermal Packing Slip (80mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Packing Ticket (Formatted for 80mm POS or A4) */}
        <div className="p-6 bg-amber-50/30 print:p-2 print:bg-white font-mono text-slate-900 text-xs selection:bg-slate-200">
          <div className="border-2 border-dashed border-slate-300 p-4 rounded-xl bg-white shadow-xs">
            {/* Store Banner */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <p className="text-base font-black tracking-tighter uppercase">MITHILAKART FULFILLMENT</p>
              <p className="text-[10px] text-slate-500 font-sans tracking-wide">DARK STORE / SELLER PACKING SLIP</p>
            </div>

            {/* Order Meta Header */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500 uppercase text-[10px]">ORDER ID:</span>
                <span className="text-sm font-black tracking-tight font-mono">#{orderNum}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase">PLACED AT:</span>
                <span className="text-[10px] font-semibold">{placedTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase">FULFILLMENT:</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                  {order.fulfilmentType || order.commerceFlow || 'EXPRESS HYPERLOCAL'}
                </span>
              </div>
            </div>

            {/* Customer Handover Summary */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 text-[11px] space-y-0.5">
              <p className="text-[10px] text-slate-400 uppercase font-bold">SHIP TO CUSTOMER:</p>
              <p className="font-bold text-slate-900">{order.customer?.name || order.address?.name || 'Customer'}</p>
              <p className="text-slate-600 text-[10px]">{order.address?.city || 'Local Area'} {order.address?.pincode ? `• PIN: ${order.address?.pincode}` : ''}</p>
              {order.customer?.phone && (
                <p className="text-slate-500 text-[10px]">Phone: {order.customer.phone.replace(/(\d{4})$/, 'XXXX')}</p>
              )}
            </div>

            {/* Checklist items */}
            <div className="py-3 border-b-2 border-dashed border-slate-300">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-2">
                <span>CHECK ITEM</span>
                <span>QTY</span>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const qty = item.qty || item.quantity || 1;
                  return (
                    <div key={item.id || idx} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="inline-block w-4 h-4 border-2 border-slate-700 rounded-sm mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold leading-tight line-clamp-2 text-slate-900">{item.title || item.name}</p>
                          {(item.sku || item.variant) && (
                            <p className="text-[10px] text-slate-500">SKU: {item.sku || item.variant}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-sm px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 shrink-0">
                        x{qty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Units Summary */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 flex justify-between items-center font-bold text-xs">
              <span>TOTAL ITEMS / UNITS:</span>
              <span className="text-sm font-black px-2 py-0.5 bg-slate-900 text-white rounded">{totalUnits} UNITS</span>
            </div>

            {/* Dispatch Instructions & Barcode Simulation */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-sans">
                <Scissors size={12} />
                <span>PACK SECURELY · AFFIX TO PARCEL</span>
              </div>
              {/* Simulated barcode */}
              <div className="h-9 w-full bg-slate-100 flex items-center justify-center font-mono tracking-widest text-xs font-bold text-slate-600 border border-slate-200 rounded">
                ||| | || |||| | | ||| | |||
              </div>
              <p className="text-[9px] text-slate-400 font-mono">TOKEN: {orderNum}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
