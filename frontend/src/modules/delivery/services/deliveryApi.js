import { deliveryApiClient, customerApi } from '../../../shared/api/client';
import { setTokens, setUser } from '../../../shared/api/tokenStorage';

const api = deliveryApiClient;

export const sendOtp = (countryCode, phone) =>
  customerApi.post('/delivery/auth/send-otp', { countryCode, phone });

export const verifyOtp = async (countryCode, phone, otp) => {
  const result = await customerApi.post('/delivery/auth/verify-otp', {
    countryCode,
    phone,
    otp,
  });
  if (result?.tokens) {
    setTokens('delivery', result.tokens);
    setUser('delivery', result.partner ?? result.user);
  }
  return result;
};

export const signupDelivery = (data) => customerApi.post('/delivery/auth/signup', data);

export const logoutDelivery = async () => {
  const refreshToken = localStorage.getItem('delivery_refresh_token');
  try {
    await customerApi.post('/delivery/auth/logout', { refreshToken });
  } catch {
    // proceed
  }
};

export const getDashboard = () => api.get('/dashboard');

export const setOnlineStatus = (isOnline) => api.patch('/status', { isOnline });

export const getOrders = (params) => api.get('/orders', { params });

export const getOrderById = (id) => api.get(`/orders/${id}`);

export const acceptOrder = (id) => api.post(`/orders/${id}/accept`);

export const markPickup = (id, otp) => api.post(`/orders/${id}/pickup`, { otp });

export const markDelivered = (id, otp) => api.post(`/orders/${id}/deliver`, { otp });

export const rejectOrder = (id, reason) => api.post(`/orders/${id}/reject`, { reason });

export const markDeliveryFailed = (id, reason) => api.post(`/orders/${id}/failed`, { reason });

export const updateLocation = (latitude, longitude) => api.patch('/location', { latitude, longitude });

export const registerDeliveryDevice = (deviceId, fcmToken) =>
  api.post('/devices', { deviceId, fcmToken, platform: 'web' });

export const getEarnings = (params) => api.get('/earnings', { params });

export const getProfile = () => api.get('/profile');

export const updateProfile = (data) => api.patch('/profile', data);

export const createSupportTicket = (data) => customerApi.post('/support/tickets', data);
