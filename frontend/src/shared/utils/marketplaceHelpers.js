/**
 * Reusable Marketplace Helper Functions
 */

/**
 * Detects the active marketplace tab based on the active route and local storage state.
 *
 * Returns the CANONICAL backend tab value directly (`mithilakart` | `mithilak` |
 * `quick_shop` | `groceries_fresh` — matching `MARKETPLACE_TABS` in
 * backend/src/constants/marketplace.js), not the zustand store's internal
 * `activeFlow` spelling (`quickshop`/`freshgrocery`, no underscore), so a
 * caller can pass this straight through as `?tab=` without a second mapping
 * step.
 */
export const getCurrentMarketplaceTab = () => {
  if (typeof window === 'undefined') return 'mithilakart';
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab') || searchParams.get('marketplaceTab') || searchParams.get('flow');
    if (tabParam) {
      if (tabParam === 'quickshop' || tabParam === 'quick_shop') return 'quick_shop';
      if (tabParam === 'freshgrocery' || tabParam === 'fresh_grocery' || tabParam === 'groceries_fresh') return 'groceries_fresh';
      if (tabParam === 'mithilak') return 'mithilak';
      if (tabParam === 'mithilakart') return 'mithilakart';
    }
  } catch {}

  const path = window.location.pathname;
  if (path.includes('/quick-shop')) return 'quick_shop';
  if (path.includes('/fresh-grocery')) return 'groceries_fresh';
  if (path.includes('/mithilak')) return 'mithilak';
  if (path === '/home' || path === '/') return 'mithilakart';

  if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quick_shop';
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'groceries_fresh';
  if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
  return 'mithilakart';
};

/**
 * Checks if a product belongs to a specific marketplace tab.
 * Supports the listings structure as well as category fallback classification rules.
 */
export const productBelongsToTab = (product, tab) => {
  if (!product) return false;
  if (product.marketplaceTab) {
    return product.marketplaceTab === tab;
  }
  if (product.listings && product.listings.length > 0) {
    return product.listings.some(l => l.tab === tab || l.marketplaceTab === tab);
  }
  if (product.tab) {
    return product.tab === tab;
  }
  if (Array.isArray(product.commerceFlows) && product.commerceFlows.length > 0) {
    if (tab === 'mithilak') return product.commerceFlows.includes('mithilak');
    if (tab === 'quick_shop') return product.commerceFlows.includes('quick_shop') || product.commerceFlows.includes('quickshop');
    if (tab === 'groceries_fresh') return product.commerceFlows.includes('fresh_grocery') || product.commerceFlows.includes('freshgrocery') || product.commerceFlows.includes('groceries_fresh');
    if (tab === 'mithilakart') return product.commerceFlows.includes('standard') || product.commerceFlows.includes('mithilakart');
  }
  if (product.commerceFlow) {
    if (tab === 'mithilak') return product.commerceFlow === 'mithilak';
    if (tab === 'quick_shop') return product.commerceFlow === 'quick_shop' || product.commerceFlow === 'quickshop';
    if (tab === 'groceries_fresh') return product.commerceFlow === 'fresh_grocery' || product.commerceFlow === 'freshgrocery' || product.commerceFlow === 'groceries_fresh';
    if (tab === 'mithilakart') return product.commerceFlow === 'standard' || product.commerceFlow === 'mithilakart';
  }
  
  const idStr = product.id !== undefined && product.id !== null ? String(product.id) : '';
  
  if (tab === 'groceries_fresh') {
    return [
      'Fruits & Vegetables', 'Atta, Rice & Dal', 'Oil, Ghee & Masala', 'Dairy, Bread & Eggs', 
      'Cereals & Dry Fruits', 'Chicken, Meat & Fish', 'Instant & Frozen Food', 'Fruits & Veggies', 
      'Dairy & eggs', 'Staples', 'Beverages', 'Snacks', 'Masala & Oil', 'Frozen', 'Household', 
      'Fruits & Vegetables', 'fruits', 'veg', 'exotics', 'atta', 'rice', 'dal', 'oil', 'ghee', 
      'spices', 'milk', 'bread', 'eggs'
    ].includes(product.category) || 
      idStr.startsWith('fv') || idStr.startsWith('ard') || 
      idStr.startsWith('ogm') || idStr.startsWith('dbe');
  }
  
  if (tab === 'quick_shop') {
    return [
      'Electronics', 'Beauty', 'Stationery', 'Gifting', 'Electrical', 'Chips & Namkeens', 
      'Ice Creams', 'Drinks & Juices', 'Sweets & Chocolates', 'Tea, Coffee & Milk Drinks', 
      'Bakery & Biscuits', 'Sauces & Spreads', 'Snacks & Drinks', 'Beauty & Personal Care', 
      'Household, Stationery & Lifestyle', 'Mobiles & Electronics', 'chips', 'namkeen', 
      'tub', 'cone', 'soft', 'juice', 'choc', 'sweets', 'tea', 'coffee'
    ].includes(product.category) || 
      idStr.startsWith('cn') || idStr.startsWith('ic') || 
      idStr.startsWith('dj') || idStr.startsWith('sc') || 
      idStr.startsWith('tcm') || idStr.startsWith('bb') || 
      idStr.startsWith('ss');
  }
  
  if (tab === 'mithilak') {
    return [
      'Mithila Festival & Cultural', 'Mithila Paridhan', 'Mithila Special Cuisines', 
      'Mithila Lac Bangles', 'Mithila Handcrafted Items', 'Mithila Pooja Needs', 
      'Mithila Books & Panchang', 'Mithila Achaar'
    ].includes(product.category) || 
      idStr.startsWith('mfc') || idStr.startsWith('mp') || 
      idStr.startsWith('msc') || idStr.startsWith('mlb') || 
      idStr.startsWith('mhi') || idStr.startsWith('mpn') || 
      idStr.startsWith('mbp') || idStr.startsWith('ma');
  }
  
  return true; // mithilakart or fallback default
};

