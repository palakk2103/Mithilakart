import { useMemo } from 'react';
import useVendorStore from '../../store/useVendorStore';
import { resolvedTabColours, useActiveTabThemes } from '../theme/tabThemes';

/**
 * Custom hook to retrieve active main tab theme colors and styles across the app.
 * Returns dynamic Tailwind CSS classes and color codes based on active flow:
 * - mithilak: Teal theme (#207C8A)
 * - quickshop: Bright Orange theme (#F26522)
 * - freshgrocery: Amber Gold theme (#D9A21B)
 * - mithilakart: Deep Green theme (#3E5A44 / #65B842)
 */
export const useTabTheme = () => {
  const storeFlow = useVendorStore((state) => state.activeFlow);
  // Classes read CSS variables the admin theme sets; primaryHex is used in JS
  // (alpha suffixes, SVG props), so it resolves to the live colour instead.
  const themes = useActiveTabThemes();

  const activeFlow = useMemo(() => {
    if (storeFlow) return storeFlow;
    if (typeof window === 'undefined') return 'mithilakart';
    const path = window.location.pathname;
    if (path.includes('/quick-shop')) return 'quickshop';
    if (path.includes('/fresh-grocery')) return 'freshgrocery';
    if (path.includes('/mithilak')) return 'mithilak';
    if (path === '/home' || path === '/') return 'mithilakart';

    if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quickshop';
    if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'freshgrocery';
    if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
    return 'mithilakart';
  }, [storeFlow]);

  const isMithilak = activeFlow === 'mithilak';
  const isQuickShop = activeFlow === 'quickshop';
  const isFreshGrocery = activeFlow === 'freshgrocery';
  const isMithilakart = !isMithilak && !isQuickShop && !isFreshGrocery;

  return useMemo(() => {
    if (isMithilak) {
      return {
        activeFlow: 'mithilak',
        primaryHex: resolvedTabColours('mithilak', themes).primary,
        primaryBg: 'bg-[color:var(--ml-primary,#207C8A)]',
        primaryBgHover: 'hover:bg-[color:var(--ml-dark,#185e68)]',
        primaryText: 'text-[color:var(--ml-primary,#207C8A)]',
        primaryBorder: 'border-[color:var(--ml-primary,#207C8A)]',
        primaryBorderLight: 'border-[color:var(--ml-primary,#207C8A)]/25',
        primaryLightBg: 'bg-[color:var(--ml-light,#F5F9FA)]',
        primaryBadgeBg: 'bg-[color:var(--ml-primary,#207C8A)]',
        headerBg: 'bg-gradient-to-r from-[color:var(--ml-primary,#207C8A)] to-[color:var(--ml-dark,#144f58)]',
        accentBg: 'bg-[color:var(--ml-primary,#207C8A)]',
        accentText: 'text-[color:var(--ml-primary,#207C8A)]',
        accentBorder: 'border-[color:var(--ml-primary,#207C8A)]',
        shadowColor: 'shadow-[0_4px_16px_rgba(32,124,138,0.22)]',
        shadowColorLight: 'shadow-[0_10px_30px_rgba(32,124,138,0.08)]',
      };
    }

    if (isQuickShop) {
      return {
        activeFlow: 'quickshop',
        primaryHex: resolvedTabColours('quickshop', themes).primary,
        primaryBg: 'bg-[color:var(--qs-primary,#F26522)]',
        primaryBgHover: 'hover:bg-[color:var(--qs-dark,#d45014)]',
        primaryText: 'text-[color:var(--qs-primary,#F26522)]',
        primaryBorder: 'border-[color:var(--qs-primary,#F26522)]',
        primaryBorderLight: 'border-[color:var(--qs-primary,#F26522)]/25',
        primaryLightBg: 'bg-[color:var(--qs-light,#FFF5EE)]',
        primaryBadgeBg: 'bg-[color:var(--qs-primary,#F26522)]',
        headerBg: 'bg-gradient-to-r from-[color:var(--qs-primary,#F26522)] to-[color:var(--qs-accent,#FF7A00)]',
        accentBg: 'bg-[color:var(--qs-primary,#F26522)]',
        accentText: 'text-[color:var(--qs-primary,#F26522)]',
        accentBorder: 'border-[color:var(--qs-primary,#F26522)]',
        shadowColor: 'shadow-[0_4px_16px_rgba(242,101,34,0.22)]',
        shadowColorLight: 'shadow-[0_10px_30px_rgba(242,101,34,0.08)]',
      };
    }

    if (isFreshGrocery) {
      return {
        activeFlow: 'freshgrocery',
        primaryHex: resolvedTabColours('freshgrocery', themes).primary,
        primaryBg: 'bg-[color:var(--fg-primary,#D9A21B)]',
        primaryBgHover: 'hover:bg-[color:var(--fg-dark,#c49218)]',
        primaryText: 'text-[color:var(--fg-primary,#D9A21B)]',
        primaryBorder: 'border-[color:var(--fg-primary,#D9A21B)]',
        primaryBorderLight: 'border-[color:var(--fg-primary,#D9A21B)]/25',
        primaryLightBg: 'bg-[color:var(--fg-light,#FFF8EE)]',
        primaryBadgeBg: 'bg-[color:var(--fg-primary,#D9A21B)]',
        headerBg: 'bg-[color:var(--fg-primary,#D9A21B)]',
        accentBg: 'bg-[color:var(--fg-primary,#D9A21B)]',
        accentText: 'text-[color:var(--fg-primary,#D9A21B)]',
        accentBorder: 'border-[color:var(--fg-primary,#D9A21B)]',
        shadowColor: 'shadow-[0_4px_16px_rgba(217,162,27,0.15)]',
        shadowColorLight: 'shadow-[0_10px_30px_rgba(217,162,27,0.06)]',
      };
    }

    // Default: Mithilakart
    return {
      activeFlow: 'mithilakart',
      primaryHex: resolvedTabColours('mithilakart', themes).primary,
      primaryBg: 'bg-[color:var(--mk-primary,#65B842)]',
      primaryBgHover: 'hover:bg-[color:var(--mk-dark,#549e35)]',
      primaryText: 'text-[color:var(--mk-primary,#65B842)]',
      primaryBorder: 'border-[color:var(--mk-primary,#65B842)]',
      primaryBorderLight: 'border-[color:var(--mk-primary,#65B842)]/25',
      primaryLightBg: 'bg-[color:var(--mk-light,#F6F8F3)]',
      primaryBadgeBg: 'bg-[color:var(--mk-primary,#65B842)]',
      headerBg: 'bg-[color:var(--mk-primary,#65B842)]',
      accentBg: 'bg-[color:var(--mk-primary,#65B842)]',
      accentText: 'text-[color:var(--mk-primary,#65B842)]',
      accentBorder: 'border-[color:var(--mk-primary,#65B842)]',
      shadowColor: 'shadow-[0_4px_16px_rgba(101,184,66,0.22)]',
      shadowColorLight: 'shadow-[0_10px_30px_rgba(101,184,66,0.08)]',
    };
  }, [isMithilak, isQuickShop, isFreshGrocery, isMithilakart, themes]);
};

export default useTabTheme;
