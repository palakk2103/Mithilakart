import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export default function useOrderSocket(orderId, portal = 'customer', handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!orderId) return undefined;

    const socket = getSocket(portal);
    if (!socket) return undefined;

    const onStatus = (payload) => {
      if (String(payload?.orderId) === String(orderId)) {
        handlersRef.current.onStatusUpdate?.(payload);
      }
    };
    const onLocation = (payload) => {
      if (String(payload?.orderId) === String(orderId)) {
        handlersRef.current.onLocationUpdate?.(payload);
      }
    };
    const onSync = (payload) => {
      if (String(payload?.orderId) === String(orderId)) {
        handlersRef.current.onSyncState?.(payload);
      }
    };

    const join = () => socket.emit('join:order', { orderId });

    if (socket.connected) join();
    socket.on('connect', join);
    socket.on('status_update', onStatus);
    socket.on('location_update', onLocation);
    socket.on('sync_state', onSync);

    return () => {
      socket.off('connect', join);
      socket.off('status_update', onStatus);
      socket.off('location_update', onLocation);
      socket.off('sync_state', onSync);
    };
  }, [orderId, portal]);
}
