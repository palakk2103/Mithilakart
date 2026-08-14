/**
 * useDispatchDelay Hook
 * Provides reactive, safe live dispatch SLA calculation for an order.
 * Updates every 1000ms using real timestamps (resilient against tab sleeps / page refreshes).
 */

import { useState, useEffect } from 'react';
import { getDispatchSlaInfo } from '../utils/dispatchDelayUtils';

export const useDispatchDelay = (order, intervalMs = 1000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!order) return;

    // Only set timer interval if order is in active pending dispatch state
    const currentSla = getDispatchSlaInfo(order, Date.now());
    if (!currentSla.isPending) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [order, intervalMs]);

  return getDispatchSlaInfo(order, now);
};

export default useDispatchDelay;
