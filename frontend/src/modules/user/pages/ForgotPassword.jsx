import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { handleImageError } from '../../../shared/utils/imageUtils';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inputVal, setInputVal] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setError(useEmail ? 'Please enter your email address' : 'Please enter your phone number');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  // Inline SVG pattern for background (matching Login.jsx)
  const backgroundPattern = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M10 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zm30 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zM25 45c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3zM45 15c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3z" fill="%23ffffff" fill-opacity="0.12" fill-rule="evenodd"/></svg>`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 bg-[#f7f4eb] relative overflow-hidden">
      {/* Background Image with lower opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/login_signup_bg.png')` }}
      />

      {/* Top Header Row */}
      <div className="w-full max-w-[420px] flex items-center justify-between z-10">
        <button 
          onClick={() => navigate('/login')}
          className="bg-[#F26522]/10 hover:bg-[#F26522]/20 text-[#F26522] p-2 rounded-full backdrop-blur-md active:scale-95 transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logomith-removebg-preview.png" alt="Mithilakart" className="h-8 w-auto object-contain" onError={handleImageError} />
          <span className="text-[#F26522] font-bold tracking-wider text-sm">MITHILAKART</span>
        </div>
        <div className="w-9"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main card */}
      <div className="w-full max-w-[420px] bg-[#FFF5EE]/95 rounded-[32px] px-6 py-8 shadow-2xl border border-white/40 backdrop-blur-md z-10 my-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#F26522]">
            {t('auto.resetPassword')}
          </h2>
          <p className="text-[#F26522]/80 text-[13px] font-semibold mt-1">
            {submitted ? t('auto.checkYourInstructionsBelow') : t('auto.enterYourDetailsToReceive')}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-[11px] font-bold p-3.5 rounded-2xl text-center uppercase tracking-wider">
                {error}
              </div>
            )}

            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-[12px] font-black text-[#F26522] uppercase tracking-wider pl-1 block">
                {useEmail ? t('auto.emailAddress') : t('auto.phoneNumber')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center text-[#F26522]/70">
                  {useEmail ? <Mail size={18} /> : <Phone size={18} />}
                </span>
                <input 
                  type={useEmail ? 'email' : 'tel'}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={useEmail ? 'Enter your email address' : 'Enter your phone number'}
                  className="w-full pl-12 pr-4.5 py-4 bg-[#FFF5EE] border border-[#F26522]/35 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent transition-all placeholder-[#F26522]/40 text-[14.5px] font-bold shadow-2xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#F26522] text-white hover:bg-[#d45014] py-4 rounded-2xl font-black text-[13.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] cursor-pointer"
            >
              {t('auto.sendResetLink')}
            </motion.button>

            {/* Toggle Input Type Link */}
            <div className="text-right px-1">
              <button
                type="button"
                onClick={() => {
                  setUseEmail(!useEmail);
                  setInputVal('');
                  setError('');
                }}
                className="text-[12px] font-bold text-[#F26522] hover:underline"
              >
                {useEmail ? t('auto.usePhoneNumberInstead') : t('auto.useEmailAddressInstead')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="bg-[#FFF5EE] border border-[#F26522]/35 p-5 rounded-2xl text-[14px] font-bold text-[#F26522] leading-relaxed">
              {t('x.recoverySentTo')} <span className="underline">{inputVal}</span>. {t('x.recoverySentRest')}
            </div>

            <motion.button
              onClick={() => navigate('/login')}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#F26522] text-white hover:bg-[#d45014] py-4 rounded-2xl font-black text-[13.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] cursor-pointer"
            >
              {t('auto.returnToLogin')}
            </motion.button>
          </div>
        )}

        <div className="text-center mt-5 text-[12px] font-bold text-[#F26522]/80">
          {t('auth.rememberedPassword')}{' '}
          <Link to="/login" className="text-[#F26522] hover:underline">
            {t('auto.logInHere')}
          </Link>
        </div>
      </div>

      {/* Footer Logo & Styling */}
      <div className="flex flex-col items-center gap-1 my-4 z-10">
        <img 
          src="/mthibg.png" 
          alt="Mithilakart" 
          className="h-16 w-auto object-contain" onError={handleImageError} />
        <div className="flex items-center text-[14px] font-bold text-black tracking-wide italic">
          Mithilakart<span className="text-[10px] align-super ml-0.5">™</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
