import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flagUrl: 'https://flagcdn.com/w40/au.png' },
  { code: 'hi', name: 'हिन्दी', flagUrl: 'https://flagcdn.com/w40/in.png' },
  { code: 'mai', name: 'मैथिली', flagUrl: 'https://flagcdn.com/w40/in.png' }
];

const LanguageSelector = ({ isDarkHeader = false, variant = '', compact = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Normalize language code to match base code (e.g., 'en-US' -> 'en', 'hi-IN' -> 'hi')
  const baseLanguageCode = (i18n.language || 'en').split('-')[0].toLowerCase();
  const currentLanguage = languages.find(lang => lang.code === baseLanguageCode) || languages[0];

  const buttonStyle = compact 
    ? 'bg-white text-gray-900 border-none rounded-lg text-[12px] font-bold px-3.5 py-1.5 leading-normal shadow-xs hover:bg-gray-100'
    : 'bg-white text-gray-900 border-none rounded-lg text-[13px] font-bold px-4 py-2 leading-normal shadow-sm hover:bg-gray-100';

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('user_language', code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 font-bold transition-all duration-300 ${buttonStyle}`}
      >
        <img
          src={currentLanguage.flagUrl}
          alt={currentLanguage.name}
          className="w-[18px] h-[13px] object-cover rounded-[2px] shadow-xs border border-slate-200 flex-shrink-0"
        />
        <span>{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-32 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors duration-200 ${
                    baseLanguageCode === lang.code
                      ? 'bg-emerald-550/10 text-emerald-800 font-extrabold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <img
                      src={lang.flagUrl}
                      alt={lang.name}
                      className="w-4 h-3 object-cover rounded-[1px] shadow-xs border border-slate-200 flex-shrink-0"
                    />
                    <span>{lang.name}</span>
                  </span>
                  {baseLanguageCode === lang.code && <Check size={12} className="text-emerald-800 stroke-[3px]" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;

