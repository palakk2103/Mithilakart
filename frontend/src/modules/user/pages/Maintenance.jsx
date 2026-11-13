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
    ? 'bg-gradient-to-b from-[color:var(--ml-light,#e0f2f1)]/40 via-[color:var(--ml-light,#f2faf9)] to-[#ffffff]' 
    : isFreshGroceryFlow 
      ? 'bg-gradient-to-b from-[color:var(--fg-light,#FFF0A0)]/20 via-[#FFFDF3] to-[#FFF]' 
      : isQuickShopFlow 
        ? 'bg-gradient-to-b from-[color:var(--qs-light,#fff5f7)] via-[#fffcfc] to-[#fff]' 
        : 'bg-gradient-to-b from-[#eaf5ee]/50 via-[#f7faf8] to-[#ffffff]';

  const textPrimary = isMithilakFlow 
    ? 'text-[color:var(--ml-primary,#207C8A)]' 
    : isFreshGroceryFlow 
      ? 'text-[color:var(--fg-dark,#7A3E17)]' 
      : isQuickShopFlow 
        ? 'text-[color:var(--qs-primary,#F26522)]' 
        : 'text-[color:var(--mk-primary,#6FAE4A)]';

  const buttonBg = isMithilakFlow 
    ? 'bg-[color:var(--ml-primary,#207C8A)] hover:bg-[color:var(--ml-dark,#1a6874)]' 
    : isFreshGroceryFlow 
      ? 'bg-[color:var(--fg-primary,#D9A21B)] hover:bg-[color:var(--fg-dark,#c49218)] text-[color:var(--fg-dark,#7A3E17)]' 
      : isQuickShopFlow 
        ? 'bg-[color:var(--qs-primary,#F26522)] hover:bg-[color:var(--qs-dark,#d9561b)]' 
        : 'bg-[color:var(--mk-primary,#6FAE4A)] hover:bg-[#2d4332]';

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
