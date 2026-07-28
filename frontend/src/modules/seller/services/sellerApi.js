/**
 * Seller Module — Live API Service Layer
 */
import { sellerApiClient, customerApi, createApiClient } from '../../../shared/api/client';
import { setTokens, setUser } from '../../../shared/api/tokenStorage';

const api = sellerApiClient;

function mapListResponse(data, itemsKey, fallbackKey = 'items') {
  if (Array.isArray(data)) return { [itemsKey]: data, total: data.length };
  const items = data?.[itemsKey] ?? data?.[fallbackKey] ?? data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? items.length;
  return { [itemsKey]: items, total };
}

function withId(record) {
  if (!record || typeof record !== 'object') return record;
  return {
    ...record,
    id: record.id || record._id,
  };
}

function mapSellerNotification(note) {
  if (!note) return note;
  return {
    ...withId(note),
    body: note.message || note.body || '',
    read: note.isRead ?? note.read ?? false,
  };
}

// AUTH
export const loginSeller = async ({ email, password }) => {
  const result = await customerApi.post('/seller/auth/login', { email, password });
  if (result?.tokens) {
    setTokens('seller', result.tokens);
    setUser('seller', result.seller);
  }
  return { token: result?.tokens?.accessToken, seller: result?.seller };
};

export const sendSellerPhoneOtp = (countryCode, phone) =>
  customerApi.post('/seller/auth/send-phone-otp', { countryCode, phone });

export const registerSeller = async (data) => {
  return customerApi.post('/seller/auth/register', data);
};

export const logoutSeller = async () => {
  const refreshToken = localStorage.getItem('seller_refresh_token');
  try {
    await customerApi.post('/seller/auth/logout', { refreshToken });
  } catch {
    // proceed
  }
  return { success: true };
};

// DASHBOARD
export const getDashboard = async () => {
  const data = await api.get('/dashboard');
  return {
    todayOrders: data?.pendingOrders ?? 0,
    revenue: data?.totalRevenue ?? 0,
    walletBalance: data?.totalEarnings ?? 0,
    averageRating: data?.averageRating ?? 0,
    pendingOrders: data?.pendingOrders ?? 0,
    completedOrders: data?.totalOrders ?? 0,
    cancelledOrders: 0,
    returns: data?.pendingReturns ?? 0,
    totalProducts: data?.productCount ?? 0,
    ...data,
  };
};

export const getDashboardStats = getDashboard;

// PRODUCTS
export const getProducts = async (params) => {
  const data = await api.get('/products', { params });
  return mapListResponse(data, 'products');
};

export const getProduct = async (id) => api.get(`/products/${id}`);

export const createProduct = async (data) => api.post('/products', data);

export const updateProduct = async (id, data) => api.put(`/products/${id}`, data);

export const deleteProduct = async (id) => api.delete(`/products/${id}`);

export const duplicateProduct = async (id) => api.post(`/products/${id}/duplicate`);

export const toggleProductStatus = async (id, status) =>
  api.patch(`/products/${id}/status`, { status });

// ORDERS
export const getOrders = async (params) => {
  const data = await api.get('/orders', { params });
  const mapped = mapListResponse(data, 'orders');
  return {
    ...mapped,
    orders: (mapped.orders || []).map(withId),
  };
};

export const getOrder = async (id) => withId(await api.get(`/orders/${id}`));

export const updateOrderStatus = async (id, status) =>
  api.patch(`/orders/${id}/status`, { status });

const shippingApiClient = createApiClient({
  portal: 'seller',
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
});

export const getShipmentLabel = async (orderId) =>
  shippingApiClient.get(`/shipping/orders/${orderId}/label`);

function mapSellerReturn(record) {
  const statusMap = {
    requested: 'pending',
    seller_approved: 'approved',
    admin_approved: 'approved',
    refunded: 'approved',
    seller_rejected: 'rejected',
    admin_rejected: 'rejected',
    cancelled: 'rejected',
  };
  const item = withId(record);
  return {
    ...item,
    status: statusMap[item.status] || item.status,
    rawStatus: item.status,
    orderId: item.orderId,
    productTitle: item.productName || item.productTitle || 'Product',
    customerName: item.customerName || item.userName || 'Customer',
    customer: { name: item.customerName || item.userName || 'Customer' },
    refundAmount: item.refundAmount ?? item.amount ?? 0,
    requestedAt: item.createdAt,
  };
}

// RETURNS
export const getReturns = async (params) => {
  const data = await api.get('/returns', { params });
  const mapped = mapListResponse(data, 'returns');
  return {
    ...mapped,
    returns: (mapped.returns || []).map(mapSellerReturn),
  };
};

export const approveReturn = async (id) => api.patch(`/returns/${id}/approve`);

export const rejectReturn = async (id) => api.patch(`/returns/${id}/reject`);

// CUSTOMERS
export const getCustomers = async (params) => {
  const data = await api.get('/customers', { params });
  return mapListResponse(data, 'customers');
};

export const getCustomer = async (id) => api.get(`/customers/${id}`);

// INVENTORY
export const getInventory = async () => {
  const data = await api.get('/inventory');
  const products = (data?.products ?? (Array.isArray(data) ? data : [])).map(withId);
  return {
    products,
    alerts: data?.alerts ?? [],
    history: data?.history ?? [],
  };
};

export const updateStock = async (id, quantity) =>
  api.patch(`/inventory/${id}/stock`, { quantity });

export const getStockHistory = async (id) => api.get(`/inventory/${id}/history`);

// REVIEWS
export const getReviews = async (params) => {
  const data = await api.get('/reviews', { params });
  return mapListResponse(data, 'reviews');
};

export const replyToReview = async (id, reply) =>
  api.post(`/reviews/${id}/reply`, { reply });

export const reportReview = async (id, reason) =>
  api.post(`/reviews/${id}/report`, { reason });

// COUPONS
export const getCoupons = async () => {
  const data = await api.get('/coupons');
  return mapListResponse(data, 'coupons');
};

export const createCoupon = async (data) => api.post('/coupons', data);

export const updateCoupon = async (id, data) => api.put(`/coupons/${id}`, data);

export const deleteCoupon = async (id) => api.delete(`/coupons/${id}`);

// ANALYTICS
export const getSalesAnalytics = async (range) =>
  api.get('/analytics/sales', { params: { range } });

export const getRevenueAnalytics = async () => api.get('/analytics/revenue');

export const getProductAnalytics = async () => api.get('/analytics/products');

export const getCategoryAnalytics = async () => api.get('/analytics/categories');

export const getCustomerAnalytics = async () => api.get('/analytics/customers');

// EARNINGS
export const getEarnings = async () => {
  const data = await api.get('/earnings');
  return {
    ...data,
    availableBalance: data?.balance ?? data?.availableBalance ?? 0,
    walletBalance: data?.balance ?? data?.walletBalance ?? 0,
    totalWithdrawn: data?.totalWithdrawn ?? 0,
    totalEarnings: data?.totalEarnings ?? 0,
    bankDetails: data?.bankDetails || {},
    recentTransactions: data?.recentTransactions || [],
  };
};

export const getTransactions = async (params) => {
  const data = await api.get('/earnings/transactions', { params });
  return mapListResponse(data, 'transactions');
};

export const getSettlements = async () => {
  const data = await api.get('/earnings/settlements');
  return mapListResponse(data, 'settlements');
};

export const requestPayout = async (amount) =>
  api.post('/earnings/payout', { amount });

// MARKETPLACE LISTINGS (CR-001)
export const getSellerListings = (params) => api.get('/listings', { params });

export const createProductListing = (productId, data) =>
  api.post(`/products/${productId}/listings`, data);

export const getProductListings = (productId) =>
  api.get(`/products/${productId}/listings`);

export const updateProductListing = (listingId, data) =>
  api.put(`/listings/${listingId}`, data);

export const publishProductListing = (listingId) =>
  api.patch(`/listings/${listingId}/publish`);

// NOTIFICATIONS
export const getNotifications = async () => {
  const data = await api.get('/notifications');
  const raw = data?.notifications ?? data?.items ?? (Array.isArray(data) ? data : []);
  const notifications = raw.map(mapSellerNotification);
  return {
    notifications,
    unreadCount: data?.unreadCount ?? notifications.filter((n) => !n.read).length,
  };
};

export const markAsRead = async (id) => api.patch(`/notifications/${id}/read`);

export const markAllRead = async () => api.patch('/notifications/read-all');

// SETTINGS
export const getProfile = async () => api.get('/settings/profile');

export const updateProfile = async (data) => api.put('/settings/profile', data);

export const updateBankDetails = async (data) => api.put('/settings/bank', data);

export const changePassword = async (data) => api.put('/settings/password', data);

export const updateNotificationPrefs = async (data) =>
  api.put('/settings/notifications', data);
