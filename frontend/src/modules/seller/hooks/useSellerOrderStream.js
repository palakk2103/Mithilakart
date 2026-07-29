import { useEffect, useRef } from 'react';
import { getSocket } from '../../../shared/services/socket';
import { playOrderAlert } from '../../../shared/utils/orderAlertSound';

/**
 * Subscribe to seller-wide order events (new orders + status updates) via Socket.IO.
 */
export default function useSellerOrderStream(onEvent) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const socket = getSocket('seller');
    if (!socket) return undefined;

    const onNewOrder = (payload) => {
      playOrderAlert();
      handlerRef.current?.({ ...payload, type: 'new_order' });
    };
    const onStatus = (payload) => handlerRef.current?.({ ...payload, type: 'status_update' });

    socket.on('new_order', onNewOrder);
    socket.on('status_update', onStatus);

    return () => {
      socket.off('new_order', onNewOrder);
      socket.off('status_update', onStatus);
    };
  }, []);
}
