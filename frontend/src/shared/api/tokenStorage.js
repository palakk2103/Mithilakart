const PORTAL_KEYS = {
  customer: {
    access: 'customer_access_token',
    refresh: 'customer_refresh_token',
    user: 'customer_user',
    legacyAuth: 'isAuthenticated',
  },
  seller: {
    access: 'seller_token',
    refresh: 'seller_refresh_token',
    user: 'seller_data',
  },
  admin: {
    access: 'adminToken',
    refresh: 'admin_refresh_token',
    user: 'admin_user',
    legacyAuth: 'isAdminAuthenticated',
  },
  delivery: {
    access: 'delivery_access_token',
    refresh: 'delivery_refresh_token',
    user: 'delivery_user',
    legacyAuth: 'isDeliveryAuthenticated',
  },
};

export function getTokens(portal) {
  const keys = PORTAL_KEYS[portal];
  if (!keys) return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem(keys.access),
    refreshToken: localStorage.getItem(keys.refresh),
  };
}

export function setTokens(portal, { accessToken, refreshToken }) {
  const keys = PORTAL_KEYS[portal];
  if (!keys) return;
  if (accessToken) localStorage.setItem(keys.access, accessToken);
  if (refreshToken) localStorage.setItem(keys.refresh, refreshToken);
  if (keys.legacyAuth) localStorage.setItem(keys.legacyAuth, 'true');
  if (portal === 'customer') {
    window.dispatchEvent(new Event('customer-auth-changed'));
  }
}

export function clearTokens(portal) {
  const keys = PORTAL_KEYS[portal];
  if (!keys) return;
  localStorage.removeItem(keys.access);
  localStorage.removeItem(keys.refresh);
  localStorage.removeItem(keys.user);
  if (keys.legacyAuth) localStorage.removeItem(keys.legacyAuth);
  if (portal === 'customer') {
    window.dispatchEvent(new Event('customer-auth-changed'));
  }
}

export function getUser(portal) {
  const keys = PORTAL_KEYS[portal];
  if (!keys) return null;
  const raw = localStorage.getItem(keys.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(portal, user) {
  const keys = PORTAL_KEYS[portal];
  if (!keys || !user) return;
  localStorage.setItem(keys.user, JSON.stringify(user));
}

export function isAuthenticated(portal) {
  const { accessToken } = getTokens(portal);
  return Boolean(accessToken);
}
