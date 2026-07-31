import { useMemo } from 'react';
import useVendorStore from '../../store/useVendorStore';

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

  const activeFlow = useMemo(() => {
    if (storeFlow) return storeFlow;
    if (typeof window === 'undefined') return 'mithilakart';
    const path = window.location.pathname;
    if (path.includes('/mithilak')) return 'mithilak';
    if (path.includes('/fresh-grocery')) return 'freshgrocery';
    if (path.includes('/quick-shop')) {
      return localStorage.getItem('isMithilakFlow') === 'true' ? 'mithilak' : 'quickshop';
    }
    if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
    if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'freshgrocery';
    if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quickshop';
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
        primaryHex: '#207C8A',
        primaryBg: 'bg-[#207C8A]',
        primaryBgHover: 'hover:bg-[#185e68]',
        primaryText: 'text-[#207C8A]',
        primaryBorder: 'border-[#207C8A]',
        primaryBorderLight: 'border-[#207C8A]/25',
        primaryLightBg: 'bg-[#F5F9FA]',
        primaryBadgeBg: 'bg-[#207C8A]',
        headerBg: 'bg-gradient-to-r from-[#207C8A] to-[#144f58]',
        accentBg: 'bg-[#207C8A]',
        accentText: 'text-[#207C8A]',
        accentBorder: 'border-[#207C8A]',
        shadowColor: 'shadow-[0_4px_16px_rgba(32,124,138,0.22)]',
        shadowColorLight: 'shadow-[0_10px_30px_rgba(32,124,138,0.08)]',
      };
    }

    if (isQuickShop) {
      return {
        activeFlow: 'quickshop',
        primaryHex: '#F26522',
        primaryBg: 'bg-[#F26522]',
        primaryBgHover: 'hover:bg-[#d45014]',
        primaryText: 'text-[#F26522]',
        primaryBorder: 'border-[#F26522]',
        primaryBorderLight: 'border-[#F26522]/25',
        primaryLightBg: 'bg-[#FFF5EE]',
        primaryBadgeBg: 'bg-[#F26522]',
        headerBg: 'bg-gradient-to-r from-[#F26522] to-[#FF7A00]',
        accentBg: 'bg-[#F26522]',
        accentText: 'text-[#F26522]',
        accentBorder: 'border-[#F26522]',
        shadowColor: 'shadow-[0_4px_16px_rgba(242,101,34,0.22)]',
        shadowColorLight: 'shadow-[0_10px_30px_rgba(242,101,34,0.08)]',
      };
    }

    if (isFreshGrocery) {
      return {
        activeFlow: 'freshgrocery',
        primaryHex: '#D9A21B',
        primaryBg: 'bg-[#D9A21B]',
        primaryBgHover: 'hover:bg-[#c49218]',
        primaryText: 'text-[#D9A21B]',
        primaryBorder: 'border-[#D9A21B]',
        primaryBorderLight: 'border-[#D9A21B]/25',
        primaryLightBg: 'bg-[#FFF8EE]',
        primaryBadgeBg: 'bg-[#D9A21B]',
        headerBg: 'bg-[#D9A21B]',
        accentBg: 'bg-[#D9A21B]',
        accentText: 'text-[#D9A21B]',
        accentBorder: 'border-[#D9A21B]',
        shadowColor: 'shadow-[0_4px_16px_rgba(217,162,27,0.15)]',
        shadowColorLight: 'shadow-[0_10px_30px_rgba(217,162,27,0.06)]',
      };
    }

    // Default: Mithilakart
    return {
      activeFlow: 'mithilakart',
      primaryHex: '#65B842',
      primaryBg: 'bg-[#65B842]',
      primaryBgHover: 'hover:bg-[#549e35]',
      primaryText: 'text-[#65B842]',
      primaryBorder: 'border-[#65B842]',
      primaryBorderLight: 'border-[#65B842]/25',
      primaryLightBg: 'bg-[#F6F8F3]',
      primaryBadgeBg: 'bg-[#65B842]',
      headerBg: 'bg-[#65B842]',
      accentBg: 'bg-[#65B842]',
      accentText: 'text-[#65B842]',
      accentBorder: 'border-[#65B842]',
      shadowColor: 'shadow-[0_4px_16px_rgba(101,184,66,0.22)]',
      shadowColorLight: 'shadow-[0_10px_30px_rgba(101,184,66,0.08)]',
    };
  }, [isMithilak, isQuickShop, isFreshGrocery, isMithilakart]);
};

export default useTabTheme;
