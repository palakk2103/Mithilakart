/**
 * Reusable Marketplace Helper Functions
 */

/**
 * Detects the active marketplace tab based on the active route and local storage state.
 */
export const getCurrentMarketplaceTab = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.includes('/quick-shop')) {
      return 'quick_shop';
    }
    if (window.location.pathname.includes('/fresh-grocery')) {
      return 'groceries_fresh';
    }
    if (window.location.pathname.includes('/mithilak')) {
      return 'mithilak';
    }
    if (window.location.pathname === '/home' || window.location.pathname === '/') {
      return 'mithilakart';
    }
  }
  if (localStorage.getItem('isQuickShopFlow') === 'true') {
    return 'quick_shop';
  }
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') {
    return 'groceries_fresh';
  }
  if (localStorage.getItem('isMithilakFlow') === 'true') {
    return 'mithilak';
  }
  return 'mithilakart';
};

/**
 * Checks if a product belongs to a specific marketplace tab.
 * Supports the listings structure as well as category fallback classification rules.
 */
export const productBelongsToTab = (product, tab) => {
  if (product.listings && product.listings.length > 0) {
    return product.listings.some(l => l.tab === tab);
  }
  if (product.tab) {
    return product.tab === tab;
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

