import React from 'react';
import { MapPinOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ShippingUnavailable = ({ onChangeLocation }) => {
  const { t } = useTranslation();
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-[#fff8f8] border border-red-100 rounded-3xl flex flex-col items-center text-center max-w-sm mx-auto shadow-xs"
    >
      <div className="p-3 bg-red-50 rounded-full text-red-500 mb-3 border border-red-100/50">
        <MapPinOff size={28} className="stroke-[1.5]" />
      </div>
      
      <p className="text-xs font-bold text-slate-800 leading-snug">
        {t('auto.currentlyThisProductCannotBe')}
      </p>
      
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 mb-4">
        {t('auto.tryCheckingAnotherAddressOr')}
      </p>

      <button
        onClick={onChangeLocation}
        className={`px-5 py-2 rounded-xl ${buttonBg} text-white font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all shadow-xs`}
      >
        {t('auto.changeLocation')}
      </button>
    </motion.div>
  );
};

export default ShippingUnavailable;
