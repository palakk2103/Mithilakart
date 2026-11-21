import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp } from '../services/authApi';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import useVendorStore from '../../../store/useVendorStore';
import AuthShell, { Notice, fieldClass } from '../components/auth/AuthShell';
import OtpStep from '../components/auth/OtpStep';
import { toOtpSession, sessionFromRetry } from '../components/auth/useOtpCountdown';
import { goAfterAuth } from '../components/auth/authRedirect';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AUTH-3 — "Welcome back": Phone / Email toggle → Send OTP → 6-box OTP.
 * Login only signs in existing accounts; new customers go to Register.
 */
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { refreshLiveLocation } = useLiveLocation();
  const theme = useTabTheme();
  const setActiveFlow = useVendorStore((state) => state.setActiveFlow);
  const hex = theme.primaryHex;

  const [useEmail, setUseEmail] = useState(Boolean(location.state?.useEmail));
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(location.state?.phone || '');
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [session, setSession] = useState(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (location.state?.flow) setActiveFlow(location.state.flow);
  }, [location.state?.flow, setActiveFlow]);

  useEffect(() => {
    if (isAuthenticated('customer')) goAfterAuth(navigate, location, theme.activeFlow, { replace: true });
    // Only on first render: a successful login navigates by itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetTo = (emailMode) => {
    setUseEmail(emailMode);
    setSession(null);
    setOtp('');
    setError('');
    setInfo('');
  };

  const validate = () => {
    if (useEmail) {
      if (!EMAIL_RE.test(email.trim())) return t('auto.pleaseEnterAValidEmail', 'Please enter a valid email address');
      return '';
    }
    if (!/^\d{10}$/.test(phoneNumber) && !(countryCode !== '+91' && /^\d{8,11}$/.test(phoneNumber))) {
      return 'Enter your 10-digit mobile number';
    }
    return '';
  };

  const send = async () => {
    setError('');
    setInfo('');
    const problem = validate();
    if (problem) { setError(problem); return; }

    setSending(true);
    try {
      const result = useEmail ? await sendEmailOtp(email.trim()) : await sendPhoneOtp(countryCode, phoneNumber);
      setSession(toOtpSession(result));
      setOtp(result?.devOtp || '');
      setInfo(result?.devOtp ? `Test mode: OTP ${result.devOtp}` : (result?.message || 'OTP sent'));
    } catch (err) {
      setSession((s) => sessionFromRetry(s, err));
      setError(err.message || t('auto.failedToSendOtp', 'Could not send the OTP'));
    } finally {
      setSending(false);
    }
  };

  const verify = async (code) => {
    if (verifying || code.length !== 6) return;
    setError('');
    setVerifying(true);
    try {
      const response = useEmail
        ? await verifyEmailOtp(email.trim(), code)
        : await verifyPhoneOtp(countryCode, phoneNumber, code);
      if (response?.success) {
        setInfo('');
        refreshLiveLocation({ silent: true }).catch(() => {});
        goAfterAuth(navigate, location, theme.activeFlow, { replace: true });
      }
    } catch (err) {
      setInfo('');
      setError(err.message || t('auto.invalidOtpPleaseTryAgain', 'Incorrect OTP'));
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const sentTo = useEmail ? email.trim() : `${countryCode} ${phoneNumber}`;

  return (
    <AuthShell
      title={t('auto.welcomeBack', 'Welcome back')}
      onBack={session ? () => resetTo(useEmail) : undefined}
      social
    >
      {!session && (
        <div className={`flex gap-1.5 border p-1 rounded-2xl mb-5 ${theme.primaryLightBg}`} style={{ borderColor: `${hex}40` }} role="tablist">
          {[
            { email: false, icon: Phone, label: 'Phone' },
            { email: true, icon: Mail, label: 'Email' },
          ].map(({ email: isEmail, icon: Icon, label }) => {
            const active = useEmail === isEmail;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={sending}
                onClick={() => resetTo(isEmail)}
                className={`flex-1 h-11 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-xl transition-all ${active ? 'text-white shadow-md' : 'hover:bg-black/5'}`}
                style={active ? { backgroundColor: hex } : { color: hex }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        <Notice kind="error">{error}</Notice>
        <Notice kind="success">{info}</Notice>

        {!session ? (
          <form onSubmit={(e) => { e.preventDefault(); if (!sending) send(); }} className="space-y-5">
            {useEmail ? (
              <div>
                <label htmlFor="login-email" className="block text-[11px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                  Registered email address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${hex}b3` }}><Mail size={18} /></span>
                  <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className={fieldClass}
                    style={{ borderColor: `${hex}40` }}
                    disabled={sending}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="login-phone" className="block text-[11px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">
                  Registered mobile number
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-[84px] h-12 px-2 bg-[#FFFdfa] border rounded-[16px] text-[15px] font-semibold text-[#321c13] focus:outline-none text-center"
                    style={{ borderColor: `${hex}40` }}
                    disabled={sending}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+971">+971</option>
                  </select>
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${hex}b3` }}><Phone size={18} /></span>
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="98765 43210"
                      className={fieldClass}
                      style={{ borderColor: `${hex}40` }}
                      disabled={sending}
                    />
                  </div>
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={sending}
              className="w-full h-12 text-white rounded-[16px] text-[15px] font-bold shadow-lg transition-all disabled:opacity-60"
              style={{ backgroundColor: hex }}
            >
              {sending ? 'Sending OTP…' : t('auto.sendOtp', 'Send OTP')}
            </motion.button>
            <p className="text-center text-[12px] text-[#705c53] -mt-2">
              An OTP will be sent to your registered {useEmail ? 'email address' : 'mobile number'}.
            </p>
          </form>
        ) : (
          <OtpStep
            sentTo={sentTo}
            session={session}
            otp={otp}
            setOtp={setOtp}
            onVerify={verify}
            onResend={send}
            verifying={verifying}
            resending={sending}
            verifyLabel="Verify & Log in"
            accent={hex}
            invalid={Boolean(error)}
          />
        )}
      </div>

      <div className="text-center mt-6 text-[13px] font-bold text-[#705c53]">
        {t('auth.dontHaveAccount', "Don't have an account?")}{' '}
        <Link to="/signup" state={location.state} className="inline-block py-2 hover:underline" style={{ color: hex }}>
          {t('auto.registerHere', 'Register here!')}
        </Link>
      </div>
    </AuthShell>
  );
};

export default Login;
