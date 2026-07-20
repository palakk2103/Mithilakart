import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendOtp, verifyOtp } from '../services/deliveryApi';
import { isAuthenticated } from '../../../shared/api/tokenStorage';

const DeliveryAuth = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated('delivery')) {
      navigate('/delivery/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    if (!otpSent || timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSendOtp = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await sendOtp('+91', digits);
      setOtpSent(true);
      setTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const digits = phone.replace(/\D/g, '');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP from SMS');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp('+91', digits, otp);
      navigate('/delivery/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const backgroundPattern = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M10 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zm30 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zM25 45c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3zM45 15c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3z" fill="%23ffffff" fill-opacity="0.12" fill-rule="evenodd"/></svg>`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 bg-gradient-to-br from-[#77eba3] to-[#42c585] relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(circle at 20% 30%, #77eba3 0%, #42c585 100%), url('${backgroundPattern}')` }}
    >
      <div className="w-full max-w-[420px] flex items-center justify-between z-10">
        <button onClick={() => navigate('/')} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full">
          <X size={20} strokeWidth={2.5} />
        </button>
        <span className="text-white font-bold tracking-wider text-sm">DELIVERY APP</span>
        <div className="w-9"></div>
      </div>

      <div className="w-full max-w-[420px] bg-[#f2fff5] rounded-[32px] px-6 py-8 shadow-2xl border border-white/40 z-10 my-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#0a4a17]">Partner Login</h2>
          <p className="text-[#3b8a53] text-[13px] font-semibold mt-1">Live SMS OTP verification</p>
        </div>

        <form onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-[11px] font-bold p-3.5 rounded-2xl text-center uppercase tracking-wider">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[#0a4a17] text-xs font-bold uppercase tracking-wider ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone number"
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#d4edda] rounded-2xl text-[#0a4a17] font-semibold"
                disabled={otpSent}
                required
              />
            </div>
          </div>

          {otpSent && (
            <div className="space-y-2">
              <label className="text-[#0a4a17] text-xs font-bold uppercase tracking-wider ml-1">OTP from SMS</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
                <input
                  type={showOtp ? 'text' : 'password'}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-[#d4edda] rounded-2xl text-[#0a4a17] font-semibold tracking-widest text-center"
                  required
                />
                <button type="button" onClick={() => setShowOtp(!showOtp)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3b8a53]">
                  {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {timer > 0 ? (
                <p className="text-xs text-[#3b8a53] text-center">Resend OTP in {timer}s</p>
              ) : (
                <button type="button" onClick={handleSendOtp} className="text-xs text-[#0c5c20] font-bold w-full text-center">
                  Resend OTP
                </button>
              )}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 bg-[#0c5c20] text-white rounded-2xl font-bold uppercase tracking-wider"
          >
            {loading ? 'Please wait...' : otpSent ? 'Verify & Login' : 'Send OTP'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryAuth;
