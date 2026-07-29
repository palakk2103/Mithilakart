import customerApi from '../../../shared/api/client';

export const getOrders = (params) => customerApi.get('/orders', { params });

export const getOrderById = (id) => customerApi.get(`/orders/${id}`);

export const createOrder = (data) => customerApi.post('/orders', data);

export const cancelOrder = (id, data) => customerApi.post(`/orders/${id}/cancel`, data);

export const getOrderTracking = (id) => customerApi.get(`/orders/${id}/tracking`);

export const createReturn = (orderId, data) =>
  customerApi.post(`/orders/${orderId}/returns`, data);

export const initiatePayment = (data) => customerApi.post('/payments/initiate', data);

export const verifyPayment = (data) => customerApi.post('/payments/verify', data);

export const validateCoupon = (data) => customerApi.post('/coupons/validate', data);
