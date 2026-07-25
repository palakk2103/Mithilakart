import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { X, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp } from '../services/authApi';

const FlowerIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={`${className} inline-block`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Leaves/Green details */}
    <path d="M6 6L18 18M18 6L6 18" stroke="#556b2f" strokeWidth="1.5" strokeLinecap="round" />
    {/* 8 petals */}
    <circle cx="12" cy="7" r="2" fill="#F26522" />
    <circle cx="12" cy="17" r="2" fill="#F26522" />
    <circle cx="7" cy="12" r="2" fill="#F26522" />
    <circle cx="17" cy="12" r="2" fill="#F26522" />
    <circle cx="8.5" cy="8.5" r="2" fill="#F26522" />
    <circle cx="15.5" cy="15.5" r="2" fill="#F26522" />
    <circle cx="15.5" cy="8.5" r="2" fill="#F26522" />
    <circle cx="8.5" cy="15.5" r="2" fill="#F26522" />
    {/* Center */}
    <circle cx="12" cy="12" r="3.5" fill="#FFF5EE" stroke="#556b2f" strokeWidth="1" />
    <circle cx="12" cy="12" r="1.5" fill="#F26522" />
  </svg>
);

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
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
        await sendPhoneOtp(countryCode, phoneNumber);
        setOtpSent(true);
        setTimer(60);
        setSuccess('OTP sent successfully to your phone');
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
    
    if (!name.trim()) {
      setError('Full Name is required');
      return;
    }
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
        setSuccess('Account created successfully! Logging in...');
        localStorage.setItem('isAuthenticated', 'true');
        setTimeout(() => {
          const redirectTo = location.state?.from || '/home';
          const redirectState = location.state?.checkoutProduct ? { product: location.state.checkoutProduct } : undefined;
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-2.5 py-3 md:p-6 bg-[#f7f4eb] relative overflow-hidden">
      {/* Background Image with lower opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/login_signup_bg.png')` }}
      />

      {/* Top Header Row */}
      <div className="w-full max-w-[420px] flex items-center justify-between z-10">
        <button 
          onClick={() => navigate(-1)}
          className="bg-[#F26522]/10 hover:bg-[#F26522]/20 text-[#F26522] p-2 rounded-full backdrop-blur-md active:scale-95 transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="w-9"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main card */}
      <div className="w-full max-w-[420px] bg-[#FFF9F3]/95 rounded-[36px] p-2.5 shadow-2xl border border-[#F26522]/20 backdrop-blur-md z-10 my-2.5 md:my-6 relative overflow-hidden">
        <div className="border border-dashed border-[#F26522]/40 rounded-[28px] px-5 py-5 md:px-6 md:py-8 relative">
          
          {/* Faint mandala background watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            <svg className="w-80 h-80 text-[#F26522] fill-current" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
          <div className="absolute top-2.5 left-2.5"><FlowerIcon className="w-4 h-4" /></div>
          <div className="absolute top-2.5 right-2.5"><FlowerIcon className="w-4 h-4" /></div>
          <div className="absolute bottom-2.5 left-2.5"><FlowerIcon className="w-4 h-4" /></div>
          <div className="absolute bottom-2.5 right-2.5"><FlowerIcon className="w-4 h-4" /></div>

          <div className="text-center mb-4 md:mb-6 z-10 relative">
            <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-[#321c13] flex items-center justify-center gap-2">
              <FlowerIcon className="w-5 h-5" />
              <span>Create account</span>
              <FlowerIcon className="w-5 h-5" />
            </h2>
            {/* Divider */}
            <div className="flex items-center justify-center gap-2 my-2 md:my-2.5">
              <div className="w-16 border-t border-dashed border-[#F26522]/40"></div>
              <FlowerIcon className="w-3.5 h-3.5" />
              <div className="w-16 border-t border-dashed border-[#F26522]/40"></div>
            </div>
            <p className="text-[#705c53] text-[13px] font-semibold mt-1">
              Fresh Food & Handcrafted Items Delivered
            </p>
          </div>

          {/* Authentication Toggle */}
          <div className="flex gap-1.5 bg-[#FFF5EE] border border-[#F26522]/25 p-1 rounded-2xl mb-4 md:mb-5 z-10 relative">
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
                  ? 'bg-[#F26522] text-white shadow-md' 
                  : 'text-[#F26522] hover:bg-[#F26522]/5'
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
                  ? 'bg-[#F26522] text-white shadow-md' 
                  : 'text-[#F26522] hover:bg-[#F26522]/5'
              }`}
            >
              {useEmail && (
                <div className="absolute inset-0.5 border border-dashed border-white/40 rounded-lg pointer-events-none" />
              )}
              <Mail size={14} />
              <span>Continue With Email</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 z-10 relative">
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

            {/* Name Field */}
            <div>
              <label className="block text-[10px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a090]">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border border-[#F26522]/25 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs"
                  disabled={isVerifyingOtp}
                  required
                />
              </div>
            </div>

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
                      className="w-full pl-3 pr-6 py-2.5 bg-[#FFFdfa] border border-[#F26522]/25 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] rounded-[16px] text-[14px] font-semibold text-[#321c13] focus:outline-none transition-all shadow-xs appearance-none text-center cursor-pointer"
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F26522]/70">
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border border-[#F26522]/25 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs"
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F26522]/70">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border border-[#F26522]/25 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs"
                    disabled={otpSent || isSendingOtp || isVerifyingOtp}
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP Field & Resend Timer */}
            {otpSent && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                    6-Digit OTP
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F26522]/70">
                      <MessageSquare size={18} />
                    </span>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#FFFdfa] border border-[#F26522]/25 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] rounded-[16px] text-[14px] font-semibold text-[#321c13] placeholder-[#b8a090] focus:outline-none transition-all shadow-xs tracking-widest text-center"
                      disabled={isVerifyingOtp}
                      required
                    />
                  </div>
                </div>

                {/* Resend Timer */}
                <div className="flex items-center justify-between text-[12px] font-bold px-1 text-[#F26522]/80">
                  <span>OTP expires in: {timer}s</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0 || isSendingOtp || isVerifyingOtp}
                    className={`text-[#F26522] hover:underline font-bold transition-all ${
                      timer > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* Sign up Button / Send OTP */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={isSendingOtp || isVerifyingOtp}
              className="w-full py-4 mt-2 bg-[#F26522] hover:bg-[#d45014] text-white rounded-[16px] text-[15px] font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden font-serif"
            >
              <div className="absolute inset-1 border border-dashed border-white/50 rounded-xl pointer-events-none" />
              {isSendingOtp || isVerifyingOtp ? (
                <span>Processing...</span>
              ) : otpSent ? (
                <span>Verify OTP & Create Account</span>
              ) : (
                <span>Send OTP</span>
              )}
            </motion.button>
          </form>

          {/* Link to Login */}
          <div className="text-center mt-5 text-[12px] font-bold text-[#705c53] z-10 relative">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F26522] hover:underline">
              Log in here!
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Logo & Styling */}
      <div className="flex flex-col items-center gap-1 my-1 md:my-3 z-10">
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

export default Signup;
