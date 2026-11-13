import customerApi from '../../../shared/api/client';

// Every cart call names the shopping tab it acts on. Each tab has its own
// cart on the server, so the tab is part of the address of the cart.
export const getCart = (marketplaceTab) =>
  customerApi.get('/cart', { params: marketplaceTab ? { marketplaceTab } : undefined });

export const addCartItem = (data) => customerApi.post('/cart/items', data);

export const updateCartItem = (itemId, data) =>
  customerApi.patch(`/cart/items/${itemId}`, data);

export const removeCartItem = (itemId, marketplaceTab) =>
  customerApi.delete(`/cart/items/${itemId}`, { params: marketplaceTab ? { marketplaceTab } : undefined });

export const clearCart = (marketplaceTab) =>
  customerApi.delete('/cart', { params: marketplaceTab ? { marketplaceTab } : undefined });
