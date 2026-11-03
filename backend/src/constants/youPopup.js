/**
 * "You" bottom-nav popup — registry of items an admin may configure.
 *
 * IDs and routes are fixed here (server-side allow-list). Admins can only
 * change `enabled`, `label` and `order`; they can never supply a URL. To add a
 * new menu item in future, add one entry below pointing at an existing
 * customer route — no popup/UI code changes are needed.
 */
const YOU_POPUP_SETTING_KEY = 'youPopupConfig';
const YOU_POPUP_LABEL_MAX = 24;

const YOU_POPUP_ITEMS = Object.freeze([
  { id: 'orders', label: 'Orders', route: '/profile/orders' },
  { id: 'buy_again', label: 'Buy Again', route: '/buy-again' },
  { id: 'account', label: 'Account', route: '/profile' },
  { id: 'wishlist', label: 'Wishlist', route: '/wishlist' },
]);

const defaultYouPopupItems = () =>
  YOU_POPUP_ITEMS.map((i, idx) => ({ id: i.id, label: i.label, enabled: true, order: idx + 1 }));

module.exports = {
  YOU_POPUP_SETTING_KEY,
  YOU_POPUP_LABEL_MAX,
  YOU_POPUP_ITEMS,
  defaultYouPopupItems,
};
