import customerApi from '../api/client';

const coordFallback = (latitude, longitude) => ({
  latitude: Number(latitude),
  longitude: Number(longitude),
  shortLabel: `Near ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
  formattedAddress: `Near ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
  city: null,
  state: null,
  pincode: null,
  addressLine: null,
  placeId: null,
});

export const reverseGeocode = async (latitude, longitude) => {
  try {
    return await customerApi.get('/maps/reverse-geocode', {
      params: { lat: latitude, lng: longitude },
      timeout: 10000,
      skipAuthLogout: true,
    });
  } catch {
    return coordFallback(latitude, longitude);
  }
};

export const geocodeAddress = (payload) =>
  customerApi.post('/maps/geocode', payload);

export const getNearbySellers = (latitude, longitude, radiusKm = 25) =>
  customerApi.get('/maps/nearby/sellers', {
    params: { lat: latitude, lng: longitude, radiusKm },
  });

export const getNearbyProducts = (params) =>
  customerApi.get('/maps/nearby/products', { params });
