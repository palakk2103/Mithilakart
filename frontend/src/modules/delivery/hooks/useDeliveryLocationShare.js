import { useEffect, useRef } from 'react';
import { updateLocation } from '../services/deliveryApi';

export default function useDeliveryLocationShare(enabled) {
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return undefined;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < 4000) return;
        lastSentRef.current = now;
        updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled]);
}
