import axios from 'axios';
import { getTokens, setTokens, clearTokens } from './tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const REFRESH_PATHS = {
  customer: '/auth/refresh',
  seller: '/auth/refresh',
  admin: '/auth/refresh',
  delivery: '/auth/refresh',
};

const refreshInflight = {};

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

async function refreshPortalTokens(portal, baseURL) {
  if (refreshInflight[portal]) {
    return refreshInflight[portal];
  }

  refreshInflight[portal] = (async () => {
    const { refreshToken } = getTokens(portal);
    if (!refreshToken) {
      throw new Error('Missing refresh token');
    }

    const response = await axios.post(
      `${baseURL}${REFRESH_PATHS[portal]}`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    const data = unwrapResponse(response);
    const tokens = data?.tokens || data;
    if (!tokens?.accessToken) {
      throw new Error('Refresh response missing access token');
    }

    setTokens(portal, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || refreshToken,
    });

    return tokens.accessToken;
  })();

  try {
    return await refreshInflight[portal];
  } finally {
    delete refreshInflight[portal];
  }
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
    async (error) => {
      const status = error.response?.status;
      const config = error.config || {};
      const skipAuthLogout = config.skipAuthLogout === true;

      if (status === 401 && portal && !skipAuthLogout) {
        const isRefreshCall = config.url?.includes('/auth/refresh');
        const canRetry = !config._authRetried && !isRefreshCall;

        if (canRetry) {
          try {
            const newAccessToken = await refreshPortalTokens(portal, baseURL);
            config._authRetried = true;
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };
            const retryResponse = await instance.request(config);
            return retryResponse;
          } catch {
            clearTokens(portal);
            if (onUnauthorized) onUnauthorized();
          }
        } else {
          clearTokens(portal);
          if (onUnauthorized) onUnauthorized();
        }
      }

      return Promise.reject(extractError(error));
    }
  );

  return instance;
}

export const customerApi = createApiClient({
  portal: 'customer',
  onUnauthorized: () => {
    window.dispatchEvent(new Event('customer-auth-changed'));
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
