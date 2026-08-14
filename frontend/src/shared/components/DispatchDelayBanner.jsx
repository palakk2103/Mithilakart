/**
 * DispatchDelayBanner Component
 * Context-aware alert banners for Seller, Admin, and User interfaces.
 */

import React from 'react';
import { AlertTriangle, Clock, AlertCircle, Info } from 'lucide-react';
import useDispatchDelay from '../hooks/useDispatchDelay';

export const DispatchDelayBanner = ({ order, role = 'seller', className = '' }) => {
  const slaInfo = useDispatchDelay(order);

  if (!slaInfo.isPending || slaInfo.dispatchState === 'normal' || slaInfo.dispatchState === 'completed') {
    return null;
  }

  const { dispatchState, formattedTime } = slaInfo;

  // USER / CUSTOMER APP BANNER (Reassuring, simple, non-technical)
  if (role === 'user' || role === 'customer') {
    if (dispatchState === 'delayed' || dispatchState === 'escalated') {
      return (
        <div className={`rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-900 shadow-xs flex items-start gap-3.5 ${className}`}>
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 mt-0.5">
            <Clock size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              Shipment Delayed
              <span className="text-[10px] bg-amber-200/70 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                SLA Delay: {formattedTime}
              </span>
            </h4>
            <p className="text-xs text-amber-800/90 leading-relaxed font-medium">
              The seller is taking longer than expected to dispatch your order.
              We'll notify you as soon as your package is handed over to logistics.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // SELLER VENDOR MODULE BANNER (Actionable, urgent)
  if (role === 'seller' || role === 'vendor') {
    if (dispatchState === 'warning') {
      return (
        <div className={`rounded-xl bg-amber-50 border border-amber-300 p-4 text-amber-900 shadow-xs flex items-start justify-between gap-3 ${className}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Dispatch Deadline Approaching</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Time remaining: <span className="font-mono font-bold text-amber-900">{formattedTime}</span>. Please dispatch this order soon to avoid SLA delay penalty.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (dispatchState === 'delayed' || dispatchState === 'escalated') {
      return (
        <div className={`rounded-xl bg-red-50 border border-red-300 p-4 text-red-900 shadow-xs flex items-start justify-between gap-3 ${className}`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                ⚠ Dispatch Delayed
                <span className="bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  Overdue: {formattedTime}
                </span>
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                This order has exceeded the expected dispatch time. Please mark as packed/shipped as soon as possible.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // ADMIN MODULE BANNER
  if (role === 'admin') {
    if (dispatchState === 'delayed' || dispatchState === 'escalated') {
      return (
        <div className={`rounded-xl bg-red-50 border border-red-200 p-3 text-red-900 text-xs flex items-center gap-2.5 ${className}`}>
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>
            <strong>Seller Delay Escalation:</strong> Order exceeded SLA dispatch limit by <span className="font-mono font-bold">{formattedTime}</span>.
          </span>
        </div>
      );
    }
  }

  return null;
};

export default DispatchDelayBanner;
