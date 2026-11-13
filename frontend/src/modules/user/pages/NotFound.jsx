import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
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

  const borderPrimary = isMithilakFlow 
    ? 'border-[color:var(--ml-primary,#207C8A)] text-[color:var(--ml-primary,#207C8A)] hover:bg-[color:var(--ml-primary,#207C8A)]/5' 
    : isFreshGroceryFlow 
      ? 'border-[color:var(--fg-primary,#D9A21B)] text-[color:var(--fg-dark,#7A3E17)] hover:bg-[color:var(--fg-primary,#D9A21B)]/5' 
      : isQuickShopFlow 
        ? 'border-[color:var(--qs-primary,#F26522)] text-[color:var(--qs-primary,#F26522)] hover:bg-[color:var(--qs-primary,#F26522)]/5' 
        : 'border-[color:var(--mk-primary,#6FAE4A)] text-[color:var(--mk-primary,#6FAE4A)] hover:bg-[color:var(--mk-primary,#6FAE4A)]/5';

  return (
    <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center"
      >
        <div className="relative flex justify-center mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className={`p-6 rounded-full bg-slate-50 border border-slate-100 ${textPrimary}`}
          >
            <Compass size={64} className="stroke-[1.5]" />
          </motion.div>
        </div>

        <h1 className="text-7xl font-black tracking-tighter text-slate-800 mb-2">404</h1>
        
        <h2 className={`text-lg font-black uppercase tracking-widest ${textPrimary} mb-4`}>
          {t('auto.pageNotFound')}
        </h2>
        
        <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-8 max-w-xs mx-auto">
          {t('auto.thePageYouAreLooking')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl border ${borderPrimary} font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm`}
          >
            <ArrowLeft size={14} />
            {t('auto.back')}
          </button>
          
          <button
            onClick={() => navigate('/home')}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl ${buttonBg} text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md`}
          >
            <Home size={14} />
            {t('auto.goHome')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
