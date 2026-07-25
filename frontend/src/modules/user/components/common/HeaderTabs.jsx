import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Zap, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HeaderTabs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopActive = location.pathname.includes('/quick-shop') && !isMithilakFlow;
  const isMithilakActive = location.pathname.includes('/mithilak') || (location.pathname.includes('/quick-shop') && isMithilakFlow);
  const isFreshGroceryActive = location.pathname.includes('/fresh-grocery');
  const isMithilakartActive = !isQuickShopActive && !isMithilakActive && !isFreshGroceryActive;

  const isHeaderLight = isMithilakartActive || isFreshGroceryActive;

  const handleTabClick = (path, isQuick) => {
    localStorage.setItem('isQuickShopFlow', isQuick ? 'true' : 'false');
    if (path === '/mithilak') {
      localStorage.setItem('isMithilakFlow', 'true');
    } else {
      localStorage.setItem('isMithilakFlow', 'false');
    }
    if (path === '/fresh-grocery') {
      localStorage.setItem('isFreshGroceryFlow', 'true');
    } else {
      localStorage.setItem('isFreshGroceryFlow', 'false');
    }
    navigate(path);
  };

  return (
    <div className="px-2 pt-1 pb-2 md:px-2 md:pt-1.5 md:pb-1.5 grid grid-cols-4 gap-1.5 md:gap-2">
      {/* ── Tab 1: Mithilakart ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/home', false)}
        className={`flex flex-col items-center justify-center py-1 md:py-1 rounded-lg border h-[48px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isMithilakartActive
            ? 'bg-white text-[#6FAE4A] border-white shadow-md scale-102 z-10'
            : isFreshGroceryActive
              ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              : isHeaderLight
                ? 'bg-black/5 text-[#6FAE4A]/80 border-black/5 hover:bg-black/10'
                : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <div className="w-[32px] h-[14px] md:w-[40px] md:h-[18px] flex items-center justify-center">
          <img
            src="/mthibg.png"
            alt="Icon"
            className={`h-full w-full object-contain transition-all duration-300 ${
              isMithilakartActive 
                ? 'brightness-0' 
                : isFreshGroceryActive 
                  ? 'brightness-200' 
                  : isHeaderLight 
                    ? 'brightness-50' 
                    : 'brightness-0'
            }`}
          />
        </div>
        <span className={`font-extrabold text-[12px] md:text-[12.5px] italic tracking-tight leading-none mb-0.5 transition-colors duration-300 ${
          isMithilakartActive 
            ? 'text-[#6FAE4A]' 
            : isFreshGroceryActive
              ? 'text-white'
              : isHeaderLight 
                ? 'text-[#6FAE4A]/80' 
                : 'text-white'
        }`}>
          {t('home.title')}
        </span>
      </motion.div>
 
      {/* ── Tab 2: Quick Shop ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/quick-shop', true)}
        className={`flex flex-col items-center justify-center py-1 md:py-1 rounded-lg border h-[48px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isQuickShopActive
            ? 'bg-white text-[#F26522] border-white shadow-md scale-102 z-10'
            : isFreshGroceryActive
              ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              : isMithilakartActive
                ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
                : isHeaderLight
                  ? 'bg-black/5 text-[#F26522]/85 border-black/5 hover:bg-black/10'
                  : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <div
          className={`w-[16px] h-[16px] md:w-[20px] md:h-[20px] rounded-full flex items-center justify-center shadow-xs transition-all duration-300 ${
            isQuickShopActive 
              ? 'bg-[#F26522] text-white' 
              : isFreshGroceryActive
                ? 'bg-white/20 text-white'
                : isMithilakartActive
                  ? 'bg-white/30 text-white'
                  : isHeaderLight
                    ? 'bg-[#F26522]/15 text-[#F26522]'
                    : 'bg-white text-[#F26522]'
          }`}
        >
          <Timer size={10} className="w-[10px] h-[10px] md:w-[11px] md:h-[11px]" />
        </div>
        <span
          className={`text-[11.5px] md:text-[12px] xl:text-[12.5px] font-extrabold tracking-tight leading-none text-center px-0.5 mb-0.5 transition-colors duration-300 ${
            isQuickShopActive 
              ? 'text-[#F26522]' 
              : isFreshGroceryActive
                ? 'text-white'
                : isMithilakartActive
                  ? 'text-white/90'
                  : isHeaderLight 
                    ? 'text-[#F26522]/85' 
                    : 'text-white'
          }`}
        >
          {t('nav.quickShop')}
        </span>
      </motion.div>
 
      {/* ── Tab 3: Mithilak ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/mithilak', false)}
        className={`flex flex-col items-center justify-center py-1 md:py-1 rounded-lg border h-[48px] md:h-[46px] gap-0.5 md:gap-1 cursor-pointer transition-all duration-300 ${
          isMithilakActive
            ? 'bg-white text-[#207C8A] border-white shadow-md scale-102 z-10'
            : isFreshGroceryActive
              ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              : isMithilakartActive
                ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
                : isHeaderLight
                  ? 'bg-black/5 text-[#207C8A]/80 border-black/5 hover:bg-black/10'
                  : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <div className="flex items-center justify-center">
          <Plane 
            size={22} 
            className={`w-[14px] h-[14px] md:w-[18px] md:h-[18px] transition-all duration-300 ${
              isMithilakActive 
                ? "text-[#207C8A] fill-[#207C8A]/20" 
                : isFreshGroceryActive
                  ? "text-white"
                  : isMithilakartActive
                    ? "text-white/90"
                    : isHeaderLight 
                      ? "text-[#207C8A]" 
                      : "text-white"
            }`} 
          />
        </div>
        <span className={`text-[12px] md:text-[12.5px] font-extrabold tracking-tight leading-none mb-0.5 transition-colors duration-300 ${
          isMithilakActive 
            ? 'text-[#207C8A]' 
            : isFreshGroceryActive
              ? 'text-white'
              : isMithilakartActive
                ? 'text-white/90'
                : isHeaderLight 
                  ? 'text-[#207C8A]/80' 
                  : 'text-white'
        }`}>
          {t('nav.mithilak')}
        </span>
      </motion.div>
 
      {/* ── Tab 4: Fresh/Grocery ── */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => handleTabClick('/fresh-grocery', true)}
        className={`flex flex-col items-center justify-center py-1 md:py-1 rounded-lg border h-[48px] md:h-[46px] cursor-pointer transition-all duration-300 ${
          isFreshGroceryActive
            ? 'bg-white text-[#7A3E17] border-white shadow-md scale-102 z-10'
            : isMithilakartActive
              ? 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              : isHeaderLight
                ? 'bg-black/5 text-[#7A3E17]/85 border-black/5 hover:bg-black/10'
                : 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25'
        }`}
      >
        <span className={`text-[11.5px] md:text-[12px] xl:text-[12.5px] font-extrabold tracking-tight leading-tight text-center px-0.5 transition-colors duration-300 flex flex-col items-center justify-center ${
          isFreshGroceryActive 
            ? 'text-[#7A3E17]' 
            : isMithilakartActive
              ? 'text-white/90'
              : isHeaderLight
                ? 'text-[#7A3E17]'
                : 'text-white'
        }`}>
          {t('nav.groceriesAndFresh').split(' ').map((word, idx) => (
            <span key={idx} className="block leading-none">{word}</span>
          ))}
        </span>
      </motion.div>
    </div>
  );
};

export default HeaderTabs;
