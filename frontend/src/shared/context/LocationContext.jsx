import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  formatLocationLabel,
  readStoredLocation,
  requestBrowserLocation,
  writeStoredLocation,
} from '../services/locationService';
import { reverseGeocode } from '../services/locationApi';

const LocationContext = createContext(null);

const isValidGpsLocation = (loc) =>
  loc?.source === 'gps'
  && Number.isFinite(Number(loc?.latitude))
  && Number.isFinite(Number(loc?.longitude));

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    const stored = readStoredLocation();
    return isValidGpsLocation(stored) ? stored : null;
  });
  const [loading, setLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchIdRef = useRef(null);
  const lastGeocodeRef = useRef(0);

  const applyResolvedLocation = useCallback((coords, resolved = {}) => {
    const next = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      source: 'gps',
      shortLabel: resolved.shortLabel || resolved.addressLine || null,
      formattedAddress: resolved.shortLabel || resolved.formattedAddress || resolved.addressLine || null,
      fullFormattedAddress: resolved.fullFormattedAddress || resolved.formattedAddress || null,
      city: resolved.city || null,
      state: resolved.state || null,
      pincode: resolved.pincode || null,
      addressLine: resolved.addressLine || null,
      placeId: resolved.placeId || null,
      updatedAt: new Date().toISOString(),
    };
    setLocation(next);
    writeStoredLocation(next);
    window.dispatchEvent(new CustomEvent('location-updated', { detail: next }));
    return next;
  }, []);

  const resolveAddressForCoords = useCallback(async (coords) => {
    try {
      const resolved = await reverseGeocode(coords.latitude, coords.longitude);
      if (resolved?.shortLabel || resolved?.formattedAddress || resolved?.city) {
        return resolved;
      }
    } catch {
      // use coord fallback below
    }
    return {
      formattedAddress: `Near ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      city: null,
    };
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current != null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
        };

        setLocation((prev) => ({
          ...(prev || {}),
          ...coords,
          updatedAt: new Date().toISOString(),
        }));

        if (now - lastGeocodeRef.current < 30000) return;
        lastGeocodeRef.current = now;

        try {
          const resolved = await resolveAddressForCoords(coords);
          applyResolvedLocation(coords, resolved);
        } catch {
          applyResolvedLocation(coords, {
            formattedAddress: `Near ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }, [applyResolvedLocation, resolveAddressForCoords]);

  const refreshLiveLocation = useCallback(async ({ silent = false, forcePrompt = false } = {}) => {
    if (forcePrompt) setPromptOpen(true);

    setLoading(true);
    setPermissionDenied(false);
    try {
      const coords = await requestBrowserLocation({ maximumAge: 0 });
      const resolved = await resolveAddressForCoords(coords);
      const next = applyResolvedLocation(coords, resolved);
      if (!silent) toast.success(`Location updated: ${formatLocationLabel(next)}`);
      setPromptOpen(false);
      startWatching();
      return next;
    } catch (error) {
      if (error?.code === 1) {
        setPermissionDenied(true);
        if (!silent) toast.error('Location permission denied. Enable GPS in browser settings.');
      } else if (!silent) {
        toast.error(error?.message || 'Unable to detect live location');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyResolvedLocation, resolveAddressForCoords, startWatching]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      localStorage.removeItem('cartAddress');

      if (!isValidGpsLocation(readStoredLocation())) {
        writeStoredLocation(null);
      }

      try {
        if (navigator.permissions) {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          if (cancelled) return;

          if (perm.state === 'granted') {
            await refreshLiveLocation({ silent: true });
            startWatching();
            return;
          }

          if (perm.state === 'denied') {
            setPermissionDenied(true);
          }
        }
      } catch {
        // permissions API not available
      }

      if (!cancelled && !isValidGpsLocation(readStoredLocation())) {
        setPromptOpen(true);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [refreshLiveLocation, startWatching]);

  useEffect(() => {
    const onAuth = () => {
      refreshLiveLocation({ silent: true })
        .then(() => startWatching())
        .catch(() => {});
    };
    window.addEventListener('customer-auth-changed', onAuth);
    return () => window.removeEventListener('customer-auth-changed', onAuth);
  }, [refreshLiveLocation, startWatching]);

  const value = useMemo(() => ({
    location,
    loading,
    promptOpen,
    permissionDenied,
    label: formatLocationLabel(location),
    setPromptOpen,
    refreshLiveLocation,
    setManualLocation: (manual) => applyResolvedLocation(
      { latitude: manual.latitude, longitude: manual.longitude, source: 'gps' },
      manual
    ),
  }), [location, loading, promptOpen, permissionDenied, refreshLiveLocation, applyResolvedLocation]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return ctx;
};

export default LocationContext;
