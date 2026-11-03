const { YOU_POPUP_ITEMS, YOU_POPUP_LABEL_MAX, defaultYouPopupItems } = require('../../constants/youPopup');

/**
 * Merges a stored (possibly missing/partial/corrupt) config over the registry.
 * Unknown IDs are dropped; missing registry items fall back to defaults, so a
 * future registry addition appears automatically. Result is sorted by order.
 */
function mergeYouPopupItems(stored) {
  const defaults = defaultYouPopupItems();
  if (!Array.isArray(stored)) return defaults;
  const byId = new Map();
  stored.forEach((s) => { if (s && typeof s.id === 'string') byId.set(s.id, s); });
  const merged = YOU_POPUP_ITEMS.map((reg, idx) => {
    const s = byId.get(reg.id);
    if (!s) return { ...defaults[idx], order: 1000 + idx };
    const label = typeof s.label === 'string' ? s.label.trim() : '';
    return {
      id: reg.id,
      label: label && label.length <= YOU_POPUP_LABEL_MAX ? label : reg.label,
      enabled: s.enabled !== false,
      order: Number.isInteger(s.order) ? s.order : idx + 1,
    };
  });
  return merged.sort((a, b) => a.order - b.order);
}

module.exports = { mergeYouPopupItems };
