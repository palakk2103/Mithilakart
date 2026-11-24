const { DEFAULT_CASHBACK_CONFIG } = require('../../constants/platformSettings');

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const METHODS = ['upi', 'card', 'cod'];

/** Admin value merged over the defaults, so a partial save keeps the rest. */
function resolveCashback(config = {}) {
  const raw = config && typeof config.cashbackConfig === 'object' && config.cashbackConfig ? config.cashbackConfig : {};
  return { ...DEFAULT_CASHBACK_CONFIG, ...raw };
}

/** Switched on, worth something, inside its dates and (when given) on this tab. */
function cashbackLive(c, { marketplaceTab = null, now = new Date() } = {}) {
  if (!c.enabled || !(Number(c.value) > 0)) return false;
  if (c.startsAt && now < new Date(c.startsAt)) return false;
  if (c.endsAt && now > new Date(c.endsAt)) return false;
  if (marketplaceTab && Array.isArray(c.tabs) && c.tabs.length && !c.tabs.includes(marketplaceTab)) return false;
  return true;
}

/** Whole rupees; percent is capped by maxAmount, and it can never exceed the goods. */
function cashbackAmount(c, value) {
  const raw = c.type === 'flat' ? Number(c.value) : (value * Number(c.value)) / 100;
  const cap = Number(c.maxAmount) > 0 ? Number(c.maxAmount) : Infinity;
  return Math.max(0, Math.floor(Math.min(raw, cap, value)));
}

/**
 * Cashback for one order. `value` is the items after coupons. `usesLeft` is how
 * many times this customer may still get it (null = unlimited).
 */
function computeCashback(config, { value, marketplaceTab, paymentMethod = null, usesLeft = null, now = new Date() }) {
  const c = resolveCashback(config);
  const live = cashbackLive(c, { marketplaceTab, now });
  const min = Math.max(0, Number(c.minOrder) || 0);
  const methods = (Array.isArray(c.methods) ? c.methods : []).filter((m) => METHODS.includes(m));
  const allowed = live && value >= min && (usesLeft === null || usesLeft > 0);
  const possible = allowed ? cashbackAmount(c, value) : 0;
  const offers = Object.fromEntries(METHODS.map((m) => [m, methods.includes(m) ? possible : 0]));
  return {
    live,
    mode: c.mode === 'wallet' ? 'wallet' : 'instant',
    campaign: String(c.campaign || 'default'),
    amount: paymentMethod ? offers[paymentMethod] || 0 : 0,
    offers,
    minOrder: min,
    amountNeeded: live && value < min ? money(min - value) : 0,
    usedUp: live && usesLeft !== null && usesLeft <= 0,
  };
}

/** Banner + "Know More" text for the storefront, written from the rules themselves. */
function publicCashback(config, now = new Date()) {
  const c = resolveCashback(config);
  if (!cashbackLive(c, { now })) return { enabled: false };
  const names = { upi: 'UPI', card: 'cards', cod: 'Cash on Delivery' };
  const methods = (Array.isArray(c.methods) ? c.methods : []).filter((m) => METHODS.includes(m));
  if (!methods.length) return { enabled: false };
  const list = methods.map((m) => names[m]).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const tabNames = { mithilakart: 'Mithilakart', mithilak: 'Mithilak', quick_shop: 'Quick Shop', groceries_fresh: 'Fresh & Groceries' };
  const worth = c.type === 'flat'
    ? `₹${c.value} cashback`
    : Number(c.maxAmount) > 0 ? `up to ₹${c.maxAmount} cashback` : `${c.value}% cashback`;
  const rules = [
    c.type === 'flat' ? `₹${c.value} cashback per order.` : `${c.value}% cashback${Number(c.maxAmount) > 0 ? `, up to ₹${c.maxAmount}` : ''} per order.`,
    Number(c.minOrder) > 0 ? `Order items worth ₹${c.minOrder} or more.` : null,
    `Pay with ${list}.`,
    Array.isArray(c.tabs) && c.tabs.length ? `Valid on ${c.tabs.map((t) => tabNames[t] || t).join(', ')}.` : null,
    Number(c.perCustomer) > 0 ? `Up to ${c.perCustomer} time${Number(c.perCustomer) === 1 ? '' : 's'} per customer.` : null,
    c.endsAt ? `Valid till ${new Date(c.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}.` : null,
    c.mode === 'wallet' ? 'Added to your Mithilakart wallet after delivery.' : 'Taken off your bill straight away.',
  ].filter(Boolean);
  return {
    enabled: true,
    title: c.title || `Get ${worth} on ${list}`,
    linkText: c.linkText || 'Know More',
    rules,
    terms: c.terms || '',
    mode: c.mode === 'wallet' ? 'wallet' : 'instant',
    tabs: Array.isArray(c.tabs) ? c.tabs : [],
  };
}

module.exports = { METHODS, resolveCashback, computeCashback, publicCashback };
