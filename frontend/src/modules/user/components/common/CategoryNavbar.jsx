import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
   Custom SVG icons
───────────────────────────────────────────── */
const IconForYou = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const IconFashion = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
  </svg>
);

const IconBeauty = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6l1 7H8L9 3z"/>
    <path d="M8 10v9a1 1 0 001 1h6a1 1 0 001-1v-9"/>
    <path d="M10 3V2M14 3V2"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
  </svg>
);

const IconElectronics = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const IconJewellery = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9z"/>
    <path d="M11 3L8 9l4 13 4-13-3-6"/>
    <line x1="2" y1="9" x2="22" y2="9"/>
  </svg>
);

const IconToys = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <path d="M12 6V4M8 4h8"/>
    <circle cx="8.5" cy="12" r="1.5"/>
    <circle cx="15.5" cy="12" r="1.5"/>
    <line x1="12" y1="10" x2="12" y2="14"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

const IconStationery = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5 12 12 5 19 12"/>
    <path d="M5 19h14"/>
    <path d="M9 19v-4h6v4"/>
  </svg>
);

const IconGifting = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
  </svg>
);

const IconElectrical = ({ size = 24, active, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

/* ─────────────────────────────────────────────
   Icon map for nav chips (labels come from API)
───────────────────────────────────────────── */
const ICON_MAP = {
  'for-you': IconForYou,
  beauty: IconBeauty,
  gifting: IconGifting,
  electronics: IconElectronics,
  jewellery: IconJewellery,
  toys: IconToys,
  stationery: IconStationery,
  fashion: IconFashion,
  electrical: IconElectrical,
};

const FALLBACK_NAV = [
  { id: 'for-you',     label: 'You Buy',     Svg: IconForYou     },
  { id: 'beauty',      label: 'Beauty',      Svg: IconBeauty     },
  { id: 'gifting',     label: 'Gifting',     Svg: IconGifting    },
  { id: 'electronics', label: 'Electronics', Svg: IconElectronics},
  { id: 'jewellery',   label: 'Jewellery',   Svg: IconJewellery  },
  { id: 'toys',        label: 'Toys',        Svg: IconToys       },
  { id: 'stationery',  label: 'Stationery',  Svg: IconStationery },
  { id: 'fashion',     label: 'Fashion',     Svg: IconFashion    },
  { id: 'electrical',  label: 'Electrical',  Svg: IconElectrical },
];

const getMithilakartHeaderBg = (category) => {
  switch (category) {
    case 'Beauty':
      return 'bg-[#F9A8D4]'; // Soft Rose Pink
    case 'Gifting':
      return 'bg-[#D8B4FE]'; // Soft Purple
    case 'Electronics':
      return 'bg-[#93C5FD]'; // Soft Blue
    case 'Jewellery':
      return 'bg-[#FDBA74]'; // Soft Orange/Peach
    case 'Toys':
      return 'bg-[#99F6E4]'; // Soft Teal
    case 'Stationery':
      return 'bg-[#C7D2FE]'; // Soft Indigo
    case 'Fashion':
      return 'bg-[#FCA5A5]'; // Soft Red
    case 'Electrical':
      return 'bg-[#FEF08A]'; // Soft Yellow
    case 'You Buy':
    default:
      return 'bg-primary-green'; // Default Green (Mithilakart default brand color)
  }
};

const getMithilakartActiveTextColor = (category) => {
  switch (category) {
    case 'Beauty':
      return 'text-[#A2396B]';
    case 'Gifting':
      return 'text-[#5E32A6]';
    case 'Electronics':
      return 'text-[#1C4E9C]';
    case 'Jewellery':
      return 'text-[#A04E15]';
    case 'Toys':
      return 'text-[#0D7F77]';
    case 'Stationery':
      return 'text-[#3B4CA8]';
    case 'Fashion':
      return 'text-[#B62626]';
    case 'Electrical':
      return 'text-[#9B7C16]';
    default:
      return 'text-[#6FAE4A]';
  }
};

import { useTranslation } from 'react-i18next';
import useVendorStore from '../../../../store/useVendorStore';
import { mapNavChips } from '../../utils/mappers';

const CategoryNavbar = ({ selectedCategory, setSelectedCategory }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { homeChips } = useVendorStore();

  const navItems = mapNavChips(homeChips, FALLBACK_NAV).map((chip) => ({
    ...chip,
    Svg: ICON_MAP[chip.id] || IconForYou,
  }));

  const handleSelect = (cat) => {
    setSelectedCategory(cat.label);
    if (cat.id === 'toys') {
      navigate('/toys');
      return;
    }
    if (cat.id === 'beauty') {
      navigate('/beauty');
      return;
    }
    if (!location.pathname.includes('/home')) {
      navigate('/home');
    }
  };

  return (
    <div
      className={`flex items-center overflow-x-auto no-scrollbar pt-0.5 pb-1.5 px-2 gap-1 md:pt-1 md:pb-2 md:px-3 md:gap-1.5 transition-colors duration-300 ${getMithilakartHeaderBg(selectedCategory)}`}
      role="navigation"
      aria-label="Product categories"
    >
      {navItems.map((cat) => {
        const isActive = selectedCategory === cat.label;
        const NavIcon = cat.Svg;

        return (
          <motion.button
            key={cat.id}
            onClick={() => handleSelect(cat)}
            whileTap={{ scale: 0.92 }}
            className={`flex flex-col items-center justify-center flex-shrink-0 w-[48px] h-[52px] md:w-[58px] md:h-[64px] rounded-[8px] md:rounded-[12px] transition-all duration-200 focus:outline-none ${
              isActive 
                ? 'bg-white/85 backdrop-blur-md shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),0_3px_8px_rgba(8,66,36,0.05)] border border-white' 
                : 'bg-white/35 border border-white/10'
            }`}
            aria-pressed={isActive}
            aria-label={cat.label}
          >
            {/* SVG Icon */}
            <div
              className={`mb-0.5 md:mb-1 leading-none transition-colors duration-200 ${
                isActive ? getMithilakartActiveTextColor(selectedCategory) : 'text-primary-dark/80'
              }`}
            >
              <NavIcon size={18} active={isActive} className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" />
            </div>

            {/* Label */}
            <span
              className={`text-[8px] md:text-[9.5px] tracking-tight whitespace-nowrap leading-tight text-center transition-colors duration-200 ${
                isActive ? `font-black ${getMithilakartActiveTextColor(selectedCategory)}` : 'font-extrabold text-primary-dark/80'
              }`}
            >
              {t(`categories.${cat.id}`)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryNavbar;

