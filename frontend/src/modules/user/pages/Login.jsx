import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { X, User, Mail, Phone, Lock, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp } from '../services/authApi';
import { applyOtpSendResult } from '../../../shared/utils/otpResponse';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import useVendorStore from '../../../store/useVendorStore';
import SocialIcons from '../../../shared/components/SocialIcons';

const FlowerIcon = ({ className = "w-5 h-5", color = "#F26522" }) => (
  <svg viewBox="0 0 24 24" className={`${className} inline-block`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Leaves/Green details */}
    <path d="M6 6L18 18M18 6L6 18" stroke="#556b2f" strokeWidth="1.5" strokeLinecap="round" />
    {/* 8 petals */}
    <circle cx="12" cy="7" r="2" fill={color} />
    <circle cx="12" cy="17" r="2" fill={color} />
    <circle cx="7" cy="12" r="2" fill={color} />
    <circle cx="17" cy="12" r="2" fill={color} />
    <circle cx="8.5" cy="8.5" r="2" fill={color} />
    <circle cx="15.5" cy="15.5" r="2" fill={color} />
    <circle cx="15.5" cy="8.5" r="2" fill={color} />
    <circle cx="8.5" cy="15.5" r="2" fill={color} />
    {/* Center */}
    <circle cx="12" cy="12" r="3.5" fill="#FFF5EE" stroke="#556b2f" strokeWidth="1" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { refreshLiveLocation } = useLiveLocation();
  const theme = useTabTheme();
  const setActiveFlow = useVendorStore((state) => state.setActiveFlow);
  
  const [useEmail, setUseEmail] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getDefaultRedirect = (flow) => {
    if (flow === 'quickshop') return '/quick-shop';
    if (flow === 'mithilak') return '/mithilak';
    if (flow === 'freshgrocery') return '/fresh-grocery';
    return '/home';
  };

  useEffect(() => {
    if (location.state?.flow) {
      setActiveFlow(location.state.flow);
    }
  }, [location.state?.flow, setActiveFlow]);

  useEffect(() => {
    if (isAuthenticated('customer')) {
      const defaultRedirect = getDefaultRedirect(theme.activeFlow);
      const redirectTo = location.state?.from || defaultRedirect;
      const redirectState = {};
      if (location.state?.product) redirectState.product = location.state.product;
      if (location.state?.checkoutProduct) redirectState.checkoutProduct = location.state.checkoutProduct;
      navigate(redirectTo, { replace: true, state: redirectState });
    }
  }, [location.state?.from, navigate, location.state?.checkoutProduct, location.state?.product, theme.activeFlow]);

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');
    
    if (useEmail) {
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail) {
        setError('Email address is required');
        return;
      }
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address');
        return;
      }
      
      setIsSendingOtp(true);
      try {
        await sendEmailOtp(trimmedEmail);
        setOtpSent(true);
        setTimer(60);
        setSuccess('OTP sent successfully to your email');
      } catch (err) {
        setError(err.message || 'Failed to send OTP');
      } finally {
        setIsSendingOtp(false);
      }
    } else {
      if (!countryCode) {
        setError('Country code is required');
        return;
      }
      if (!/^\+?\d{1,4}$/.test(countryCode)) {
        setError('Invalid country code');
        return;
      }
      if (!phoneNumber) {
        setError('Phone number is required');
        return;
      }
      if (phoneNumber.length < 8 || phoneNumber.length > 11) {
        setError('Phone number must be between 8 and 11 digits');
        return;
      }
      
      setIsSendingOtp(true);
      try {
        const result = await sendPhoneOtp(countryCode, phoneNumber);
        applyOtpSendResult(result, { setOtp, setSuccess, setOtpSent, setTimer });
      } catch (err) {
        setError(err.message || 'Failed to send OTP');
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');
    
    if (!otp) {
      setError('OTP cannot be empty');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be a 6-digit number');
      return;
    }
    
    setIsVerifyingOtp(true);
    try {
      let response;
      if (useEmail) {
        response = await verifyEmailOtp(email.trim(), otp);
      } else {
        response = await verifyPhoneOtp(countryCode, phoneNumber, otp);
      }
      
      if (response && response.success) {
        setSuccess('Authentication successful! Logging in...');
        refreshLiveLocation({ silent: true }).catch(() => {});
        setTimeout(() => {
          const defaultRedirect = getDefaultRedirect(theme.activeFlow);
          const redirectTo = location.state?.from || defaultRedirect;
          const redirectState = {};
          if (location.state?.product) redirectState.product = location.state.product;
          if (location.state?.checkoutProduct) redirectState.checkoutProduct = location.state.checkoutProduct;
          navigate(redirectTo, { state: redirectState });
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSendingOtp || isVerifyingOtp) return;
    if (!otpSent) {
      handleSendOtp();
    } else {
      handleVerifyOtp();
    }
  };

  const handleResendOtp = () => {
    if (timer > 0 || isSendingOtp || isVerifyingOtp) return;
    handleSendOtp();
  };

  // Inline SVG pattern for background
  const backgroundPattern = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M10 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zm30 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zM25 45c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3zM45 15c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3z" fill="%23ffffff" fill-opacity="0.12" fill-rule="evenodd"/></svg>`;

  const primaryBg = theme.primaryBg;
  const primaryBgHover = theme.primaryBgHover;
  const primaryText = theme.primaryText;
  const primaryBorder = theme.primaryBorder;
  const primaryLightBg = theme.primaryLightBg;

  const outerBgMap = {
    quickshop: 'bg-[#f7f4eb]',
    mithilak: 'bg-[#eef5f6]',
    freshgrocery: 'bg-[#faf6eb]',
    mithilakart: 'bg-[#f2f7f1]'
  };
  const cardBgMap = {
    quickshop: 'bg-[#FFF9F3]/95',
    mithilak: 'bg-[#fafdff]/95',
    freshgrocery: 'bg-[#FFFdfa]/95',
    mithilakart: 'bg-[#fbfdfa]/95'
  };
  
  const outerBg = outerBgMap[theme.activeFlow] || 'bg-[#f2f7f1]';
  const cardBg = cardBgMap[theme.activeFlow] || 'bg-[#fbfdfa]/95';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between p-2.5 py-3 md:p-6 relative overflow-hidden ${outerBg}`}>
      {/* Background Image with lower opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/login_signup_bg.png')` }}
      />

      {/* Top Header Row */}
      <div className="w-full max-w-[420px] flex items-center justify-between z-10">
        <button 
          onClick={() => navigate('/home')}
          className="p-2 rounded-full backdrop-blur-md active:scale-95 transition-all"
          style={{ backgroundColor: `${theme.primaryHex}1a`, color: theme.primaryHex }}
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="w-9"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main card */}
      <div className={`w-full max-w-[420px] rounded-[36px] p-2.5 shadow-2xl border backdrop-blur-md z-10 my-2.5 md:my-6 relative overflow-hidden ${cardBg}`} style={{ borderColor: `${theme.primaryHex}33` }}>
        <div className="border border-dashed rounded-[28px] px-5 py-5 md:px-6 md:py-8 relative" style={{ borderColor: `${theme.primaryHex}66` }}>
          
          {/* Faint mandala background watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            <svg className="w-80 h-80 fill-current" style={{ color: theme.primaryHex }} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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

          {/* Corner Flowers */}
          <div className="absolute top-2.5 left-2.5"><FlowerIcon className="w-4 h-4" color={theme.primaryHex} /></div>
          <div className="absolute top-2.5 right-2.5"><FlowerIcon className="w-4 h-4" color={theme.primaryHex} /></div>
          <div className="absolute bottom-2.5 left-2.5"><FlowerIcon className="w-4 h-4" color={theme.primaryHex} /></div>
          <div className="absolute bottom-2.5 right-2.5"><FlowerIcon className="w-4 h-4" color={theme.primaryHex} /></div>

          <div className="text-center mb-4 md:mb-8 z-10 relative">
            <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-[#321c13] flex items-center justify-center gap-2">
              <FlowerIcon className="w-5 h-5" color={theme.primaryHex} />
              <span>Welcome back</span>
              <FlowerIcon className="w-5 h-5" color={theme.primaryHex} />
            </h2>
            {/* Divider */}
            <div className="flex items-center justify-center gap-2 my-2 md:my-2.5">
              <div className="w-16 border-t border-dashed" style={{ borderColor: `${theme.primaryHex}66` }}></div>
              <FlowerIcon className="w-3.5 h-3.5" color={theme.primaryHex} />
              <div className="w-16 border-t border-dashed" style={{ borderColor: `${theme.primaryHex}66` }}></div>
            </div>
            <p className="text-[#705c53] text-[13px] font-semibold mt-1">
              Fresh Food & Handcrafted Items Delivered
            </p>
          </div>

          {/* Authentication Toggle */}
          <div className={`flex gap-1.5 border p-1 rounded-2xl mb-4 md:mb-6 z-10 relative ${theme.primaryLightBg}`} style={{ borderColor: `${theme.primaryHex}40` }}>
            <button
              type="button"
              disabled={isSendingOtp || isVerifyingOtp}
              onClick={() => {
                setUseEmail(false);
                setOtpSent(false);
                setError('');
                setSuccess('');
                setOtp('');
              }}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold rounded-xl transition-all capitalize tracking-normal whitespace-nowrap relative ${
                !useEmail 
                  ? `${theme.primaryBg} text-white shadow-md` 
                  : `${theme.primaryText} hover:bg-black/5`
              }`}
            >
              {!useEmail && (
                <div className="absolute inset-0.5 border border-dashed border-white/40 rounded-lg pointer-events-none" />
              )}
              <Phone size={14} />
              <span>Continue With Phone</span>
            </button>
            <button
              type="button"
              disabled={isSendingOtp || isVerifyingOtp}
              onClick={() => {
                setUseEmail(true);
                setOtpSent(false);
                setError('');
                setSuccess('');
                setOtp('');
              }}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold rounded-xl transition-all capitalize tracking-normal whitespace-nowrap relative ${
                useEmail 
                  ? `${theme.primaryBg} text-white shadow-md` 
                  : `${theme.primaryText} hover:bg-black/5`
              }`}
            >
              {useEmail && (
                <div className="absolute inset-0.5 border border-dashed border-white/40 rounded-lg pointer-events-none" />
              )}
              <Mail size={14} />
              <span>Continue With Email</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 z-10 relative">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-[11px] font-bold p-3.5 rounded-2xl text-center uppercase tracking-wider">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-100 text-green-600 text-[11px] font-bold p-3.5 rounded-2xl text-center uppercase tracking-wider">
                {success}
              </div>
            )}

            {/* Email / Phone Field */}
            {!useEmail ? (
              <div>
                <label className="block text-[10px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="w-[85px] relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full pl-3 pr-6 py-2.5 bg-[#FFFdfa] border focus:ring-1 rounded-[16px] text-[14px] font-semibold text-[#321c13] focus:outline-none transition-all shadow-xs appearance-none text-center cursor-pointer"
                      style={{ borderColor: `${theme.primaryHex}40` }}
                      disabled={otpSent || isSendingOtp || isVerifyingOtp}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#b8a090]">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${theme.primaryHex}b3` }}>
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border focus:ring-1 rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs"
                      style={{ borderColor: `${theme.primaryHex}40` }}
                      disabled={otpSent || isSendingOtp || isVerifyingOtp}
                      required
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${theme.primaryHex}b3` }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border focus:ring-1 rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs"
                    style={{ borderColor: `${theme.primaryHex}40` }}
                    disabled={otpSent || isSendingOtp || isVerifyingOtp}
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP Field & Resend Timer */}
            {otpSent && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                    6-Digit OTP
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${theme.primaryHex}b3` }}>
                      <MessageSquare size={18} />
                    </span>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border focus:ring-1 rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs tracking-widest text-center"
                      style={{ borderColor: `${theme.primaryHex}40` }}
                      disabled={isVerifyingOtp}
                      required
                    />
                  </div>
                </div>

                {/* Resend Timer */}
                <div className="flex items-center justify-between text-[12px] font-bold px-1" style={{ color: `${theme.primaryHex}cc` }}>
                  <span>OTP expires in: {timer}s</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0 || isSendingOtp || isVerifyingOtp}
                    className="hover:underline font-bold transition-all cursor-pointer"
                    style={{ color: theme.primaryHex }}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* Log in / Send OTP Button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={isSendingOtp || isVerifyingOtp}
              className={`w-full py-4 text-white rounded-[16px] text-[15px] font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden font-serif ${primaryBg} ${primaryBgHover}`}
            >
              <div className="absolute inset-1 border border-dashed border-white/50 rounded-xl pointer-events-none" />
              {isSendingOtp || isVerifyingOtp ? (
                <span>Processing...</span>
              ) : otpSent ? (
                <span>Verify OTP & Login</span>
              ) : (
                <span>Send OTP</span>
              )}
            </motion.button>
          </form>

          {/* Link to Register */}
          <div className="text-center mt-6 text-[12px] font-bold text-[#705c53] z-10 relative">
            Don't have an account?{' '}
            <Link to="/signup" state={location.state} className="hover:underline" style={{ color: theme.primaryHex }}>
              Register here!
            </Link>
          </div>

          {/* Social Icons */}
          <div className="mt-5 pt-4 border-t border-dashed z-10 relative flex flex-col items-center gap-2.5" style={{ borderColor: `${theme.primaryHex}33` }}>
            <p className="text-center text-[10px] font-extrabold text-[#705c53] uppercase tracking-wider">
              Connect With Us
            </p>
            <SocialIcons />
          </div>
        </div>
      </div>

      {/* Footer Logo & Styling */}
      <div className="flex flex-col items-center gap-1 my-1 md:my-4 z-10">
        <img 
          src="/mthibg.png" 
          alt="Mithilakart" 
          className="h-10 md:h-16 w-auto object-contain"
        />
        <div className="flex items-center text-[13px] md:text-[14px] font-bold text-black tracking-wide italic">
          Mithilakart<span className="text-[10px] align-super ml-0.5">™</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
