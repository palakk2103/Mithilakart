import customerApi from '../../../shared/api/client';

export const getCart = () => customerApi.get('/cart');

export const addCartItem = (data) => customerApi.post('/cart/items', data);

export const updateCartItem = (itemId, data) =>
  customerApi.patch(`/cart/items/${itemId}`, data);

export const removeCartItem = (itemId) => customerApi.delete(`/cart/items/${itemId}`);

export const clearCart = () => customerApi.delete('/cart');
