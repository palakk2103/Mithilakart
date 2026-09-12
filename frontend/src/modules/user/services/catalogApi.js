import customerApi from '../../../shared/api/client';

export const getCategories = (params) => customerApi.get('/categories', { params });

export const getProducts = (params) => customerApi.get('/products', { params });

export const getProductById = (id) => customerApi.get(`/products/${id}`);

export const searchProducts = (params) => customerApi.get('/products/search', { params });

export const getCategoryProducts = (categoryId, params) =>
  customerApi.get(`/categories/${categoryId}/products`, { params });

export const getNearbyProducts = (params) =>
  customerApi.get('/maps/nearby/products', { params });

export const getProductReviews = (productId) =>
  customerApi.get(`/products/${productId}/reviews`);

export const getProductQuestions = (productId) =>
  customerApi.get(`/products/${productId}/questions`);

export const createProductReview = (productId, data) =>
  customerApi.post(`/products/${productId}/reviews`, data);

export const askProductQuestion = (productId, data) =>
  customerApi.post(`/products/${productId}/questions`, data);

export const getDeals = () => customerApi.get('/deals');

export const getOffers = () => customerApi.get('/offers');

