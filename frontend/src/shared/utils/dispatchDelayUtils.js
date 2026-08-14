/**
 * Dispatch Delay Utilities
 * Provides pure functions for determining order dispatch SLA status,
 * deadline calculations, countdown values, and human-readable formatting.
 */

import DISPATCH_DELAY_CONFIG from '../../config/dispatchDelayConfig';

/**
 * Normalizes order status string
 */
export const normalizeOrderStatus = (status) => {
  if (!status) return '';
  return String(status).toLowerCase().trim().replace(/[\s_-]+/g, '');
};

/**
 * Checks whether an order is in a pending dispatch stage (not yet shipped/delivered/cancelled)
 */
export const isPendingDispatch = (status) => {
  const norm = normalizeOrderStatus(status);
  // Statuses where seller has not yet completed dispatch
  return ['placed', 'confirmed', 'pending', 'processing', 'packed'].includes(norm);
};

/**
 * Returns applicable SLA hours for an order based on commerce flow or fulfillment type
 */
export const getOrderSlaHours = (order) => {
  if (!order) return DISPATCH_DELAY_CONFIG.defaultSlaHours.standard;

  const flow = (order.commerceFlow || order.fulfilmentType || '').toLowerCase();
  if (flow.includes('quick') || flow === 'quick_shop') {
    return DISPATCH_DELAY_CONFIG.defaultSlaHours.quick_shop;
  }
  if (flow.includes('grocery') || flow === 'groceries_fresh') {
    return DISPATCH_DELAY_CONFIG.defaultSlaHours.groceries_fresh;
  }
  return DISPATCH_DELAY_CONFIG.defaultSlaHours.standard;
};

/**
 * Calculates complete dispatch SLA details for an order.
 * Backend-ready: prefetched backend fields take precedence over calculated defaults.
 */
export const getDispatchSlaInfo = (order, nowTimestamp = Date.now()) => {
  if (!order || !DISPATCH_DELAY_CONFIG.enabled) {
    return { dispatchState: 'normal', isPending: false, remainingMs: 0, delayMs: 0 };
  }

  const currentStatus = order.rawStatus || order.status || '';
  const pendingDispatch = isPendingDispatch(currentStatus);

  // If order is already shipped, delivered, or cancelled, SLA calculation is inactive
  if (!pendingDispatch) {
    return {
      dispatchState: 'completed',
      isPending: false,
      remainingMs: 0,
      delayMs: 0,
      formattedTime: null,
    };
  }

  // Developer simulation override check
  if (DISPATCH_DELAY_CONFIG.devDemo?.enabled && DISPATCH_DELAY_CONFIG.devDemo?.simulatedStatus) {
    const simState = DISPATCH_DELAY_CONFIG.devDemo.simulatedStatus;
    return {
      dispatchState: simState,
      isPending: true,
      remainingMs: simState === 'normal' ? 36000000 : simState === 'warning' ? 3600000 : 0,
      delayMs: simState === 'delayed' ? 7200000 : simState === 'escalated' ? 90000000 : 0,
      formattedTime: simState === 'delayed' ? '2h 15m' : simState === 'warning' ? '1h 00m' : '10h 00m',
      deadlineDate: new Date(nowTimestamp + 36000000),
    };
  }

  // 1. Check if backend already provided explicit dispatch SLA fields
  if (order.dispatchStatus && order.dispatchDeadline) {
    const deadlineMs = new Date(order.dispatchDeadline).getTime();
    const diffMs = deadlineMs - nowTimestamp;
    const isDelayed = diffMs < 0;
    
    return {
      dispatchState: order.dispatchStatus, // 'normal' | 'warning' | 'delayed' | 'escalated'
      isPending: true,
      remainingMs: Math.max(0, diffMs),
      delayMs: isDelayed ? Math.abs(diffMs) : 0,
      formattedTime: formatDurationMs(Math.abs(diffMs)),
      deadlineDate: new Date(deadlineMs),
    };
  }

  // 2. Fallback computation using order creation timestamp
  const orderTimeStr = order.placedAt || order.createdAt || order.date || order.orderDate;
  const orderTimeMs = orderTimeStr ? new Date(orderTimeStr).getTime() : nowTimestamp;
  const slaHours = getOrderSlaHours(order);
  const slaMs = slaHours * 60 * 60 * 1000;
  const deadlineMs = orderTimeMs + slaMs;

  const diffMs = deadlineMs - nowTimestamp;
  const isDelayed = diffMs < 0;
  const delayMs = isDelayed ? Math.abs(diffMs) : 0;
  const remainingMs = Math.max(0, diffMs);

  const warningThresholdMins = slaHours <= 1 
    ? DISPATCH_DELAY_CONFIG.warningThresholdMinutes.quick_shop 
    : DISPATCH_DELAY_CONFIG.warningThresholdMinutes.standard;
  const warningThresholdMs = warningThresholdMins * 60 * 1000;
  const escalationThresholdMs = DISPATCH_DELAY_CONFIG.escalationThresholdMinutes * 60 * 1000;

  let dispatchState = 'normal';
  if (isDelayed) {
    dispatchState = delayMs >= escalationThresholdMs ? 'escalated' : 'delayed';
  } else if (remainingMs <= warningThresholdMs) {
    dispatchState = 'warning';
  }

  return {
    dispatchState,
    isPending: true,
    remainingMs,
    delayMs,
    formattedTime: formatDurationMs(isDelayed ? delayMs : remainingMs),
    deadlineDate: new Date(deadlineMs),
    slaHours,
  };
};

/**
 * Formats duration in milliseconds into a concise string like "8h 25m" or "14m"
 */
export const formatDurationMs = (ms) => {
  if (!ms || ms <= 0) return '0m';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};
