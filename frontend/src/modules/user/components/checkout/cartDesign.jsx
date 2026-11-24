import React, { createContext, useContext, useMemo } from 'react';
import { usePublicConfig } from '../../../../shared/config/publicConfig';
import useTabTheme from '../../../../shared/hooks/useTabTheme';

/**
 * Admin-controlled design of the Cart, Order Summary and Payment pages.
 *
 * The admin setting `cartDesign` (see backend/src/constants/cartDesign.js)
 * holds global style tokens, per-tab overrides and, per page, the ordered list
 * of sections with their on/off switch and own style. This file turns it into
 * CSS variables + a section list the pages render from. An empty colour means
 * "follow the active tab's theme", so with nothing configured the pages look
 * exactly as before.
 */
export const DEFAULT_ORDER = {
  cart: ['tabSwitcher', 'banner', 'address', 'items', 'freeDelivery', 'priceDetails', 'rails', 'safePayments'],
  summary: ['address', 'freeDelivery', 'items', 'coupon', 'actions', 'bill', 'policy', 'trust', 'terms', 'safePayments'],
  payment: ['coupons', 'credits', 'methods', 'orderSummary', 'note', 'safePayments'],
};

const DEFAULT_TOKENS = {
  headerBg: '', headerText: '', pageBg: '', cardBg: '', cardBorder: '', headingColor: '', textColor: '', accent: '',
  cardRadius: 12, buttonRadius: 999, pagePaddingX: 12, sectionGap: 14, cardPadding: 14, rowPaddingY: 12, cardShadow: true,
};

const FLOW_TO_TAB = { mithilakart: 'mithilakart', quickshop: 'quick_shop', mithilak: 'mithilak', freshgrocery: 'groceries_fresh' };

const px = (n) => `${n}px`;

export function useCartDesign(page) {
  const { cartDesign } = usePublicConfig();
  const theme = useTabTheme();
  const tab = FLOW_TO_TAB[theme.activeFlow] || 'mithilakart';

  return useMemo(() => {
    const tokens = { ...DEFAULT_TOKENS, ...(cartDesign?.global || {}), ...(cartDesign?.tabs?.[tab] || {}) };

    const saved = cartDesign?.pages?.[page]?.sections;
    const known = DEFAULT_ORDER[page] || [];
    const list = Array.isArray(saved) && saved.length
      ? [...saved.filter((s) => known.includes(s.key)), ...known.filter((k) => !saved.some((s) => s.key === k)).map((key) => ({ key, enabled: true, style: {} }))]
      : known.map((key) => ({ key, enabled: true, style: {} }));
    const byKey = Object.fromEntries(list.map((s) => [s.key, s]));

    const vars = {
      '--cd-gap': px(tokens.sectionGap),
      '--cd-px': px(tokens.pagePaddingX),
      '--cd-pad': px(tokens.cardPadding),
      '--cd-radius': px(tokens.cardRadius),
      '--cd-btn-radius': px(tokens.buttonRadius),
      '--cd-row-y': px(tokens.rowPaddingY),
      '--cd-shadow': tokens.cardShadow ? '0 1px 2px rgb(15 23 42 / 0.06)' : 'none',
    };
    if (tokens.cardBg) vars['--cd-card-bg'] = tokens.cardBg;
    if (tokens.cardBorder) vars['--cd-card-border'] = tokens.cardBorder;
    if (tokens.headingColor) vars['--cd-heading'] = tokens.headingColor;
    if (tokens.textColor) vars['--cd-text'] = tokens.textColor;

    return {
      tokens,
      byKey,
      ordered: list.filter((s) => s.enabled !== false),
      accent: tokens.accent || theme.primaryHex || '#F5A400',
      // Page root: tint from the theme unless the admin picked a colour.
      rootClass: tokens.pageBg ? '' : theme.primaryLightBg,
      rootStyle: { ...vars, ...(tokens.pageBg ? { background: tokens.pageBg } : {}), ...(tokens.textColor ? { color: tokens.textColor } : {}) },
      headerClass: tokens.headerBg ? '' : theme.headerBg,
      headerStyle: { ...(tokens.headerBg ? { background: tokens.headerBg } : {}), color: tokens.headerText || '#fff' },
      // Header colour (a solid colour) for places that want it, e.g. a stepper.
      title: (key, fallback) => byKey[key]?.style?.title || fallback,
      visible: (key) => byKey[key]?.enabled !== false,
    };
  }, [cartDesign, tab, page, theme]);
}

const DesignContext = createContext(null);
export const CartDesignProvider = ({ design, children }) => <DesignContext.Provider value={design}>{children}</DesignContext.Provider>;

/**
 * Wraps one section: hides it when the admin turned it off, applies its margins
 * and its own colours / padding / radius. Card sections pass their style down
 * as CSS variables (so nested cards follow); `plain` sections (rails, banner…)
 * apply it to the wrapper itself.
 */
export const DesignSection = ({ id, plain = false, className = '', children }) => {
  const design = useContext(DesignContext);
  const s = design?.byKey?.[id];
  if (s && s.enabled === false) return null;
  const st = s?.style || {};
  const style = {};
  if (st.marginTop != null) style.marginTop = px(st.marginTop);
  if (st.marginBottom != null) style.marginBottom = px(st.marginBottom);
  if (plain) {
    if (st.bg) style.background = st.bg;
    if (st.border) style.border = `1px solid ${st.border}`;
    if (st.radius != null) style.borderRadius = px(st.radius);
    if (st.padding != null) style.padding = px(st.padding);
  } else {
    if (st.bg) style['--cd-card-bg'] = st.bg;
    if (st.border) style['--cd-card-border'] = st.border;
    if (st.radius != null) style['--cd-radius'] = px(st.radius);
    if (st.padding != null) style['--cd-pad'] = px(st.padding);
  }
  return <div className={`cd-sec ${className}`} style={style} data-section={id}>{children}</div>;
};

/** Renders the page's sections in the admin's order; `elements[key]` is each section's JSX. */
export const OrderedSections = ({ design, elements }) => (
  <>
    {design.ordered.map(({ key }) => (elements[key] ? <React.Fragment key={key}>{elements[key]}</React.Fragment> : null))}
  </>
);
