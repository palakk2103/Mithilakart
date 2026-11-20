const KEY = 'mk_recently_viewed';
const MAX = 30;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** Product ids this device opened, newest first (CART-1 "Recently Viewed"). */
export const getRecentlyViewed = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((id) => OBJECT_ID.test(String(id))) : [];
  } catch {
    return [];
  }
};

export const recordRecentlyViewed = (productId) => {
  const id = String(productId || '');
  if (!OBJECT_ID.test(id)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([id, ...getRecentlyViewed().filter((x) => x !== id)].slice(0, MAX)));
  } catch { /* private mode: skip */ }
};
