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
        // Keep the customer's chosen address if it still exists; otherwise fall back to default.
        const currentId = useAccountStore.getState().selectedAddressId;
        if (currentId != null && mapped.some((a) => String(a.id) === String(currentId))) return;
        const defaultAddr = mapped.find((a) => a.isDefault) || mapped[0];
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      } catch {
        // keep local state
      }
    })();

    return () => { cancelled = true; };
  }, [setSavedAddresses, setSelectedAddress]);
};

export const findSelectedAddress = (savedAddresses = [], selectedAddressId) =>
  savedAddresses.find((a) => String(a.id) === String(selectedAddressId)) || savedAddresses[0];

export const getDisplayAddress = ({
  savedAddresses,
  selectedAddressId,
  liveLocation,
  deliveryMode = useAccountStore.getState().deliveryMode,
}) => {
  const preferSaved = deliveryMode === 'saved' && savedAddresses?.length > 0;
  if (!preferSaved && hasLiveGps(liveLocation)) {
    return {
      label: formatLocationLabel(liveLocation),
      city: liveLocation.city,
      latitude: liveLocation.latitude,
      longitude: liveLocation.longitude,
      source: 'live',
    };
  }

  const selected = findSelectedAddress(savedAddresses, selectedAddressId);
  if (selected?.address) {
    return {
      label: selected.address,
      city: selected.city,
      latitude: selected.latitude,
      longitude: selected.longitude,
      source: 'saved',
      addressId: selected.id,
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
