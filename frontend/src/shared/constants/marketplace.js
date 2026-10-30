/**
 * Centralized Marketplace Tab Configuration
 * Defines all valid tabs, their display names, and associated delivery options.
 */

export const MARKETPLACE_TABS = {
  MITHILAKART: {
    id: 'mithilakart',
    label: 'Mithilakart',
    deliveryType: 'standard',
    defaultDeliveryTime: '3 Days',
    deliveryOptions: ['2 Days', '3 Days', '5 Days'],
  },
  MITHILAK: {
    id: 'mithilak',
    label: 'Mithilak',
    deliveryType: 'standard',
    defaultDeliveryTime: '3 Days',
    deliveryOptions: ['2 Days', '3 Days', '5 Days'],
  },
  QUICK_SHOP: {
    id: 'quick_shop',
    label: 'Quick Shop',
    deliveryType: 'quick',
    defaultDeliveryTime: '20 Minutes',
    deliveryOptions: ['15 Minutes', '20 Minutes', '25 Minutes', '30 Minutes'],
  },
  GROCERIES_FRESH: {
    id: 'groceries_fresh',
    label: 'Fresh & Groceries',
    deliveryType: 'quick',
    defaultDeliveryTime: '20 Minutes',
    deliveryOptions: ['15 Minutes', '20 Minutes', '25 Minutes', '30 Minutes'],
  },
};

export const MARKETPLACE_TABS_LIST = Object.values(MARKETPLACE_TABS);

export const TAB_CATEGORIES_MAPPING = {
  mithilakart: ['clothing', 'home', 'beauty', 'handicraft'],
  mithilak: ['clothing', 'handicraft'],
  quick_shop: ['electronics', 'beauty', 'food'],
  groceries_fresh: ['food'],
};

