import customerApi from '../../../shared/api/client';

// Every cart call names the shopping tab it acts on. Each tab has its own
// cart on the server, so the tab is part of the address of the cart.
export const getCart = (marketplaceTab, couponCode, tip) =>
  customerApi.get('/cart', {
    params: (marketplaceTab || couponCode || tip)
      ? { ...(marketplaceTab ? { marketplaceTab } : {}), ...(couponCode ? { couponCode } : {}), ...(tip > 0 ? { tip } : {}) }
      : undefined,
  });

/** CART-1 rails: recommendations for the tab's cart. */
export const getCartRecommendations = (marketplaceTab, { cart = [], recent = [] } = {}) =>
  customerApi.get('/cart/recommendations', {
    params: { marketplaceTab, ...(cart.length ? { cart: cart.join(',') } : {}), ...(recent.length ? { recent: recent.join(',') } : {}) },
  });

/** One rail in full ("View All"); `sub` picks one of its tabs. */
export const getCartRecommendationRail = (railKey, marketplaceTab, { sub, cart = [], recent = [] } = {}) =>
  customerApi.get(`/cart/recommendations/${railKey}`, {
    params: { marketplaceTab, ...(sub ? { sub } : {}), ...(cart.length ? { cart: cart.join(',') } : {}), ...(recent.length ? { recent: recent.join(',') } : {}) },
  });

/** CART-3: coupons with Apply / Locked state for this cart value. */
export const getCouponOffers = (subtotal) => customerApi.get('/coupons/offers', { params: { subtotal } });

/** CART-1: admin banners for the cart carousel. */
export const getCartBanners = (commerceFlow) => customerApi.get('/storefront/banners', { params: { commerceFlow, placement: 'cart' } });

export const addCartItem = (data) => customerApi.post('/cart/items', data);

export const updateCartItem = (itemId, data) =>
  customerApi.patch(`/cart/items/${itemId}`, data);

export const removeCartItem = (itemId, marketplaceTab) =>
  customerApi.delete(`/cart/items/${itemId}`, { params: marketplaceTab ? { marketplaceTab } : undefined });

export const clearCart = (marketplaceTab) =>
  customerApi.delete('/cart', { params: marketplaceTab ? { marketplaceTab } : undefined });
