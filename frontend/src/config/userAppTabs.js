/**
 * Centralized User App Header Tabs Configuration
 *
 * Exposes dynamic getters & setters so the Admin Panel can add, remove,
 * rename, reorder, and toggle tab visibility in real-time with backend persistence.
 */

import customerApi, { adminApiClient } from '../shared/api/client';

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
    label: 'Fresh & Groceries',
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

export const mergeWithDefaultTabs = (backendTabs) => {
  if (!Array.isArray(backendTabs) || backendTabs.length === 0) {
    return DEFAULT_USER_APP_TABS;
  }
  return DEFAULT_USER_APP_TABS.map((defaultTab) => {
    const backendMatch = backendTabs.find(
      (b) => b.id === defaultTab.id || b.tabId === defaultTab.id
    );
    if (!backendMatch) return defaultTab;
    return {
      ...defaultTab,
      label: backendMatch.label || backendMatch.name || defaultTab.label,
      enabled: backendMatch.enabled !== false,
      route: backendMatch.route || defaultTab.route,
      flow: defaultTab.flow || backendMatch.commerceFlow || backendMatch.flow,
    };
  });
};

export const getStoredHeaderTabs = () => {
  if (typeof window === 'undefined') return DEFAULT_USER_APP_TABS;
  try {
    const stored = localStorage.getItem('user_app_tabs_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeWithDefaultTabs(parsed);
      }
    }
  } catch (e) {
    console.error('Error reading user_app_tabs_config:', e);
  }
  return DEFAULT_USER_APP_TABS;
};

export const fetchHeaderTabsFromBackend = async () => {
  try {
    const res = await customerApi.get('/storefront/header-tabs');
    const data = res?.data !== undefined ? res.data : res;
    if (Array.isArray(data) && data.length > 0) {
      const merged = mergeWithDefaultTabs(data);
      if (typeof window !== 'undefined') {
        const currentJson = localStorage.getItem('user_app_tabs_config');
        const nextJson = JSON.stringify(merged);
        if (currentJson !== nextJson) {
          localStorage.setItem('user_app_tabs_config', nextJson);
          window.dispatchEvent(new Event('user_app_tabs_updated'));
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn('Failed to fetch header tabs from backend, using cache/defaults:', err?.message || err);
  }
  return getStoredHeaderTabs();
};

export const saveHeaderTabsConfig = async (tabs) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_app_tabs_config', JSON.stringify(tabs));
    window.dispatchEvent(new Event('user_app_tabs_updated'));
  }
  try {
    await adminApiClient.put('/settings/header-tabs', { tabs });
  } catch (err) {
    console.warn('Failed to sync header tabs with backend:', err?.message || err);
  }
};

export const resetHeaderTabsConfig = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_app_tabs_config');
    window.dispatchEvent(new Event('user_app_tabs_updated'));
  }
  try {
    await adminApiClient.put('/settings/header-tabs', { tabs: DEFAULT_USER_APP_TABS });
  } catch (err) {
    console.warn('Failed to reset header tabs on backend:', err?.message || err);
  }
};

export const getEnabledHeaderTabs = () => {
  return getStoredHeaderTabs().filter((tab) => tab.enabled !== false);
};

export const USER_APP_TABS = DEFAULT_USER_APP_TABS;
