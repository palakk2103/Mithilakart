import { useEffect } from 'react';
import { isAuthenticated } from '../api/tokenStorage';
import { getAddresses } from '../../modules/user/services/userApi';
import useAccountStore from '../../store/useAccountStore';
import { formatLocationLabel } from '../services/locationService';

const mapApiAddress = (addr) => ({
  id: addr.id,
  name: addr.name,
  phone: addr.phone,
  address: addr.address || addr.addressLine,
  addressLine: addr.addressLine || addr.address,
  city: addr.city,
  state: addr.state,
  pincode: addr.pincode,
  latitude: addr.latitude,
  longitude: addr.longitude,
  isDefault: addr.isDefault,
});

const hasLiveGps = (liveLocation) =>
  liveLocation?.source === 'gps'
  && liveLocation?.latitude != null
  && liveLocation?.longitude != null;

export const useHydrateAddresses = () => {
  const { setSavedAddresses, setSelectedAddress } = useAccountStore();

  useEffect(() => {
    if (!isAuthenticated('customer')) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const list = await getAddresses();
        if (cancelled) return;
        const mapped = (Array.isArray(list) ? list : []).map(mapApiAddress);
        setSavedAddresses(mapped);
        const defaultAddr = mapped.find((a) => a.isDefault) || mapped[0];
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      } catch {
        // keep local state
      }
    })();

    return () => { cancelled = true; };
  }, [setSavedAddresses, setSelectedAddress]);
};

export const getDisplayAddress = ({ savedAddresses, selectedAddressId, liveLocation }) => {
  if (hasLiveGps(liveLocation)) {
    return {
      label: formatLocationLabel(liveLocation),
      city: liveLocation.city,
      latitude: liveLocation.latitude,
      longitude: liveLocation.longitude,
      source: 'live',
    };
  }

  const selected = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
  if (selected?.address) {
    return {
      label: selected.address,
      city: selected.city,
      latitude: selected.latitude,
      longitude: selected.longitude,
      source: 'saved',
    };
  }

  return {
    label: 'Tap to set delivery location',
    city: null,
    latitude: null,
    longitude: null,
    source: 'none',
  };
};
