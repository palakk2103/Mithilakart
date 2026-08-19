import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart } from '../services/cartApi';
import { mapCartItem } from './mappers';

export const dispatchCartUpdated = () => {
  window.dispatchEvent(new Event('cartUpdated'));
};

export const fetchCartItems = async () => {
  try {
    const cart = await getCart();
    const items = (cart?.items || []).map(mapCartItem);
    return { cart, items };
  } catch {
    return { cart: null, items: [] };
  }
};

export const fetchCartCount = async () => {
  const { items } = await fetchCartItems();
  return items.reduce((acc, item) => acc + (item.qty || 1), 0);
};

const normalizeCommerceFlow = (flow) => {
  if (!flow) return 'standard';
  if (flow === 'quickshop' || flow === 'quick_shop') return 'quick_shop';
  if (flow === 'freshgrocery' || flow === 'fresh_grocery') return 'fresh_grocery';
  if (flow === 'mithilak' || flow === 'mithilakart') return 'mithilak';
  return flow;
};

export const addProductToCart = async (product, quantity = 1, commerceFlow) => {
  const listingId = product.listingId;
  const productId = product.productId || product.id || product._id;
  const flow = normalizeCommerceFlow(commerceFlow || product.commerceFlow || getCommerceFlow());
  const marketplaceTab = product.marketplaceTab || (flow === 'quick_shop' ? 'quick_shop' : flow === 'fresh_grocery' ? 'groceries_fresh' : getMarketplaceTab());

  if (listingId) {
    await addCartItem({ listingId, marketplaceTab, quantity, commerceFlow: flow });
  } else if (productId) {
    await addCartItem({
      productId,
      variantId: product.variantId || null,
      quantity,
      commerceFlow: flow,
      marketplaceTab,
    });
  } else {
    throw new Error('Product ID is required');
  }

  dispatchCartUpdated();
};

export const updateCartItemQuantity = async (item, delta) => {
  const cartId = item.cartId || item.itemKey || item.id;
  const newQty = Math.max(1, (item.qty || item.quantity || 1) + delta);
  await updateCartItem(cartId, { quantity: newQty });
  dispatchCartUpdated();
  return newQty;
};

export const removeCartItemById = async (cartId) => {
  await removeCartItem(cartId);
  dispatchCartUpdated();
};

export { clearCart };

export const getCommerceFlow = () => {
  if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'fresh_grocery';
  if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quick_shop';
  return 'standard';
};

const FLOW_TO_TAB = {
  standard: 'mithilakart',
  mithilak: 'mithilak',
  quick_shop: 'quick_shop',
  fresh_grocery: 'groceries_fresh',
};

export const getMarketplaceTab = () => FLOW_TO_TAB[getCommerceFlow()] || 'mithilakart';
