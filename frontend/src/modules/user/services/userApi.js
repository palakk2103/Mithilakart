import customerApi from '../../../shared/api/client';

export const getProfile = () => customerApi.get('/users/me');

export const updateProfile = (data) => customerApi.put('/users/me', data);

export const getAddresses = () => customerApi.get('/users/me/addresses');

export const createAddress = (data) => customerApi.post('/users/me/addresses', data);

export const updateAddress = (id, data) => customerApi.put(`/users/me/addresses/${id}`, data);

export const deleteAddress = (id) => customerApi.delete(`/users/me/addresses/${id}`);

export const setDefaultAddress = (id) => customerApi.patch(`/users/me/addresses/${id}/default`);

export const getSavedCards = () => customerApi.get('/users/me/cards');

export const createCard = (data) => customerApi.post('/users/me/cards', data);

export const updateCard = (id, data) => customerApi.put(`/users/me/cards/${id}`, data);

export const deleteCard = (id) => customerApi.delete(`/users/me/cards/${id}`);

export const setDefaultCard = (id) => customerApi.patch(`/users/me/cards/${id}/default`);

export const getWallet = () => customerApi.get('/users/me/wallet');

export const getWalletTransactions = (params) =>
  customerApi.get('/users/me/wallet/transactions', { params });

export const getMyReturns = (params) => customerApi.get('/users/me/returns', { params });

export const getWishlist = () => customerApi.get('/users/me/wishlist');

export const addToWishlist = (productId) =>
  customerApi.post('/users/me/wishlist', { productId });

export const removeFromWishlist = (productId) =>
  customerApi.delete(`/users/me/wishlist/${productId}`);

export const getMyReviews = (params) => customerApi.get('/users/me/reviews', { params });

export const getMyQuestions = (params) => customerApi.get('/users/me/questions', { params });

export const getMyCoupons = () => customerApi.get('/users/me/coupons');

export const updateNotificationPreferences = (data) =>
  customerApi.put('/users/me/notification-preferences', data);

export const search = (params) => customerApi.get('/search', { params });

export const getDeals = (params) => customerApi.get('/deals', { params });

export const getOffers = (params) => customerApi.get('/offers', { params });

export const getNotifications = (params) =>
  customerApi.get('/notifications', { params });

export const createSupportTicket = (data) => customerApi.post('/support/tickets', data);

export const getSupportTickets = (params) => customerApi.get('/support/tickets', { params });
