import React from 'react';
import { PackageX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ProductNotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const textPrimary = isMithilakFlow 
    ? 'text-[color:var(--mk-primary,#6FAE4A)]' 
    : isFreshGroceryFlow 
      ? 'text-[color:var(--fg-dark,#7A3E17)]' 
      : isQuickShopFlow 
        ? 'text-[color:var(--qs-primary,#F26522)]' 
        : 'text-[color:var(--mk-primary,#6FAE4A)]';

  const buttonBg = isMithilakFlow 
    ? 'bg-[color:var(--mk-primary,#6FAE4A)] hover:bg-[color:var(--mk-dark,#5b953d)]' 
    : isFreshGroceryFlow 
      ? 'bg-[color:var(--fg-primary,#D9A21B)] hover:bg-[color:var(--fg-dark,#c49218)] text-[color:var(--fg-dark,#7A3E17)]' 
      : isQuickShopFlow 
        ? 'bg-[color:var(--qs-primary,#F26522)] hover:bg-[color:var(--qs-dark,#d9561b)]' 
        : 'bg-[color:var(--mk-primary,#6FAE4A)] hover:bg-[#2d4332]';

  const borderPrimary = isMithilakFlow 
    ? 'border-[color:var(--mk-primary,#6FAE4A)] text-[color:var(--mk-primary,#6FAE4A)] hover:bg-[color:var(--mk-primary,#6FAE4A)]/5' 
    : isFreshGroceryFlow 
      ? 'border-[color:var(--fg-primary,#D9A21B)] text-[color:var(--fg-dark,#7A3E17)] hover:bg-[color:var(--fg-primary,#D9A21B)]/5' 
      : isQuickShopFlow 
        ? 'border-[color:var(--qs-primary,#F26522)] text-[color:var(--qs-primary,#F26522)] hover:bg-[color:var(--qs-primary,#F26522)]/5' 
        : 'border-[color:var(--mk-primary,#6FAE4A)] text-[color:var(--mk-primary,#6FAE4A)] hover:bg-[color:var(--mk-primary,#6FAE4A)]/5';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] my-12 max-w-md mx-auto"
    >
      <div className="relative flex justify-center mb-6">
        <div className={`p-5 rounded-full bg-slate-50 border border-slate-100 ${textPrimary}`}>
          <PackageX size={52} className="stroke-[1.5]" />
        </div>
      </div>

      <h3 className="text-xl font-black tracking-tight text-slate-800 mb-2">{t('auto.productNotAvailable')}</h3>
      
      <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 max-w-xs mx-auto">
        {t('auto.weReSorryButThe')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => navigate(-1)}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl border ${borderPrimary} font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm`}
        >
          <ArrowLeft size={12} />
          {t('auto.back')}
        </button>
        
        <button
          onClick={() => navigate('/home')}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl ${buttonBg} text-white font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md`}
        >
          <Home size={12} />
          {t('auto.home')}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductNotFound;
