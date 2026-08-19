import { useCallback, useEffect, useRef, useState } from 'react';
import useOrderSocket from './useOrderSocket';
import { getOrderFulfillment } from '../../modules/user/services/ordersApi';

/**
 * CR-002 — live fulfillment state for one order.
 *
 * The backend is authoritative. Socket events are treated as notifications
 * only: every push is merged onto server-supplied state, and the hook re-reads
 * the API on mount, on reconnect, and when the tab becomes visible again. A
 * dropped or duplicated event therefore cannot leave the UI wrong.
 *
 * Nothing here computes an ETA, a delivery mode, or a price — those values are
 * displayed exactly as the server reports them.
 */
export default function useFulfillmentStatus(orderId, { enabled = true } = {}) {
  const [fulfillment, setFulfillment] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId && enabled));
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!orderId || !enabled) return null;

    try {
      const data = await getOrderFulfillment(orderId);
      if (mountedRef.current) {
        setFulfillment(data);
        setError(null);
      }
      return data;
    } catch (err) {
      // A failed poll must not blank out state the user is already looking at.
      if (mountedRef.current) setError(err?.message || 'Could not load delivery status');
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [orderId, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-read when the tab regains focus — covers a client that slept through
  // the whole fulfillment.
  useEffect(() => {
    if (!orderId || !enabled) return undefined;

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [orderId, enabled, refresh]);

  useOrderSocket(enabled ? orderId : null, 'customer', {
    onFulfillmentUpdate: (payload) => {
      setFulfillment((prev) => ({
        ...(prev || {}),
        state: payload.state ?? prev?.state ?? null,
        message: payload.message ?? null,
        // A courier downgrade clears the quick ETA; honour null explicitly
        // rather than falling back to the stale previous value.
        deliveryMode: payload.deliveryMode !== undefined ? payload.deliveryMode : prev?.deliveryMode,
        estimatedDeliveryMinutes: payload.estimatedDeliveryMinutes !== undefined
          ? payload.estimatedDeliveryMinutes
          : prev?.estimatedDeliveryMinutes,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      }));
    },
    onSyncState: (payload) => {
      // Authoritative snapshot from the server on (re)connect.
      if (payload?.fulfillment) {
        setFulfillment((prev) => ({ ...(prev || {}), ...payload.fulfillment }));
      }
    },
    onStatusUpdate: () => { refresh(); },
  });

  return { fulfillment, loading, error, refresh };
}
