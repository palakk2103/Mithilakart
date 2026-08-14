/**
 * DispatchDelayTimer Component
 * Reusable countdown / delay duration pill badge with appropriate color indicators.
 */

import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import useDispatchDelay from '../hooks/useDispatchDelay';

export const DispatchDelayTimer = ({ order, size = 'md', className = '' }) => {
  const slaInfo = useDispatchDelay(order);

  if (!slaInfo.isPending || slaInfo.dispatchState === 'completed') {
    return null;
  }

  const { dispatchState, formattedTime } = slaInfo;

  let bgClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  let IconComponent = Clock;
  let labelPrefix = 'Dispatch in:';

  if (dispatchState === 'warning') {
    bgClasses = 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
    IconComponent = AlertTriangle;
    labelPrefix = 'Deadline in:';
  } else if (dispatchState === 'delayed' || dispatchState === 'escalated') {
    bgClasses = 'bg-red-50 text-red-700 border-red-300 font-semibold';
    IconComponent = AlertCircle;
    labelPrefix = 'Delayed by:';
  }

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2 py-0.5 gap-1'
    : size === 'lg'
    ? 'text-sm px-3.5 py-1.5 gap-2'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <div
      className={`inline-flex items-center rounded-full border shadow-2xs transition-colors ${bgClasses} ${sizeClasses} ${className}`}
      title={`Dispatch SLA status: ${dispatchState}`}
    >
      <IconComponent size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="flex-shrink-0" />
      <span>{labelPrefix} <strong className="font-mono">{formattedTime}</strong></span>
    </div>
  );
};

export default DispatchDelayTimer;
