import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
import adminApi from '../services/api';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: loginError } = await adminApi.auth.login({ email, password });

    setLoading(false);

    if (loginError || !data?.tokens?.accessToken) {
      setError(loginError || 'Invalid email or password');
      return;
    }

    navigate('/admin/dashboard');
  };

  const backgroundPattern = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M10 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zm30 20c2-3 5-5 8-5s6 2 8 5-2 8-5 8-6-2-8-5zM25 45c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3zM45 15c1-2 3-3 5-3s4 1 5 3-1 4-3 4-4-1-5-3z" fill="%23ffffff" fill-opacity="0.12" fill-rule="evenodd"/></svg>`;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between p-4 md:p-6 bg-gradient-to-br from-[#77eba3] to-[#42c585] relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(circle at 20% 30%, #77eba3 0%, #42c585 100%), url('${backgroundPattern}')` }}
    >
      <div className="absolute top-10 left-10 opacity-20 pointer-events-none">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0C35 25 15 35 0 50C15 65 35 75 50 100C65 75 85 65 100 50C85 35 65 25 50 0Z" fill="white" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-10 opacity-15 pointer-events-none">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 80C40 80 60 60 80 20C60 20 40 40 20 80Z" fill="white" />
          <circle cx="50" cy="50" r="10" fill="white" />
        </svg>
      </div>

      <div className="w-full max-w-[420px] flex items-center justify-between z-10">
        <button 
          onClick={() => navigate('/')}
          className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md active:scale-95 transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <span className="text-white font-bold tracking-wider text-sm">ADMIN PANEL</span>
        <div className="w-9"></div>
      </div>

      <div className="w-full max-w-[420px] bg-[#f2fff5] rounded-[32px] px-6 py-8 shadow-2xl border border-white/40 z-10 my-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#0a4a17]">
            Welcome back
          </h2>
          <p className="text-[#3b8a53] text-[13px] font-semibold mt-1">
            Verified Management Session
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-[11px] font-bold p-3.5 rounded-2xl text-center uppercase tracking-wider">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[#0a4a17] text-xs font-bold uppercase tracking-wider ml-1">Email / Phone</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or phone"
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#d4edda] rounded-2xl text-[#0a4a17] font-semibold placeholder:text-[#3b8a53]/50 focus:outline-none focus:border-[#42c585] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[#0a4a17] text-xs font-bold uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b8a53]" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-[#d4edda] rounded-2xl text-[#0a4a17] font-semibold placeholder:text-[#3b8a53]/50 focus:outline-none focus:border-[#42c585] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3b8a53] hover:text-[#0a4a17] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0a4a17] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0d5c1d] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={20} />
            {loading ? 'Signing in...' : 'Sign In Securely'}
          </button>
        </form>
      </div>

      <div className="text-white/60 text-xs font-medium z-10 pb-4">
        Mithilakart Admin Portal
      </div>
    </div>
  );
};

export default Auth;
