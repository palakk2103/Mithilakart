import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ShieldCheck } from 'lucide-react';
import useTabTheme from '../../../../shared/hooks/useTabTheme';
import { handleImageError } from '../../../../shared/utils/imageUtils';
import SocialIcons from '../../../../shared/components/SocialIcons';

export const FlowerIcon = ({ className = 'w-5 h-5', color = '#F26522' }) => (
  <svg viewBox="0 0 24 24" className={`${className} inline-block`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 6L18 18M18 6L6 18" stroke="#556b2f" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="7" r="2" fill={color} />
    <circle cx="12" cy="17" r="2" fill={color} />
    <circle cx="7" cy="12" r="2" fill={color} />
    <circle cx="17" cy="12" r="2" fill={color} />
    <circle cx="8.5" cy="8.5" r="2" fill={color} />
    <circle cx="15.5" cy="15.5" r="2" fill={color} />
    <circle cx="15.5" cy="8.5" r="2" fill={color} />
    <circle cx="8.5" cy="15.5" r="2" fill={color} />
    <circle cx="12" cy="12" r="3.5" fill="#FFF5EE" stroke="#556b2f" strokeWidth="1" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

const OUTER_BG = {
  quickshop: 'bg-[#f7f4eb]',
  mithilak: 'bg-[#eef5f6]',
  freshgrocery: 'bg-[#faf6eb]',
  mithilakart: 'bg-[#f2f7f1]',
};
const CARD_BG = {
  quickshop: 'bg-[#FFF9F3]/95',
  mithilak: 'bg-[#fafdff]/95',
  freshgrocery: 'bg-[#FFFdfa]/95',
  mithilakart: 'bg-[#fbfdfa]/95',
};

/** Mithila-art screen used by Login, Create Account and Verify (AUTH-1…3): brand header, then a clean card. */
const AuthShell = ({ title, subtitle, badge, onBack, social = false, classic = false, children }) => {
  const navigate = useNavigate();
  const theme = useTabTheme();
  const hex = theme.primaryHex;

  // The original Login design: dashed inner frame, corner flowers, watermark and the logo below the card.
  if (classic) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-between p-2.5 py-3 md:p-6 relative overflow-hidden ${OUTER_BG[theme.activeFlow] || OUTER_BG.mithilakart}`}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none" style={{ backgroundImage: "url('/login_signup_bg.png')" }} />

        <div className="w-full max-w-[420px] flex items-center z-10">
          <button
            type="button"
            onClick={onBack || (() => navigate('/home'))}
            aria-label={onBack ? 'Back' : 'Close'}
            className="w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md active:scale-95 transition-all"
            style={{ backgroundColor: `${hex}1a`, color: hex }}
          >
            {onBack ? <ArrowLeft size={20} strokeWidth={2.5} /> : <X size={20} strokeWidth={2.5} />}
          </button>
        </div>

        <div className={`w-full max-w-[420px] rounded-[36px] p-2.5 shadow-2xl border backdrop-blur-md z-10 my-2.5 md:my-6 relative overflow-hidden ${CARD_BG[theme.activeFlow] || CARD_BG.mithilakart}`} style={{ borderColor: `${hex}33` }}>
          <div className="border border-dashed rounded-[28px] px-5 py-5 md:px-6 md:py-8 relative" style={{ borderColor: `${hex}66` }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden" aria-hidden="true">
              <svg className="w-80 h-80 fill-current" style={{ color: hex }} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M50 10 C55 25, 45 25, 50 10 Z" />
                <path d="M50 90 C55 75, 45 75, 50 90 Z" />
                <path d="M10 50 C25 55, 25 45, 10 50 Z" />
                <path d="M90 50 C75 55, 75 45, 90 50 Z" />
                <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M50 30 C55 40, 45 40, 50 30 Z" />
                <path d="M50 70 C55 60, 45 60, 50 70 Z" />
                <path d="M30 50 C40 55, 40 45, 30 50 Z" />
                <path d="M70 50 C60 55, 60 45, 70 50 Z" />
              </svg>
            </div>
            {['top-2.5 left-2.5', 'top-2.5 right-2.5', 'bottom-2.5 left-2.5', 'bottom-2.5 right-2.5'].map((pos) => (
              <div key={pos} className={`absolute ${pos}`}><FlowerIcon className="w-4 h-4" color={hex} /></div>
            ))}

            <div className="text-center mb-4 md:mb-8 z-10 relative">
              <h1 className="text-2xl md:text-3xl font-extrabold font-serif text-[#321c13] flex items-center justify-center gap-2">
                <FlowerIcon className="w-5 h-5" color={hex} />
                <span>{title}</span>
                <FlowerIcon className="w-5 h-5" color={hex} />
              </h1>
              <div className="flex items-center justify-center gap-2 my-2 md:my-2.5">
                <div className="w-16 border-t border-dashed" style={{ borderColor: `${hex}66` }} />
                <FlowerIcon className="w-3.5 h-3.5" color={hex} />
                <div className="w-16 border-t border-dashed" style={{ borderColor: `${hex}66` }} />
              </div>
              {subtitle && <p className="text-[#705c53] text-[13px] font-semibold mt-1">{subtitle}</p>}
            </div>

            <div className="relative z-10">{children}</div>

            {social && (
              <div className="mt-5 pt-4 border-t border-dashed z-10 relative flex flex-col items-center gap-2.5" style={{ borderColor: `${hex}33` }}>
                <p className="text-center text-[10px] font-extrabold text-[#705c53] uppercase tracking-wider">Connect with us</p>
                <SocialIcons />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 my-1 md:my-4 z-10">
          <img src="/mthibg.png" alt="Mithilakart" className="h-10 md:h-16 w-auto object-contain" onError={handleImageError} />
          <div className="flex items-center text-[13px] md:text-[14px] font-bold text-black tracking-wide italic">
            Mithilakart<span className="text-[10px] align-super ml-0.5">™</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center px-4 pt-3 pb-6 relative overflow-hidden ${OUTER_BG[theme.activeFlow] || OUTER_BG.mithilakart}`}>
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none" style={{ backgroundImage: "url('/login_signup_bg.png')" }} />

      <div className="w-full max-w-[420px] flex items-center z-10">
        <button
          type="button"
          onClick={onBack || (() => navigate('/home'))}
          aria-label={onBack ? 'Back' : 'Close'}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/90 shadow-sm active:scale-95 transition-all"
          style={{ color: hex }}
        >
          {onBack ? <ArrowLeft size={20} strokeWidth={2.5} /> : <X size={20} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Brand header, as in the reference */}
      <div className="z-10 flex flex-col items-center text-center mt-1 mb-3">
        <div className="flex items-center gap-2">
          <img src="/mthibg.png" alt="" className="h-9 w-auto object-contain" onError={handleImageError} />
          <span className="font-serif text-[24px] font-extrabold tracking-[0.1em] text-[#321c13]">MITHILAKART</span>
        </div>
        <p className="text-[12.5px] font-semibold text-[#5b4a40] mt-0.5">Fresh Food &amp; Handcrafted Items Delivered</p>
      </div>

      <div className={`w-full max-w-[420px] rounded-[26px] border shadow-xl backdrop-blur-sm z-10 relative ${CARD_BG[theme.activeFlow] || CARD_BG.mithilakart}`} style={{ borderColor: `${hex}40` }}>
        <div className="px-4 py-5 md:px-6">
          <div className="text-center mb-4">
            <h1 className="text-[24px] font-extrabold font-serif text-[#321c13] flex items-center justify-center gap-2 leading-tight">
              <FlowerIcon className="w-5 h-5" color={hex} />
              <span>{title}</span>
              <FlowerIcon className="w-5 h-5" color={hex} />
            </h1>
            {badge && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11.5px] font-bold border" style={{ backgroundColor: `${hex}14`, color: hex, borderColor: `${hex}55` }}>
                <ShieldCheck size={13} /> {badge}
              </span>
            )}
            {subtitle && <p className="text-[#5b4a40] text-[13px] font-semibold mt-1.5">{subtitle}</p>}
          </div>

          <div className="relative">{children}</div>

          {social && (
            <div className="mt-4 pt-3 border-t border-dashed flex flex-col items-center gap-2" style={{ borderColor: `${hex}33` }}>
              <p className="text-center text-[10px] font-extrabold text-[#705c53] uppercase tracking-wider">Connect with us</p>
              <SocialIcons />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Error / success strip. Sentence case so long messages stay readable. */
export const Notice = ({ kind = 'error', children }) => {
  if (!children) return null;
  const styles = kind === 'error'
    ? 'bg-red-50 border-red-100 text-red-600'
    : kind === 'info'
      ? 'bg-amber-50 border-amber-100 text-amber-800'
      : 'bg-green-50 border-green-100 text-green-700';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`border text-[12.5px] font-semibold p-3 rounded-2xl text-center ${styles}`}>
      {children}
    </div>
  );
};

export const fieldClass = 'w-full pl-11 pr-4 h-12 bg-[#FFFdfa] border focus:ring-1 rounded-[16px] text-[15px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all disabled:opacity-70';

export default AuthShell;
