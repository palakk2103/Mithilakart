import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
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
          className="bg-[color:var(--qs-primary,#F26522)]/10 hover:bg-[color:var(--qs-primary,#F26522)]/20 text-[color:var(--qs-primary,#F26522)] p-2 rounded-full backdrop-blur-md active:scale-95 transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logomith-removebg-preview.png" alt="Mithilakart" className="h-8 w-auto object-contain" />
          <span className="text-[color:var(--qs-primary,#F26522)] font-bold tracking-wider text-sm">MITHILAKART</span>
        </div>
        <div className="w-9"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main card */}
      <div className="w-full max-w-[420px] bg-[color:var(--qs-light,#FFF5EE)]/95 rounded-[32px] px-6 py-8 shadow-2xl border border-white/40 backdrop-blur-md z-10 my-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[color:var(--qs-primary,#F26522)]">
            Reset Password
          </h2>
          <p className="text-[color:var(--qs-primary,#F26522)]/80 text-[13px] font-semibold mt-1">
            {submitted ? 'Check your instructions below' : 'Enter your details to receive a recovery link'}
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
              <label className="text-[12px] font-black text-[color:var(--qs-primary,#F26522)] uppercase tracking-wider pl-1 block">
                {useEmail ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center text-[color:var(--qs-primary,#F26522)]/70">
                  {useEmail ? <Mail size={18} /> : <Phone size={18} />}
                </span>
                <input 
                  type={useEmail ? 'email' : 'tel'}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={useEmail ? 'Enter your email address' : 'Enter your phone number'}
                  className="w-full pl-12 pr-4.5 py-4 bg-[color:var(--qs-light,#FFF5EE)] border border-[color:var(--qs-primary,#F26522)]/35 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--qs-primary,#F26522)] focus:border-transparent transition-all placeholder-[color:var(--qs-primary,#F26522)]/40 text-[14.5px] font-bold shadow-2xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[color:var(--qs-primary,#F26522)] text-white hover:bg-[color:var(--qs-dark,#d45014)] py-4 rounded-2xl font-black text-[13.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] cursor-pointer"
            >
              Send Reset Link
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
                className="text-[12px] font-bold text-[color:var(--qs-primary,#F26522)] hover:underline"
              >
                {useEmail ? 'Use Phone Number Instead' : 'Use Email Address Instead'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="bg-[color:var(--qs-light,#FFF5EE)] border border-[color:var(--qs-primary,#F26522)]/35 p-5 rounded-2xl text-[14px] font-bold text-[color:var(--qs-primary,#F26522)] leading-relaxed">
              We've sent a recovery link to <span className="underline">{inputVal}</span>. Please check your inbox and follow the instructions to set a new password.
            </div>

            <motion.button
              onClick={() => navigate('/login')}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[color:var(--qs-primary,#F26522)] text-white hover:bg-[color:var(--qs-dark,#d45014)] py-4 rounded-2xl font-black text-[13.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] cursor-pointer"
            >
              Return to Login
            </motion.button>
          </div>
        )}

        <div className="text-center mt-5 text-[12px] font-bold text-[color:var(--qs-primary,#F26522)]/80">
          Remembered your password?{' '}
          <Link to="/login" className="text-[color:var(--qs-primary,#F26522)] hover:underline">
            Log in here!
          </Link>
        </div>
      </div>

      {/* Footer Logo & Styling */}
      <div className="flex flex-col items-center gap-1 my-4 z-10">
        <img 
          src="/mthibg.png" 
          alt="Mithilakart" 
          className="h-16 w-auto object-contain"
        />
        <div className="flex items-center text-[14px] font-bold text-black tracking-wide italic">
          Mithilakart<span className="text-[10px] align-super ml-0.5">™</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
