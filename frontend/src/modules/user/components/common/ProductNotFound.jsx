import React from 'react';
import { PackageX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useTabTheme from '../../../../shared/hooks/useTabTheme';

const HOME = { mithilakart: '/home', quickshop: '/quick-shop', mithilak: '/mithilak', freshgrocery: '/fresh-grocery' };

/** Deleted / inactive / unavailable product. Sits at the top of the screen so it is seen at once. */
const ProductNotFound = ({ message }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { primaryHex, activeFlow } = useTabTheme();

  return (
    <div role="alert" data-testid="product-not-found" className="mx-4 mt-6 max-w-md sm:mx-auto text-center py-7 px-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <span className="inline-flex p-4 rounded-full" style={{ background: `${primaryHex}1a`, color: primaryHex }}><PackageX size={40} strokeWidth={1.6} /></span>
      <h1 className="mt-3 text-[18px] font-bold text-slate-900">{t('auto.productNotAvailable')}</h1>
      <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">{message || t('auto.weReSorryButThe')}</p>
      <div className="mt-5 flex gap-2.5 justify-center">
        <button type="button" onClick={() => navigate(-1)} className="h-11 px-5 rounded-full border text-[14px] font-bold bg-white flex items-center gap-1.5 active:scale-95" style={{ borderColor: primaryHex, color: primaryHex }}>
          <ArrowLeft size={16} /> {t('auto.back')}
        </button>
        <button type="button" onClick={() => navigate(HOME[activeFlow] || '/home')} className="h-11 px-5 rounded-full text-white text-[14px] font-bold flex items-center gap-1.5 active:scale-95" style={{ background: primaryHex }}>
          <Home size={16} /> {t('auto.home')}
        </button>
      </div>
    </div>
  );
};

export default ProductNotFound;
