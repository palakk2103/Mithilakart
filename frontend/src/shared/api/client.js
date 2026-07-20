import axios from 'axios';
import { getTokens, clearTokens } from './tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function unwrapResponse(response) {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) {
      const message = body.error?.message || 'Request failed';
      const err = new Error(message);
      err.code = body.error?.code;
      err.details = body.error?.details;
      err.status = response.status;
      throw err;
    }
    return body.data;
  }
  return body;
}

function extractError(error) {
  const data = error.response?.data;
  if (data?.error?.message) {
    const err = new Error(data.error.message);
    err.code = data.error.code;
    err.details = data.error.details;
    err.status = error.response?.status;
    return err;
  }
  if (data?.message) {
    return new Error(data.message);
  }
  return error;
}

export function createApiClient({ portal, baseURL = API_BASE, onUnauthorized } = {}) {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    if (portal) {
      const { accessToken } = getTokens(portal);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      if (response.status === 204) return null;
      return unwrapResponse(response);
    },
    (error) => {
      const status = error.response?.status;
      if (status === 401 && portal) {
        clearTokens(portal);
        if (onUnauthorized) onUnauthorized();
      }
      return Promise.reject(extractError(error));
    }
  );

  return instance;
}

export const customerApi = createApiClient({
  portal: 'customer',
  onUnauthorized: () => {
    if (window.location.pathname.startsWith('/profile') || window.location.pathname.startsWith('/checkout')) {
      window.location.href = '/login';
    }
  },
});

export const sellerApiClient = createApiClient({
  portal: 'seller',
  baseURL: import.meta.env.VITE_SELLER_API_BASE_URL || '/api/v1/seller',
  onUnauthorized: () => {
    window.location.href = '/seller/login';
  },
});

export const adminApiClient = createApiClient({
  portal: 'admin',
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || '/api/v1/admin',
  onUnauthorized: () => {
    window.location.href = '/admin/auth';
  },
});

export const deliveryApiClient = createApiClient({
  portal: 'delivery',
  baseURL: import.meta.env.VITE_DELIVERY_API_BASE_URL || '/api/v1/delivery',
  onUnauthorized: () => {
    window.location.href = '/delivery/auth';
  },
});

export default customerApi;
