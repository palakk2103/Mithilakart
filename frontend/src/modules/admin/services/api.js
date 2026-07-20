/**
 * Admin API Service Layer — Live backend integration
 */
import { adminApiClient, customerApi } from '../../../shared/api/client';
import { setTokens, setUser } from '../../../shared/api/tokenStorage';

const api = adminApiClient;

const asyncHandler = async (apiCall) => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'Request failed' };
  }
};

// Auth
export const authApi = {
  login: async (credentials) => {
    try {
      const result = await customerApi.post('/admin/auth/login', credentials);
      if (result?.tokens) {
        setTokens('admin', result.tokens);
        setUser('admin', result.admin);
      }
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error.message || 'Login failed' };
    }
  },
  logout: () => asyncHandler(() => customerApi.post('/admin/auth/logout', {
    refreshToken: localStorage.getItem('admin_refresh_token'),
  })),
  getProfile: () => asyncHandler(() => customerApi.get('/admin/auth/profile')),
  changePassword: (data) => asyncHandler(() => customerApi.put('/admin/auth/password', data)),
};

// Dashboard
export const dashboardApi = {
  getStats: () => asyncHandler(() => api.get('/dashboard/stats')),
  getRevenueChart: (period) => asyncHandler(() => api.get('/dashboard/revenue', { params: { period } })),
  getRecentOrders: () => asyncHandler(() => api.get('/dashboard/recent-orders')),
  getRecentActivities: () => asyncHandler(() => api.get('/dashboard/activities')),
};

// Users
export const usersApi = {
  getAll: (params) => asyncHandler(() => api.get('/users', { params })),
  getById: (id) => asyncHandler(() => api.get(`/users/${id}`)),
  block: (id) => asyncHandler(() => api.patch(`/users/${id}/block`)),
  unblock: (id) => asyncHandler(() => api.patch(`/users/${id}/unblock`)),
  suspend: (id) => asyncHandler(() => api.patch(`/users/${id}/suspend`)),
  getOrders: (id) => asyncHandler(() => api.get(`/users/${id}/orders`)),
  getWallet: (id) => asyncHandler(() => api.get(`/users/${id}/wallet`)),
  export: (params) => asyncHandler(() => api.get('/users/export', { params, responseType: 'blob' })),
};

// Vendors (backend uses /vendors)
export const sellersApi = {
  getAll: (params) => asyncHandler(() => api.get('/vendors', { params })),
  getById: (id) => asyncHandler(() => api.get(`/vendors/${id}`)),
  approve: (id) => asyncHandler(() => api.patch(`/vendors/${id}/approve`)),
  reject: (id, reason) => asyncHandler(() => api.patch(`/vendors/${id}/reject`, { reason })),
  suspend: (id) => asyncHandler(() => api.patch(`/vendors/${id}/suspend`)),
  activate: (id) => asyncHandler(() => api.patch(`/vendors/${id}/activate`)),
  getProducts: (id) => asyncHandler(() => api.get(`/vendors/${id}/products`)),
  getOrders: (id) => asyncHandler(() => api.get(`/vendors/${id}/orders`)),
  getEarnings: (id) => asyncHandler(() => api.get(`/vendors/${id}/earnings`)),
};

// Products
export const productsApi = {
  getAll: (params) => asyncHandler(() => api.get('/products', { params })),
  getById: (id) => asyncHandler(() => api.get(`/products/${id}`)),
  approve: (id) => asyncHandler(() => api.patch(`/products/${id}/approve`)),
  reject: (id, reason) => asyncHandler(() => api.patch(`/products/${id}/reject`, { reason })),
  delete: (id) => asyncHandler(() => api.delete(`/products/${id}`)),
  bulkAction: (ids, action) => asyncHandler(() => api.post('/products/bulk', { ids, action })),
};

// Orders
export const ordersApi = {
  getAll: (params) => asyncHandler(() => api.get('/orders', { params })),
  getById: (id) => asyncHandler(() => api.get(`/orders/${id}`)),
  updateStatus: (id, status) => asyncHandler(() => api.patch(`/orders/${id}/status`, { status })),
  getInvoice: (id) => asyncHandler(() => api.get(`/orders/${id}/invoice`, { responseType: 'blob' })),
};

// Returns
export const returnsApi = {
  getAll: (params) => asyncHandler(() => api.get('/operations/returns', { params })),
  getById: (id) => asyncHandler(() => api.get(`/operations/returns/${id}`)),
  approve: (id) => asyncHandler(() => api.patch(`/operations/returns/${id}/approve`)),
  reject: (id, reason) => asyncHandler(() => api.patch(`/operations/returns/${id}/reject`, { reason })),
};

// Refunds
export const refundsApi = {
  getAll: (params) => asyncHandler(() => api.get('/operations/refunds', { params })),
  getById: (id) => asyncHandler(() => api.get(`/operations/refunds/${id}`)),
  process: (data) => asyncHandler(() => api.post('/operations/refunds/process', data)),
};

// Categories
export const categoriesApi = {
  getAll: (params) => asyncHandler(() => api.get('/categories', { params })),
  create: (data) => asyncHandler(() => api.post('/categories', data)),
  update: (id, data) => asyncHandler(() => api.put(`/categories/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/categories/${id}`)),
};

// Banners / CMS
export const bannersApi = {
  getAll: () => asyncHandler(() => api.get('/banners')),
  create: (data) => asyncHandler(() => api.post('/banners', data)),
  update: (id, data) => asyncHandler(() => api.put(`/banners/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/banners/${id}`)),
};

export const chipsApi = {
  getAll: () => asyncHandler(() => api.get('/chips')),
  create: (data) => asyncHandler(() => api.post('/chips', data)),
  update: (id, data) => asyncHandler(() => api.put(`/chips/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/chips/${id}`)),
};

export const sectionsApi = {
  getAll: () => asyncHandler(() => api.get('/sections')),
  update: (sectionKey, data) => asyncHandler(() => api.put(`/sections/${sectionKey}`, data)),
  reorder: (data) => asyncHandler(() => api.patch('/sections/reorder', data)),
};

// Notifications
export const notificationsApi = {
  getTemplates: () => asyncHandler(() => api.get('/comms/notifications/templates')),
  send: (data) => asyncHandler(() => api.post('/comms/notifications/send', data)),
  upsertTemplate: (data) => asyncHandler(() => api.put('/comms/notifications/templates', data)),
};

// Reports
export const reportsApi = {
  getSalesReport: (params) => asyncHandler(() => api.get('/reports/sales', { params })),
  getSellerReport: (params) => asyncHandler(() => api.get('/reports/sellers', { params })),
  getUserReport: (params) => asyncHandler(() => api.get('/reports/users', { params })),
  getOrderReport: (params) => asyncHandler(() => api.get('/reports/orders', { params })),
  getInventoryReport: (params) => asyncHandler(() => api.get('/reports/inventory', { params })),
  getRefundReport: (params) => asyncHandler(() => api.get('/reports/refunds', { params })),
  exportReport: (type, params) => asyncHandler(() => api.get(`/reports/export/${type}`, { params, responseType: 'blob' })),
};

// Analytics (maps to dashboard/reports where dedicated analytics routes are absent)
export const analyticsApi = {
  getSalesAnalytics: (params) => asyncHandler(() => api.get('/reports/sales', { params })),
  getRevenueAnalytics: (params) => asyncHandler(() => api.get('/dashboard/revenue', { params })),
  getUserAnalytics: (params) => asyncHandler(() => api.get('/reports/users', { params })),
  getProductAnalytics: (params) => asyncHandler(() => api.get('/reports/inventory', { params })),
};

// Settings / Finance
export const settingsApi = {
  getAll: () => asyncHandler(() => api.get('/settings')),
  update: (data) => asyncHandler(() => api.put('/settings', data)),
  getCommission: () => asyncHandler(() => api.get('/finance/commission-rules')),
  updateCommission: (data) => asyncHandler(() => api.put('/settings/commission', data)),
};

export const financeApi = {
  getEarnings: (params) => asyncHandler(() => api.get('/finance/earnings', { params })),
  getTaxConfigs: () => asyncHandler(() => api.get('/finance/tax')),
  createTaxConfig: (data) => asyncHandler(() => api.post('/finance/tax', data)),
  updateTaxConfig: (id, data) => asyncHandler(() => api.put(`/finance/tax/${id}`, data)),
  deleteTaxConfig: (id) => asyncHandler(() => api.delete(`/finance/tax/${id}`)),
  getDeliveryCharges: () => asyncHandler(() => api.get('/finance/delivery-charges')),
  createDeliveryCharge: (data) => asyncHandler(() => api.post('/finance/delivery-charges', data)),
  updateDeliveryCharge: (id, data) => asyncHandler(() => api.put(`/finance/delivery-charges/${id}`, data)),
  deleteDeliveryCharge: (id) => asyncHandler(() => api.delete(`/finance/delivery-charges/${id}`)),
  getCommissionRules: () => asyncHandler(() => api.get('/finance/commission-rules')),
};

// Delivery partners
export const deliveryApi = {
  getAll: (params) => asyncHandler(() => api.get('/delivery', { params })),
  getById: (id) => asyncHandler(() => api.get(`/delivery/${id}`)),
  create: (data) => asyncHandler(() => api.post('/delivery', data)),
  approve: (id) => asyncHandler(() => api.patch(`/delivery/${id}/approve`)),
  reject: (id) => asyncHandler(() => api.patch(`/delivery/${id}/reject`)),
  suspend: (id) => asyncHandler(() => api.patch(`/delivery/${id}/suspend`)),
};

// Roles & Audit
export const rolesApi = {
  getAll: () => asyncHandler(() => api.get('/roles')),
  create: (data) => asyncHandler(() => api.post('/roles', data)),
  update: (id, data) => asyncHandler(() => api.put(`/roles/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/roles/${id}`)),
  getPermissions: () => asyncHandler(() => api.get('/roles/permissions')),
};

export const auditApi = {
  getLogs: (params) => asyncHandler(() => api.get('/audit/logs', { params })),
  getLoginHistory: (params) => asyncHandler(() => api.get('/audit/login-history', { params })),
};

// Support
export const supportApi = {
  getAll: (params) => asyncHandler(() => api.get('/support/tickets', { params })),
  getById: (id) => asyncHandler(() => api.get(`/support/tickets/${id}`)),
  reply: (id, message) => asyncHandler(() => api.post(`/support/tickets/${id}/reply`, { message })),
  close: (id) => asyncHandler(() => api.patch(`/support/tickets/${id}/close`)),
};

// Promotions
export const couponsApi = {
  getAll: (params) => asyncHandler(() => api.get('/coupons', { params })),
  create: (data) => asyncHandler(() => api.post('/coupons', data)),
  update: (id, data) => asyncHandler(() => api.put(`/coupons/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/coupons/${id}`)),
};

export const flashSalesApi = {
  getAll: () => asyncHandler(() => api.get('/flash-sales')),
  create: (data) => asyncHandler(() => api.post('/flash-sales', data)),
  update: (id, data) => asyncHandler(() => api.put(`/flash-sales/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/flash-sales/${id}`)),
  addProduct: (id, data) => asyncHandler(() => api.post(`/flash-sales/${id}/products`, data)),
};

export const featuredApi = {
  getAll: () => asyncHandler(() => api.get('/featured-products')),
  create: (data) => asyncHandler(() => api.post('/featured-products', data)),
  delete: (id) => asyncHandler(() => api.delete(`/featured-products/${id}`)),
};

export const payoutsApi = {
  getAll: (params) => asyncHandler(() => api.get('/payouts', { params })),
  updateStatus: (id, data) => asyncHandler(() => api.patch(`/payouts/${id}`, data)),
};

export const subAdminsApi = {
  getAll: (params) => asyncHandler(() => api.get('/sub-admins', { params })),
  create: (data) => asyncHandler(() => api.post('/sub-admins', data)),
  update: (id, data) => asyncHandler(() => api.put(`/sub-admins/${id}`, data)),
  delete: (id) => asyncHandler(() => api.delete(`/sub-admins/${id}`)),
};

// CMS
export const cmsApi = {
  getPage: (slug) => asyncHandler(() => api.get(`/cms/${slug}`)),
  updatePage: (slug, data) => asyncHandler(() => api.put(`/cms/${slug}`, data)),
  getLegal: (type) => asyncHandler(() => api.get(`/cms/legal/${type}`)),
  updateLegal: (type, data) => asyncHandler(() => api.put(`/cms/legal/${type}`, data)),
};

const adminApi = {
  auth: authApi,
  dashboard: dashboardApi,
  users: usersApi,
  sellers: sellersApi,
  products: productsApi,
  orders: ordersApi,
  returns: returnsApi,
  refunds: refundsApi,
  categories: categoriesApi,
  banners: bannersApi,
  chips: chipsApi,
  sections: sectionsApi,
  notifications: notificationsApi,
  reports: reportsApi,
  analytics: analyticsApi,
  settings: settingsApi,
  finance: financeApi,
  delivery: deliveryApi,
  roles: rolesApi,
  audit: auditApi,
  support: supportApi,
  cms: cmsApi,
  coupons: couponsApi,
  flashSales: flashSalesApi,
  featured: featuredApi,
  payouts: payoutsApi,
  subAdmins: subAdminsApi,
};

export default adminApi;
