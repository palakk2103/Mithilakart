import React from 'react';
import { useTranslation } from 'react-i18next';

// Lightweight Suspense fallback; reserves viewport height so the footer
// doesn't jump while a route chunk loads.
const PageLoader = () => {
  const { t } = useTranslation();
  return (
  <div className="flex min-h-[60vh] w-full items-center justify-center" role="status" aria-label={t('auto.loading3')}>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#65B842]" />
  </div>
  );
};

export default PageLoader;
