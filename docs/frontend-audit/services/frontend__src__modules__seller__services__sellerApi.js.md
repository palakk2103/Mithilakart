# File Audit: frontend/src/modules/seller/services/sellerApi.js

| Property | Value |
|----------|-------|
| Lines | 364 |
| Extension | .js |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `loginSeller`
- `logoutSeller`
- `getDashboard`
- `getDashboardStats`
- `getProducts`
- `getProduct`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `duplicateProduct`
- `toggleProductStatus`
- `getOrders`
- `getOrder`
- `updateOrderStatus`
- `getReturns`
- `approveReturn`
- `rejectReturn`
- `getCustomers`
- `getCustomer`
- `getInventory`
- `updateStock`
- `getStockHistory`
- `getReviews`
- `replyToReview`
- `reportReview`
- `getCoupons`
- `createCoupon`
- `updateCoupon`
- `deleteCoupon`
- `getSalesAnalytics`
- `getRevenueAnalytics`
- `getProductAnalytics`
- `getCategoryAnalytics`
- `getCustomerAnalytics`
- `getEarnings`
- `getTransactions`
- `getSettlements`
- `requestPayout`
- `getNotifications`
- `markAsRead`
- `markAllRead`
- `getProfile`
- `updateProfile`
- `updateBankDetails`
- `changePassword`
- `updateNotificationPrefs`

## Imports (2)

- `./axiosInstance`
- `../utils/dummyData`

## API References

- `/auth/login`
- `/auth/logout`
- `/dashboard`
- `/dashboard/stats`
- `/products`
- `/products/${id}`
- `/products/${id}/duplicate`
- `/products/${id}/status`
- `/orders`
- `/orders/${id}`
- `/orders/${id}/status`
- `/returns`
- `/returns/${id}/approve`
- `/returns/${id}/reject`
- `/customers`
- `/customers/${id}`
- `/inventory`
- `/inventory/${id}/stock`
- `/inventory/${id}/history`
- `/reviews`
- `/reviews/${id}/reply`
- `/reviews/${id}/report`
- `/coupons`
- `/coupons/${id}`
- `/analytics/sales`
- `/analytics/revenue`
- `/analytics/products`
- `/analytics/categories`
- `/analytics/customers`
- `/earnings`
- `/earnings/transactions`
- `/earnings/settlements`
- `/earnings/payout`
- `/notifications`
- `/notifications/${id}/read`
- `/notifications/read-all`
- `/settings/profile`
- `/settings/bank`
- `/settings/password`
- `/settings/notifications`

## TODOs / FIXMEs

- L29: // TODO: return axiosInstance.post('/auth/login', credentials);
- L35: // TODO: return axiosInstance.post('/auth/logout');
- L45: // TODO: return axiosInstance.get('/dashboard');
- L51: // TODO: return axiosInstance.get('/dashboard/stats');
- L61: // TODO: return axiosInstance.get('/products', { params });
- L67: // TODO: return axiosInstance.get(`/products/${id}`);
- L73: // TODO: return axiosInstance.post('/products', data);
- L79: // TODO: return axiosInstance.put(`/products/${id}`, data);
- L85: // TODO: return axiosInstance.delete(`/products/${id}`);
- L91: // TODO: return axiosInstance.post(`/products/${id}/duplicate`);
- L98: // TODO: return axiosInstance.patch(`/products/${id}/status`, { status });
- L108: // TODO: return axiosInstance.get('/orders', { params });
- L118: // TODO: return axiosInstance.get(`/orders/${id}`);
- L124: // TODO: return axiosInstance.patch(`/orders/${id}/status`, { status });
- L134: // TODO: return axiosInstance.get('/returns', { params });
- L144: // TODO: return axiosInstance.patch(`/returns/${id}/approve`);
- L150: // TODO: return axiosInstance.patch(`/returns/${id}/reject`);
- L160: // TODO: return axiosInstance.get('/customers', { params });
- L166: // TODO: return axiosInstance.get(`/customers/${id}`);
- L176: // TODO: return axiosInstance.get('/inventory');
- L182: // TODO: return axiosInstance.patch(`/inventory/${id}/stock`, { quantity });
- L188: // TODO: return axiosInstance.get(`/inventory/${id}/history`);
- L198: // TODO: return axiosInstance.get('/reviews', { params });
- L204: // TODO: return axiosInstance.post(`/reviews/${id}/reply`, { reply });
- L210: // TODO: return axiosInstance.post(`/reviews/${id}/report`, { reason });
- L220: // TODO: return axiosInstance.get('/coupons');
- L226: // TODO: return axiosInstance.post('/coupons', data);
- L232: // TODO: return axiosInstance.put(`/coupons/${id}`, data);
- L238: // TODO: return axiosInstance.delete(`/coupons/${id}`);
- L248: // TODO: return axiosInstance.get('/analytics/sales', { params: { range } });
- L254: // TODO: return axiosInstance.get('/analytics/revenue');
- L260: // TODO: return axiosInstance.get('/analytics/products');
- L266: // TODO: return axiosInstance.get('/analytics/categories');
- L272: // TODO: return axiosInstance.get('/analytics/customers');
- L287: // TODO: return axiosInstance.get('/earnings');
- L293: // TODO: return axiosInstance.get('/earnings/transactions', { params });
- L299: // TODO: return axiosInstance.get('/earnings/settlements');
- L305: // TODO: return axiosInstance.post('/earnings/payout', { amount });
- L315: // TODO: return axiosInstance.get('/notifications');
- L321: // TODO: return axiosInstance.patch(`/notifications/${id}/read`);
- L327: // TODO: return axiosInstance.patch('/notifications/read-all');
- L337: // TODO: return axiosInstance.get('/settings/profile');
- L343: // TODO: return axiosInstance.put('/settings/profile', data);
- L349: // TODO: return axiosInstance.put('/settings/bank', data);
- L355: // TODO: return axiosInstance.put('/settings/password', data);
- L361: // TODO: return axiosInstance.put('/settings/notifications', data);

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

This file references 40 API endpoint(s). See API_Requirements.md.
