import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Zap, ShoppingBag, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import useVendorStore from '../../../../store/useVendorStore';

const HeaderTabs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { activeFlow, setActiveFlow } = useVendorStore();
  const isQuickShopActive = activeFlow === 'quickshop';
  const isMithilakActive = activeFlow === 'mithilak';
  const isFreshGroceryActive = activeFlow === 'freshgrocery';
  const isMithilakartActive = activeFlow === 'mithilakart';

  const isHeaderLight = isMithilakartActive || isFreshGroceryActive;

  const handleTabClick = (path, flow) => {
    setActiveFlow(flow);
    navigate(path);
  };

  return (
    <div className="px-2 pt-1.5 pb-2.5 md:px-2 md:pt-1.5 md:pb-2 grid grid-cols-4 gap-1.5 md:gap-2 mb-1">
      {/* ── Tab 1: Mithilakart ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/home', 'mithilakart')}
        className={`flex flex-col items-center justify-center py-1 rounded-lg border h-[50px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isMithilakartActive
            ? 'bg-[#0B3A14] text-white border-[#0B3A14] shadow-md scale-102 z-10'
            : isFreshGroceryActive
              ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <div className="h-[16px] md:h-[18px] w-[32px] md:w-[40px] flex items-center justify-center">
          <img
            src="/mthibg.png"
            alt="Icon"
            className={`h-full w-full object-contain transition-all duration-300 ${
              isMithilakartActive 
                ? 'brightness-0 invert' 
                : isFreshGroceryActive 
                  ? 'brightness-200' 
                  : 'brightness-0'
            }`}
          />
        </div>
        <span className={`font-black text-[13px] md:text-[14px] italic tracking-tight leading-none text-center transition-colors duration-300 ${
          isMithilakartActive 
            ? 'text-white' 
            : isFreshGroceryActive
              ? 'text-white'
              : 'text-white'
        }`}>
          {t('home.title')}
        </span>
      </motion.div>
 
      {/* ── Tab 2: Quick Shop ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/quick-shop', 'quickshop')}
        className={`flex flex-col items-center justify-center py-1 rounded-lg border h-[50px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isQuickShopActive
            ? 'bg-white text-[#F26522] border-white shadow-md scale-102 z-10'
            : isMithilakartActive
              ? 'bg-[#84C865]/90 text-white border-white/20 hover:bg-[#84C865]'
              : isFreshGroceryActive
                ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
                : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <div
          className={`h-[16px] w-[16px] md:h-[18px] md:w-[18px] rounded-full flex items-center justify-center shadow-xs transition-all duration-300 ${
            isQuickShopActive 
              ? 'bg-[#F26522] text-white' 
              : isMithilakartActive
                ? 'bg-white/25 text-white'
                : 'bg-white/20 text-white'
          }`}
        >
          <Clock size={11} className="w-[10px] h-[10px] md:w-[11px] md:h-[11px] text-white" strokeWidth={2.5} />
        </div>
        <span
          className={`text-[12.5px] md:text-[13.5px] font-black tracking-tight leading-none text-center px-0.5 transition-colors duration-300 ${
            isQuickShopActive 
              ? 'text-[#F26522]' 
              : 'text-white'
          }`}
        >
          {t('nav.quickShop')}
        </span>
      </motion.div>
 
      {/* ── Tab 3: Mithilak ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/mithilak', 'mithilak')}
        className={`flex flex-col items-center justify-center py-1 rounded-lg border h-[50px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isMithilakActive
            ? 'bg-white text-[#207C8A] border-white shadow-md scale-102 z-10'
            : isMithilakartActive
              ? 'bg-[#84C865]/90 text-white border-white/20 hover:bg-[#84C865]'
              : isFreshGroceryActive
                ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
                : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <div className="h-[16px] md:h-[18px] flex items-center justify-center">
          <Plane 
            size={16} 
            className={`w-[14px] h-[14px] md:w-[16px] md:h-[16px] transition-all duration-300 ${
              isMithilakActive 
                ? "text-[#207C8A] fill-[#207C8A]/20" 
                : "text-white"
            }`} 
          />
        </div>
        <span className={`text-[13px] md:text-[14px] font-black tracking-tight leading-none transition-colors duration-300 ${
          isMithilakActive 
            ? 'text-[#207C8A]' 
            : 'text-white'
        }`}>
          {t('nav.mithilak')}
        </span>
      </motion.div>
 
      {/* ── Tab 4: Fresh & Grocery ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/fresh-grocery', 'freshgrocery')}
        className={`flex flex-col items-center justify-center py-1 rounded-lg border h-[50px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isFreshGroceryActive
            ? 'bg-white text-[#7A3E17] border-white shadow-md scale-102 z-10'
            : isMithilakartActive
              ? 'bg-[#84C865]/90 text-white border-white/20 hover:bg-[#84C865]'
              : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <span className={`text-[12.5px] md:text-[13.5px] font-black tracking-tight leading-tight text-center px-0.5 transition-colors duration-300 ${
          isFreshGroceryActive 
            ? 'text-[#7A3E17]' 
            : 'text-white'
        }`}>
          {t('nav.groceriesAndFresh')}
        </span>
      </motion.div>
    </div>
  );
};

export default HeaderTabs;
