import React from 'react';
import { Search, RotateCcw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NoSearchResults = ({ query, onClearSearch, onContinueShopping }) => {
  const { t } = useTranslation();
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const textPrimary = isMithilakFlow 
    ? 'text-[#6FAE4A]' 
    : isFreshGroceryFlow 
      ? 'text-[#7A3E17]' 
      : isQuickShopFlow 
        ? 'text-[#F26522]' 
        : 'text-[#6FAE4A]';

  const buttonBg = isMithilakFlow 
    ? 'bg-[#6FAE4A] hover:bg-[#5b953d]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c49218] text-[#7A3E17]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d9561b]' 
        : 'bg-[#6FAE4A] hover:bg-[#2d4332]';

  const borderPrimary = isMithilakFlow 
    ? 'border-[#6FAE4A] text-[#6FAE4A] hover:bg-[#6FAE4A]/5' 
    : isFreshGroceryFlow 
      ? 'border-[#D9A21B] text-[#7A3E17] hover:bg-[#D9A21B]/5' 
      : isQuickShopFlow 
        ? 'border-[#F26522] text-[#F26522] hover:bg-[#F26522]/5' 
        : 'border-[#6FAE4A] text-[#6FAE4A] hover:bg-[#6FAE4A]/5';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100/85 shadow-[0_6px_20px_rgba(0,0,0,0.015)] mt-8 max-w-xl mx-auto"
    >
      <div className="relative flex justify-center mb-6">
        <div className={`p-5 rounded-full bg-slate-50 border border-dashed border-slate-200 text-slate-350`}>
          <Search size={48} className="stroke-[1.5]" />
        </div>
      </div>

      <h3 className={`text-lg font-black uppercase tracking-widest ${textPrimary}`}>
        {t('auto.noResultsFound')}
      </h3>
      
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
        {t('x.noProductsMatching', { query })}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
        <button 
          onClick={onClearSearch}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl border ${borderPrimary} font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm`}
        >
          <RotateCcw size={12} />
          {t('auto.clearSearch')}
        </button>
        
        <button 
          onClick={onContinueShopping}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl ${buttonBg} text-white font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md`}
        >
          {t('auto.continueShopping')}
          <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
};

export default NoSearchResults;
