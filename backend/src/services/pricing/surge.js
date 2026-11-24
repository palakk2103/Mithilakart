const { DEFAULT_SURGE_CONFIG } = require('../../constants/platformSettings');

const IST_OFFSET_MINUTES = 330;
const money = (n) => Math.round(n * 100) / 100;
const toMinutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? h * 60 + min : null;
};

/** Admin value merged over the defaults, so a partial save keeps the rest. */
function resolveSurgeConfig(config = {}) {
  const raw = config && typeof config.surgeConfig === 'object' && config.surgeConfig ? config.surgeConfig : {};
  return { ...DEFAULT_SURGE_CONFIG, ...raw };
}

/** Is "now" inside one of the windows (IST)? No windows means always. */
function inSurgeWindow(windows, now = new Date()) {
  if (!Array.isArray(windows) || !windows.length) return true;
  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60000);
  const day = ist.getUTCDay();
  const minute = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const prevDay = (day + 6) % 7;

  return windows.some((w) => {
    const start = toMinutes(w?.start);
    const end = toMinutes(w?.end);
    if (start == null || end == null) return false;
    const days = Array.isArray(w.days) && w.days.length ? w.days.map(Number) : [0, 1, 2, 3, 4, 5, 6];
    if (start === end) return days.includes(day);
    if (start < end) return days.includes(day) && minute >= start && minute < end;
    // Runs past midnight: the evening part belongs to `day`, the early-morning part to the day before.
    return (days.includes(day) && minute >= start) || (days.includes(prevDay) && minute < end);
  });
}

const fill = (text, values) => String(text || '').replace(/\{(\w+)\}/g, (_, k) => (values[k] ?? ''));

/** Real demand: recent orders in this tab (counted by PlatformConfigService) reached the admin's number. */
function isBusy(config, s, tab) {
  const recent = Number(config?.recentOrdersByTab?.[tab]) || 0;
  return recent >= Math.max(1, Number(s.demandOrders) || DEFAULT_SURGE_CONFIG.demandOrders);
}

/** Is surge switched on for this tab right now (ignoring the cart value)? */
function surgeActiveForTab(config, marketplaceTab, now = new Date()) {
  const s = resolveSurgeConfig(config);
  const amount = Number(s.amount) || 0;
  return Boolean(
    s.enabled
    && amount > 0
    && marketplaceTab
    && Array.isArray(s.tabs) && s.tabs.includes(marketplaceTab)
    && inSurgeWindow(s.windows, now)
    && (s.trigger !== 'demand' || isBusy(config, s, marketplaceTab))
  );
}

/**
 * FEE-3. Surge for one cart: `cartValue` is the items at selling price
 * (before coupons), which is what "cart value below ₹499" means to customers.
 */
function computeSurge(config, { cartValue, marketplaceTab, hasItems = true, now = new Date() }) {
  const s = resolveSurgeConfig(config);
  const amount = money(Math.max(0, Number(s.amount) || 0));
  const threshold = Math.max(0, Number(s.threshold) || 0);
  const active = surgeActiveForTab(config, marketplaceTab, now);
  const applies = Boolean(active && hasItems && cartValue < threshold);
  const remaining = applies ? money(threshold - cartValue) : 0;
  return {
    applies,
    active,
    charge: applies ? amount : 0,
    amount,
    threshold,
    amountToAvoid: remaining,
    label: s.billLabel || DEFAULT_SURGE_CONFIG.billLabel,
    note: applies ? fill(s.billNote, { remaining, threshold, amount }) : '',
  };
}

/** What the tab landing banner needs (public, no cart). */
function publicSurgeInfo(config, now = new Date()) {
  const s = resolveSurgeConfig(config);
  const threshold = Math.max(0, Number(s.threshold) || 0);
  const amount = Math.max(0, Number(s.amount) || 0);
  const tabs = Array.isArray(s.tabs) ? s.tabs : [];
  return {
    enabled: Boolean(s.enabled) && amount > 0,
    amount,
    threshold,
    tabs,
    activeTabs: tabs.filter((tab) => surgeActiveForTab(config, tab, now)),
    bannerTitle: fill(s.bannerTitle, { threshold, amount }),
    bannerText: fill(s.bannerText, { threshold, amount }),
    billLabel: s.billLabel || DEFAULT_SURGE_CONFIG.billLabel,
  };
}

module.exports = {
  resolveSurgeConfig,
  inSurgeWindow,
  surgeActiveForTab,
  computeSurge,
  publicSurgeInfo,
};
