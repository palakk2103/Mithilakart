/**
 * Centralized User App Header Tabs Configuration
 *
 * Exposes dynamic getters & setters so the Admin Panel can add, remove,
 * rename, reorder, and toggle tab visibility in real-time.
 */

export const DEFAULT_USER_APP_TABS = [
  {
    id: 'mithilakart',
    label: 'Mithilakart',
    i18nKey: 'home.title',
    route: '/home',
    flow: 'mithilakart',
    enabled: true,
    iconType: 'image',
    imageSrc: '/mthibg.png',
    activeBgClass: 'bg-[#0B3A14] text-white border-[#0B3A14]',
    activeTextClass: 'text-white',
  },
  {
    id: 'quickshop',
    label: 'Quick Shop',
    i18nKey: 'nav.quickShop',
    route: '/quick-shop',
    flow: 'quickshop',
    enabled: true,
    iconType: 'clock',
    activeBgClass: 'bg-white text-[#F26522] border-white',
    activeTextColor: '#F26522',
    activeTextClass: 'text-[#F26522]',
  },
  {
    id: 'mithilak',
    label: 'Mithilak',
    i18nKey: 'nav.mithilak',
    route: '/mithilak',
    flow: 'mithilak',
    enabled: true,
    iconType: 'plane',
    activeBgClass: 'bg-white text-[#207C8A] border-white',
    activeTextColor: '#207C8A',
    activeTextClass: 'text-[#207C8A]',
  },
  {
    id: 'freshgrocery',
    label: 'Groceries & Fresh',
    i18nKey: 'nav.groceriesAndFresh',
    route: '/fresh-grocery',
    flow: 'freshgrocery',
    enabled: true,
    iconType: 'none',
    activeBgClass: 'bg-white text-[#7A3E17] border-white',
    activeTextColor: '#7A3E17',
    activeTextClass: 'text-[#7A3E17]',
  },
];

export const getStoredHeaderTabs = () => {
  if (typeof window === 'undefined') return DEFAULT_USER_APP_TABS;
  try {
    const stored = localStorage.getItem('user_app_tabs_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading user_app_tabs_config:', e);
  }
  return DEFAULT_USER_APP_TABS;
};

export const saveHeaderTabsConfig = (tabs) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_app_tabs_config', JSON.stringify(tabs));
    window.dispatchEvent(new Event('user_app_tabs_updated'));
  }
};

export const resetHeaderTabsConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_app_tabs_config');
    window.dispatchEvent(new Event('user_app_tabs_updated'));
  }
};

export const getEnabledHeaderTabs = () => {
  return getStoredHeaderTabs().filter((tab) => tab.enabled !== false);
};

export const USER_APP_TABS = DEFAULT_USER_APP_TABS;
