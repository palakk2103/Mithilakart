import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** "100% Safe Payments" strip at the bottom of the cart, order summary, payment and wishlist pages. */
const SafePayments = ({ title = '' }) => {
  const { t } = useTranslation();
  return (
    <div data-testid="safe-payments" className="py-3 flex flex-col items-center gap-1 text-slate-500">
      <p className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
        <ShieldCheck size={18} className="text-emerald-600" /> {title || t('cart.safePayments')}
      </p>
      <p className="text-[12px] text-center leading-relaxed">{t('cart.paymentsSubtitle')}</p>
    </div>
  );
};

export default SafePayments;
