const { DEFAULT_SHOP_HOURS } = require('../../constants/platformSettings');
const { AppError } = require('../../utils/AppError');

const IST_OFFSET_MINUTES = 330;

const toMinutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? h * 60 + min : null;
};

/** Admin value merged over the defaults, so a partial save keeps the rest. */
function resolveShopHours(config = {}) {
  const raw = config && typeof config.shopHours === 'object' && config.shopHours ? config.shopHours : {};
  return { ...DEFAULT_SHOP_HOURS, ...raw };
}

/**
 * Is this tab taking orders right now (IST)? `open` → `close` may run past
 * midnight; open === close means round the clock. Only the listed tabs have
 * hours at all. This replaces the old browser-side check, which any customer
 * could flip with localStorage.forceShopClosed.
 */
function shopStatusForTab(config, tab, now = new Date()) {
  const s = resolveShopHours(config);
  const tabs = Array.isArray(s.tabs) ? s.tabs : [];
  const open = { open: true, opensAt: null, message: '' };
  if (!tabs.includes(tab)) return open;

  const closed = { open: false, opensAt: s.open, message: s.message || DEFAULT_SHOP_HOURS.message };
  if (s.forceClosed === true) return { ...closed, opensAt: null };
  if (s.enabled === false) return open;

  const from = toMinutes(s.open);
  const to = toMinutes(s.close);
  if (from == null || to == null || from === to) return open;

  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60000);
  const minute = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const isOpen = from < to ? minute >= from && minute < to : minute >= from || minute < to;
  return isOpen ? open : closed;
}

/** What the storefront needs: one entry per tab that has shop hours. */
function publicShopStatus(config, now = new Date()) {
  const s = resolveShopHours(config);
  return Object.fromEntries((Array.isArray(s.tabs) ? s.tabs : []).map((tab) => [tab, shopStatusForTab(config, tab, now)]));
}

function assertShopOpen(config, tab, now = new Date()) {
  const status = shopStatusForTab(config, tab, now);
  if (!status.open) throw AppError.conflict(status.message, [{ code: 'SHOP_CLOSED', opensAt: status.opensAt }]);
}

module.exports = { resolveShopHours, shopStatusForTab, publicShopStatus, assertShopOpen };
