// Intercept localStorage for 'userCart' key to separate carts per active flow/tab
const originalGetItem = localStorage.getItem;
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

function getActiveTabId() {
  const path = window.location.pathname;
  if (path.includes('/quick-shop')) {
    return 'quickshop';
  }
  if (path.includes('/fresh-grocery')) {
    return 'freshgrocery';
  }
  if (path.includes('/mithilak')) {
    return 'mithilak';
  }
  if (path === '/home' || path === '/') {
    return 'mithilakart';
  }

  const isQuickShopFlow = originalGetItem.call(localStorage, 'isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = originalGetItem.call(localStorage, 'isFreshGroceryFlow') === 'true';
  const isMithilakFlow = originalGetItem.call(localStorage, 'isMithilakFlow') === 'true';

  if (isQuickShopFlow) return 'quickshop';
  if (isFreshGroceryFlow) return 'freshgrocery';
  if (isMithilakFlow) return 'mithilak';
  return 'mithilakart';
}

localStorage.getItem = function (key) {
  if (key === 'userCart') {
    const tabId = getActiveTabId();
    return originalGetItem.call(localStorage, `userCart_${tabId}`);
  }
  return originalGetItem.call(localStorage, key);
};

localStorage.setItem = function (key, value) {
  if (key === 'userCart') {
    const tabId = getActiveTabId();
    return originalSetItem.call(localStorage, `userCart_${tabId}`, value);
  }
  return originalSetItem.call(localStorage, key, value);
};

localStorage.removeItem = function (key) {
  if (key === 'userCart') {
    const tabId = getActiveTabId();
    return originalRemoveItem.call(localStorage, `userCart_${tabId}`);
  }
  return originalRemoveItem.call(localStorage, key);
};

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { store } from './store';
import './index.css'
import './i18n';
import App from './App.jsx'
import OfflineOverlay from './shared/components/OfflineOverlay.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <OfflineOverlay />
    </Provider>
  </StrictMode>,
)
