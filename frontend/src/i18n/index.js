import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './locales/en/common.json';

const resources = {
  en: { common: commonEn },
};

const savedLanguage = (() => {
  try {
    return localStorage.getItem('user_language') || 'en';
  } catch {
    return 'en';
  }
})();

export const loadLanguageBundle = async (lang) => {
  if (!lang || lang === 'en' || i18n.hasResourceBundle(lang, 'common')) return;
  if (lang === 'hi') {
    const mod = await import('./locales/hi/common.json');
    i18n.addResourceBundle('hi', 'common', mod.default || mod, true, true);
  } else if (lang === 'mai') {
    const mod = await import('./locales/mai/common.json');
    i18n.addResourceBundle('mai', 'common', mod.default || mod, true, true);
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

if (savedLanguage && savedLanguage !== 'en') {
  loadLanguageBundle(savedLanguage)
    .then(() => i18n.changeLanguage(savedLanguage))
    .catch(() => {});
}

export default i18n;
