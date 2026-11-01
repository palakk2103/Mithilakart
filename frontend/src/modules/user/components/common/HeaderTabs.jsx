import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiSend, FiZap, FiShoppingBag, FiTag, FiStar, FiShoppingCart } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import useVendorStore from '../../../../store/useVendorStore';
import { getEnabledHeaderTabs, fetchHeaderTabsFromBackend } from '../../../../config/userAppTabs';
import { handleImageError } from '../../../../shared/utils/imageUtils';

const iconMap = {
  clock: FiClock,
  plane: FiSend,
  zap: FiZap,
  bag: FiShoppingBag,
  tag: FiTag,
  sparkles: FiStar,
  basket: FiShoppingCart,
};

const HeaderTabs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const activeFlow = useVendorStore((state) => state.activeFlow);
  const setActiveFlow = useVendorStore((state) => state.setActiveFlow);
  const [enabledTabs, setEnabledTabs] = React.useState(() => getEnabledHeaderTabs());

  React.useEffect(() => {
    fetchHeaderTabsFromBackend().then((tabs) => {
      if (tabs && tabs.length > 0) {
        const nextEnabled = tabs.filter((t) => t.enabled !== false);
        setEnabledTabs((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(nextEnabled)) return prev;
          return nextEnabled;
        });
      }
    });

    const handleTabsUpdate = (e) => {
      if (e && e.key && e.key !== 'user_app_tabs_config') return;
      const updated = getEnabledHeaderTabs();
      setEnabledTabs((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
        return updated;
      });
    };
    window.addEventListener('user_app_tabs_updated', handleTabsUpdate);
    window.addEventListener('storage', handleTabsUpdate);
    return () => {
      window.removeEventListener('user_app_tabs_updated', handleTabsUpdate);
      window.removeEventListener('storage', handleTabsUpdate);
    };
  }, []);

  const currentPath = location.pathname;
  const effectiveFlow = React.useMemo(() => {
    if (currentPath.includes('/quick-shop')) return 'quickshop';
    if (currentPath.includes('/fresh-grocery')) return 'freshgrocery';
    if (currentPath.includes('/mithilak')) return 'mithilak';
    if (currentPath === '/home' || currentPath === '/') return 'mithilakart';
    return activeFlow || 'mithilakart';
  }, [currentPath, activeFlow]);

  const isQuickShopActive = effectiveFlow === 'quickshop';
  const isMithilakActive = effectiveFlow === 'mithilak';
  const isFreshGroceryActive = effectiveFlow === 'freshgrocery';
  const isMithilakartActive = effectiveFlow === 'mithilakart';

  const handleTabClick = (tab) => {
    const targetRoute = tab.route || '/home';
    if (tab.flow && tab.flow !== activeFlow) {
      setActiveFlow(tab.flow);
    }
    if (location.pathname === targetRoute) return;
    navigate(targetRoute);
  };

  const renderTabIcon = (tab, isActive) => {
    if (tab.iconType === 'image' && tab.imageSrc) {
      return (
        <div className="h-[16px] md:h-[18px] w-[32px] md:w-[40px] flex items-center justify-center">
          <img
            src={tab.imageSrc}
            alt={tab.label || 'Icon'}
            className={`h-full w-full object-contain transition-all duration-300 ${
              isActive
                ? 'brightness-0 invert'
                : isFreshGroceryActive
                  ? 'brightness-200'
                  : 'brightness-0'
            }`} loading="lazy" decoding="async" onError={handleImageError} />
        </div>
      );
    }

    if (tab.iconType === 'clock') {
      return (
        <div
          className={`h-[16px] w-[16px] md:h-[18px] md:w-[18px] rounded-full flex items-center justify-center shadow-xs transition-all duration-300 ${
            isActive
              ? 'bg-[#F26522] text-white'
              : isMithilakartActive
                ? 'bg-white/25 text-white'
                : 'bg-white/20 text-white'
          }`}
        >
          <FiClock size={11} className="w-[10px] h-[10px] md:w-[11px] md:h-[11px] text-white" strokeWidth={2.5} data-testid="header-tab-icon" />
        </div>
      );
    }

    if (tab.iconType && iconMap[tab.iconType]) {
      const IconComponent = iconMap[tab.iconType];
      return (
        <div className="h-[16px] md:h-[18px] flex items-center justify-center">
          <IconComponent
            data-testid="header-tab-icon"
            size={16}
            className={`w-[14px] h-[14px] md:w-[16px] md:h-[16px] transition-all duration-300 ${
              isActive
                ? `${tab.activeTextClass || 'text-current'}`
                : 'text-white'
            }`}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="px-2 pt-1.5 pb-2.5 md:px-1 md:pt-1.5 md:pb-2 grid gap-1.5 md:gap-2 xl:gap-3 mb-1"
      style={{
        gridTemplateColumns: `repeat(${enabledTabs.length || 4}, minmax(0, 1fr))`,
      }}
    >
      {enabledTabs.map((tab) => {
        const currentPath = location.pathname;
        const hasRouteMatch = enabledTabs.some((t) => t.route === currentPath || (t.route === '/home' && currentPath === '/'));
        const isRouteActive = tab.route === currentPath || (tab.route === '/home' && currentPath === '/');
        const isActive = hasRouteMatch ? isRouteActive : (effectiveFlow === tab.flow || (tab.route && currentPath.startsWith(tab.route)));
        const displayLabel = tab.i18nKey ? t(tab.i18nKey, { defaultValue: tab.label }) : tab.label;

        // Determine inactive tab background styling based on overall header theme
        let inactiveStyle = 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25';
        if (isMithilakartActive && tab.id !== 'mithilakart') {
          inactiveStyle = 'bg-[#84C865]/90 text-white border-white/20 hover:bg-[#84C865]';
        } else if (isFreshGroceryActive && tab.id !== 'freshgrocery') {
          inactiveStyle = 'bg-white/20 text-white border-white/10 hover:bg-white/30';
        }

        const activeStyle = tab.activeBgClass
          ? `${tab.activeBgClass} shadow-md scale-102 z-10`
          : 'bg-white text-slate-900 border-white shadow-md scale-102 z-10';

        return (
          <motion.div
            key={tab.id}
            data-testid={`header-tab-${tab.id}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center justify-center py-1 px-1 md:px-0.5 min-[1440px]:px-3! min-w-0 rounded-lg border min-h-[56px] md:min-h-[56px] xl:min-h-[60px] md:py-1.5 gap-0.5 md:gap-1 cursor-pointer transition-colors duration-200 ${
              isActive ? activeStyle : inactiveStyle
            }`}
          >
            {renderTabIcon(tab, isActive)}
            <span
              className={`text-[14px] md:text-[15px] font-black tracking-tight leading-tight md:leading-snug text-center px-0.5 md:px-0 min-[1440px]:px-1! max-w-full transition-colors duration-300 ${
                isActive
                  ? tab.activeTextClass || 'text-current'
                  : 'text-white'
              } ${tab.id === 'mithilakart' ? 'text-[14.5px] md:text-[16px] italic' : ''}`}
            >
              {displayLabel}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default HeaderTabs;
