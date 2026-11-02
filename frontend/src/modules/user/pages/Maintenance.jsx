import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Maintenance = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow 
    ? 'bg-gradient-to-b from-[#e0f2f1]/40 via-[#f2faf9] to-[#ffffff]' 
    : isFreshGroceryFlow 
      ? 'bg-gradient-to-b from-[#FFF0A0]/20 via-[#FFFDF3] to-[#FFF]' 
      : isQuickShopFlow 
        ? 'bg-gradient-to-b from-[#fff5f7] via-[#fffcfc] to-[#fff]' 
        : 'bg-gradient-to-b from-[#eaf5ee]/50 via-[#f7faf8] to-[#ffffff]';

  const textPrimary = isMithilakFlow 
    ? 'text-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'text-[#7A3E17]' 
      : isQuickShopFlow 
        ? 'text-[#F26522]' 
        : 'text-[#6FAE4A]';

  const buttonBg = isMithilakFlow 
    ? 'bg-[#207C8A] hover:bg-[#1a6874]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c49218] text-[#7A3E17]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d9561b]' 
        : 'bg-[#6FAE4A] hover:bg-[#2d4332]';

  return (
    <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center"
      >
        <div className="relative flex justify-center mb-6">
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4, 
              ease: "easeInOut" 
            }}
            className={`p-6 rounded-full bg-slate-50 border border-slate-100 ${textPrimary}`}
          >
            <Wrench size={64} className="stroke-[1.5]" />
          </motion.div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-2">{t('auto.weLlBeBackSoon')}</h1>
        
        <h2 className={`text-[10px] font-black uppercase tracking-widest ${textPrimary} mb-4`}>
          {t('auto.underMaintenance')}
        </h2>
        
        <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 max-w-xs mx-auto">
          {t('auto.weAreCurrentlyPerformingScheduled')}
        </p>

        <div className="flex justify-center">
          <button
            onClick={() => navigate('/home')}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl ${buttonBg} text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md`}
          >
            <Home size={14} />
            {t('auto.home')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Maintenance;
