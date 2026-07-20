# 27 — TODOs and FIXMEs

## Source Code TODOs (49 items)

- **frontend/src/modules/seller/services/axiosInstance.js:9** — baseURL: '/api/seller', // TODO: Update with actual API base URL
- **frontend/src/modules/seller/services/axiosInstance.js:19** — // TODO: Get token from auth context/storage
- **frontend/src/modules/seller/services/sellerApi.js:29** — // TODO: return axiosInstance.post('/auth/login', credentials);
- **frontend/src/modules/seller/services/sellerApi.js:35** — // TODO: return axiosInstance.post('/auth/logout');
- **frontend/src/modules/seller/services/sellerApi.js:45** — // TODO: return axiosInstance.get('/dashboard');
- **frontend/src/modules/seller/services/sellerApi.js:51** — // TODO: return axiosInstance.get('/dashboard/stats');
- **frontend/src/modules/seller/services/sellerApi.js:61** — // TODO: return axiosInstance.get('/products', { params });
- **frontend/src/modules/seller/services/sellerApi.js:67** — // TODO: return axiosInstance.get(`/products/${id}`);
- **frontend/src/modules/seller/services/sellerApi.js:73** — // TODO: return axiosInstance.post('/products', data);
- **frontend/src/modules/seller/services/sellerApi.js:79** — // TODO: return axiosInstance.put(`/products/${id}`, data);
- **frontend/src/modules/seller/services/sellerApi.js:85** — // TODO: return axiosInstance.delete(`/products/${id}`);
- **frontend/src/modules/seller/services/sellerApi.js:91** — // TODO: return axiosInstance.post(`/products/${id}/duplicate`);
- **frontend/src/modules/seller/services/sellerApi.js:98** — // TODO: return axiosInstance.patch(`/products/${id}/status`, { status });
- **frontend/src/modules/seller/services/sellerApi.js:108** — // TODO: return axiosInstance.get('/orders', { params });
- **frontend/src/modules/seller/services/sellerApi.js:118** — // TODO: return axiosInstance.get(`/orders/${id}`);
- **frontend/src/modules/seller/services/sellerApi.js:124** — // TODO: return axiosInstance.patch(`/orders/${id}/status`, { status });
- **frontend/src/modules/seller/services/sellerApi.js:134** — // TODO: return axiosInstance.get('/returns', { params });
- **frontend/src/modules/seller/services/sellerApi.js:144** — // TODO: return axiosInstance.patch(`/returns/${id}/approve`);
- **frontend/src/modules/seller/services/sellerApi.js:150** — // TODO: return axiosInstance.patch(`/returns/${id}/reject`);
- **frontend/src/modules/seller/services/sellerApi.js:160** — // TODO: return axiosInstance.get('/customers', { params });
- **frontend/src/modules/seller/services/sellerApi.js:166** — // TODO: return axiosInstance.get(`/customers/${id}`);
- **frontend/src/modules/seller/services/sellerApi.js:176** — // TODO: return axiosInstance.get('/inventory');
- **frontend/src/modules/seller/services/sellerApi.js:182** — // TODO: return axiosInstance.patch(`/inventory/${id}/stock`, { quantity });
- **frontend/src/modules/seller/services/sellerApi.js:188** — // TODO: return axiosInstance.get(`/inventory/${id}/history`);
- **frontend/src/modules/seller/services/sellerApi.js:198** — // TODO: return axiosInstance.get('/reviews', { params });
- **frontend/src/modules/seller/services/sellerApi.js:204** — // TODO: return axiosInstance.post(`/reviews/${id}/reply`, { reply });
- **frontend/src/modules/seller/services/sellerApi.js:210** — // TODO: return axiosInstance.post(`/reviews/${id}/report`, { reason });
- **frontend/src/modules/seller/services/sellerApi.js:220** — // TODO: return axiosInstance.get('/coupons');
- **frontend/src/modules/seller/services/sellerApi.js:226** — // TODO: return axiosInstance.post('/coupons', data);
- **frontend/src/modules/seller/services/sellerApi.js:232** — // TODO: return axiosInstance.put(`/coupons/${id}`, data);
- **frontend/src/modules/seller/services/sellerApi.js:238** — // TODO: return axiosInstance.delete(`/coupons/${id}`);
- **frontend/src/modules/seller/services/sellerApi.js:248** — // TODO: return axiosInstance.get('/analytics/sales', { params: { range } });
- **frontend/src/modules/seller/services/sellerApi.js:254** — // TODO: return axiosInstance.get('/analytics/revenue');
- **frontend/src/modules/seller/services/sellerApi.js:260** — // TODO: return axiosInstance.get('/analytics/products');
- **frontend/src/modules/seller/services/sellerApi.js:266** — // TODO: return axiosInstance.get('/analytics/categories');
- **frontend/src/modules/seller/services/sellerApi.js:272** — // TODO: return axiosInstance.get('/analytics/customers');
- **frontend/src/modules/seller/services/sellerApi.js:287** — // TODO: return axiosInstance.get('/earnings');
- **frontend/src/modules/seller/services/sellerApi.js:293** — // TODO: return axiosInstance.get('/earnings/transactions', { params });
- **frontend/src/modules/seller/services/sellerApi.js:299** — // TODO: return axiosInstance.get('/earnings/settlements');
- **frontend/src/modules/seller/services/sellerApi.js:305** — // TODO: return axiosInstance.post('/earnings/payout', { amount });
- **frontend/src/modules/seller/services/sellerApi.js:315** — // TODO: return axiosInstance.get('/notifications');
- **frontend/src/modules/seller/services/sellerApi.js:321** — // TODO: return axiosInstance.patch(`/notifications/${id}/read`);
- **frontend/src/modules/seller/services/sellerApi.js:327** — // TODO: return axiosInstance.patch('/notifications/read-all');
- **frontend/src/modules/seller/services/sellerApi.js:337** — // TODO: return axiosInstance.get('/settings/profile');
- **frontend/src/modules/seller/services/sellerApi.js:343** — // TODO: return axiosInstance.put('/settings/profile', data);
- **frontend/src/modules/seller/services/sellerApi.js:349** — // TODO: return axiosInstance.put('/settings/bank', data);
- **frontend/src/modules/seller/services/sellerApi.js:355** — // TODO: return axiosInstance.put('/settings/password', data);
- **frontend/src/modules/seller/services/sellerApi.js:361** — // TODO: return axiosInstance.put('/settings/notifications', data);
- **frontend/src/shared/utils/priceFormatter.js:23** — * Safely formats any price value into Indian numbering format (₹XX,XX,XXX.XX or ₹XX,XX,XXX).

## sellerApi.js — Complete API Stub List

All endpoints in seller/services/sellerApi.js are stubbed with TODO comments:
- POST /auth/login, /auth/logout
- GET /dashboard, /dashboard/stats
- CRUD /products, PATCH /products/:id/status, POST /products/:id/duplicate
- GET /orders, GET /orders/:id, PATCH /orders/:id/status
- GET /returns, PATCH /returns/:id/approve, /reject
- GET /customers, GET /customers/:id
- GET /inventory, PATCH /inventory/:id/stock, GET /inventory/:id/history
- GET /reviews, POST /reviews/:id/reply, /report
- CRUD /coupons
- GET /analytics/sales, /revenue, /products, /categories, /customers
- GET /earnings, /earnings/transactions, /earnings/settlements, POST /earnings/payout
- GET /notifications, PATCH read endpoints
- GET/PUT /settings/profile, /bank, /password, /notifications

## authApi.js — Integration Comments
- POST /auth/send-phone-otp
- POST /auth/send-email-otp
- (verify endpoints implied)

## axiosInstance.js
- baseURL: '/api/seller' — TODO: Update with actual API base URL
- Request interceptor: TODO: Get token from auth context/storage
