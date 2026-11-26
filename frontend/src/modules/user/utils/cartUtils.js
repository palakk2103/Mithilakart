import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart } from '../services/cartApi';
import { mapCartItem } from './mappers';
import useVendorStore from '../../../store/useVendorStore';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import { requestLogin } from '../../../shared/utils/loginRequired';

export const dispatchCartUpdated = () => {
  window.dispatchEvent(new Event('cartUpdated'));
};

// Fetches ONE tab's cart (the active tab unless told otherwise). `tab` is
// echoed back so callers can drop a response that arrives after the shopper
// has already switched to another tab.
export const fetchCartItems = async (tab = getMarketplaceTab(), couponCode, tip) => {
  try {
    const cart = await getCart(tab, couponCode, tip);
    const items = (cart?.items || []).map(mapCartItem);
    return { cart, items, tab };
  } catch (error) {
    // `failed` lets a screen say "could not load" instead of "your cart is empty".
    return { cart: null, items: [], tab, failed: true, error };
  }
};

export const fetchCartCount = async (tab) => {
  const { items } = await fetchCartItems(tab);
  return items.reduce((acc, item) => acc + (item.qty || 1), 0);
};

const normalizeCommerceFlow = (flow) => {
  if (!flow) return 'standard';
  if (flow === 'quickshop' || flow === 'quick_shop') return 'quick_shop';
  if (flow === 'freshgrocery' || flow === 'fresh_grocery') return 'fresh_grocery';
  if (flow === 'mithilak') return 'mithilak';
  if (flow === 'mithilakart') return 'standard';
  return flow;
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** There is no guest cart: a logged-out shopper is sent to log in, then returned here. */
export const ensureLoggedIn = (message = 'Please log in to add items to your cart') => {
  if (isAuthenticated('customer')) return;
  requestLogin(message);
  const err = new Error(message);
  err.code = 'LOGIN_REQUIRED';
  throw err;
};

export const addProductToCart = async (product, quantity = 1, commerceFlow) => {
  ensureLoggedIn();
  const listingId = product.listingId;
  const productId = product.productId || product.id || product._id;
  const flow = normalizeCommerceFlow(commerceFlow || product.commerceFlow || getCommerceFlow());
  const marketplaceTab = product.marketplaceTab || (flow === 'quick_shop' ? 'quick_shop' : flow === 'fresh_grocery' ? 'groceries_fresh' : getMarketplaceTab());

  if (listingId) {
    // productId rides along so the server can fall back to the product when a card's
    // listing has since been hidden or replaced ("listing not found" on Add).
    await addCartItem({
      listingId,
      ...(productId && OBJECT_ID.test(String(productId)) ? { productId } : {}),
      marketplaceTab,
      quantity,
      commerceFlow: flow,
    });
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
  await updateCartItem(cartId, { quantity: newQty, marketplaceTab: item.marketplaceTab || getMarketplaceTab() });
  dispatchCartUpdated();
  return newQty;
};

export const removeCartItemById = async (cartId, tab) => {
  const cartTab = tab || (typeof cartId === 'object' && cartId?.marketplaceTab) || getMarketplaceTab();
  const id = typeof cartId === 'object' && cartId !== null
    ? (cartId.cartId || cartId.itemKey || cartId.productId || cartId.id)
    : cartId;
  try {
    await removeCartItem(id, cartTab);
  } catch (err) {
    const rawId = String(id || '');
    const cleanId = rawId.replace(/:+$/, '').replace(/^listing:/, '');
    if (cleanId && cleanId !== rawId) {
      await removeCartItem(cleanId, cartTab);
    } else {
      throw err;
    }
  }
  dispatchCartUpdated();
};

// Clears only one tab's cart (the active tab unless told otherwise).
export const clearCartForTab = (tab = getMarketplaceTab()) => clearCart(tab);
export { clearCart };

export const getCommerceFlow = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.includes('/quick-shop')) return 'quick_shop';
  if (path.includes('/fresh-grocery')) return 'fresh_grocery';
  if (path.includes('/mithilak')) return 'mithilak';
  if (path === '/home' || path === '/') return 'standard';

  // Off-flow pages (/cart, /checkout...): the vendor store is the source of truth the header,
  // badge and theme use, so the cart must be read from the same tab (localStorage flags can be stale).
  const active = useVendorStore.getState().activeFlow;
  if (active === 'quickshop') return 'quick_shop';
  if (active === 'freshgrocery') return 'fresh_grocery';
  if (active === 'mithilak') return 'mithilak';
  if (active === 'mithilakart') return 'standard';
  if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quick_shop';
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'fresh_grocery';
  if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
  return 'standard';
};

const FLOW_TO_TAB = {
  standard: 'mithilakart',
  mithilak: 'mithilak',
  quick_shop: 'quick_shop',
  fresh_grocery: 'groceries_fresh',
};

export const getMarketplaceTab = () => FLOW_TO_TAB[getCommerceFlow()] || 'mithilakart';
