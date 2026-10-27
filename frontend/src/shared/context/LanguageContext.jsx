import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../../i18n';
import useVendorStore from '../../store/useVendorStore';

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flagUrl: 'https://flagcdn.com/w40/gb.png' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagUrl: 'https://flagcdn.com/w40/in.png' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', flagUrl: 'https://flagcdn.com/w40/in.png' },
];

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_language');
      const normalized = (saved || i18n.language || 'en').split('-')[0].toLowerCase();
      return ['en', 'hi', 'mai'].includes(normalized) ? normalized : 'en';
    }
    return 'en';
  });

  const changeLanguage = useCallback(async (code) => {
    const normalized = (code || 'en').split('-')[0].toLowerCase();
    const finalCode = ['en', 'hi', 'mai'].includes(normalized) ? normalized : 'en';

    setCurrentLanguage(finalCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_language', finalCode);
      document.documentElement.lang = finalCode;
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: finalCode } }));
    }

    await i18n.changeLanguage(finalCode);

    // Refresh dynamic catalog data in storefront store without page reload
    try {
      const vendorStore = useVendorStore.getState();
      if (typeof vendorStore.refreshForLanguage === 'function') {
        vendorStore.refreshForLanguage(finalCode);
      } else if (typeof vendorStore.fetchHomeSections === 'function') {
        vendorStore.fetchHomeSections(vendorStore.activeFlow);
      }
    } catch (_e) {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    changeLanguage,
    languages: LANGUAGES,
    isMaithili: currentLanguage === 'mai',
    isHindi: currentLanguage === 'hi',
    isEnglish: currentLanguage === 'en',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    const current = (i18n.language || 'en').split('-')[0].toLowerCase();
    return {
      currentLanguage: current,
      changeLanguage: (c) => i18n.changeLanguage(c),
      languages: LANGUAGES,
      isMaithili: current === 'mai',
      isHindi: current === 'hi',
      isEnglish: current === 'en',
    };
  }
  return context;
};

export default LanguageContext;
