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

export const addProductToCart = async (product, quantity = 1, commerceFlow) => {
  const productId = product.id || product._id || product.productId;
  if (!productId) throw new Error('Product ID is required');

  await addCartItem({
    productId,
    variantId: product.variantId,
    quantity,
    ...(commerceFlow ? { commerceFlow } : {}),
  });
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
