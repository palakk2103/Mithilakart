import { useEffect, useRef } from 'react';
import { getSocket } from '../../../shared/services/socket';
import { playOrderAlert } from '../../../shared/utils/orderAlertSound';

export default function useDeliverySocket(onEvent) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const socket = getSocket('delivery');
    if (!socket) return undefined;

    const onAssignment = (payload) => {
      playOrderAlert();
      handlerRef.current?.(payload);
    };
    const onStatus = (payload) => handlerRef.current?.(payload);
    const onWithdrawn = (payload) => handlerRef.current?.(payload);

    socket.on('new_assignment', onAssignment);
    socket.on('status_update', onStatus);
    socket.on('assignment_withdrawn', onWithdrawn);

    return () => {
      socket.off('new_assignment', onAssignment);
      socket.off('status_update', onStatus);
      socket.off('assignment_withdrawn', onWithdrawn);
    };
  }, []);
}
