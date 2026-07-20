import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, X, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { registerSeller, sendSellerPhoneOtp } from '../../services/sellerApi';

const SellerLogin = () => {
  const navigate = useNavigate();
  const { login } = useSellerAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendSellerPhoneOtp('+91', phone);
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        toast.success('Welcome back! Login successful.');
        navigate('/seller/dashboard');
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await registerSeller({
        name,
        email: email.trim(),
        storeName,
        phone,
        countryCode: '+91',
        password,
        otp,
      });
      toast.success('Registration submitted. Await admin KYC approval, then login.');
      setMode('login');
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundPattern = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M10 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zm30 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zM25 45c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3zM45 15c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3z" fill="%23ffffff" fill-opacity="0.12" fill-rule="evenodd"/></svg>`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 bg-gradient-to-br from-[#77eba3] to-[#42c585] relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(circle at 20% 30%, #77eba3 0%, #42c585 100%), url('${backgroundPattern}')` }}
    >
      <div className="w-full max-w-[420px] flex items-center justify-between z-10">
        <button
          onClick={() => navigate('/')}
          className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md active:scale-95 transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logomith-removebg-preview.png" alt="Mithilakart" className="h-8 w-auto object-contain" />
          <span className="text-white font-bold tracking-wider text-sm">SELLER HUB</span>
        </div>
        <div className="w-9"></div>
      </div>

      <div className="w-full max-w-[420px] bg-[#f2fff5] rounded-[32px] px-6 py-8 shadow-2xl border border-white/40 z-10 my-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-[#0a4a17]">
            {mode === 'login' ? 'Welcome back' : 'Register as Seller'}
          </h2>
          <p className="text-[#3b8a53] text-[13px] font-semibold mt-1">
            {mode === 'login' ? 'Sign in with your seller account' : 'Phone OTP verification required'}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${mode === 'login' ? 'bg-[#0c5c20] text-white' : 'bg-[#e8fced] text-[#0a4a17]'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${mode === 'register' ? 'bg-[#0c5c20] text-white' : 'bg-[#e8fced] text-[#0a4a17]'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-[#e8fced] rounded-[16px] text-[14px] font-semibold"
                required
              />
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store name"
                className="w-full px-4 py-3 bg-[#e8fced] rounded-[16px] text-[14px] font-semibold"
                required
              />
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone"
                  className="w-full pl-11 pr-4 py-3 bg-[#e8fced] rounded-[16px] text-[14px] font-semibold"
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@example.com"
              className="w-full pl-11 pr-4 py-3 bg-[#e8fced] rounded-[16px] text-[14px] font-semibold"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full pl-11 pr-11 py-3 bg-[#e8fced] rounded-[16px] text-[14px] font-semibold"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3b8a53]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'register' && otpSent && (
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP from SMS"
              className="w-full px-4 py-3 bg-[#e8fced] rounded-[16px] text-[14px] font-semibold tracking-widest text-center"
              required
            />
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 bg-[#0c5c20] hover:bg-[#073f15] text-white rounded-[16px] text-[15px] font-bold uppercase tracking-wider shadow-lg"
          >
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : otpSent ? 'Complete Registration' : 'Send OTP & Continue'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default SellerLogin;
