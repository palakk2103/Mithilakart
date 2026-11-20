import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Smartphone, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { registerStart, registerVerifyPhone, registerVerifyEmail, registerResend } from '../services/authApi';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import useVendorStore from '../../../store/useVendorStore';
import AuthShell, { Notice, fieldClass } from '../components/auth/AuthShell';
import OtpStep from '../components/auth/OtpStep';
import { toOtpSession, sessionFromRetry } from '../components/auth/useOtpCountdown';
import { goAfterAuth } from '../components/auth/authRedirect';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
  { key: 'phone', label: 'Mobile OTP' },
  { key: 'email', label: 'Email OTP' },
  { key: 'done', label: 'Done' },
];

const Stepper = ({ step, accent }) => {
  const current = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center justify-between mb-5" aria-label="Verification progress">
      {STEPS.map((s, i) => {
        const done = i < current || step === 'done';
        const active = i === current && step !== 'done';
        return (
          <li key={s.key} className="flex-1 flex items-center last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[64px]">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2"
                style={done || active
                  ? { backgroundColor: done ? accent : '#fff', borderColor: accent, color: done ? '#fff' : accent }
                  : { borderColor: '#d6cfc8', color: '#a8988c', backgroundColor: '#fff' }}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className="text-[11px] font-bold" style={{ color: done || active ? accent : '#a8988c' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 -mt-5 mx-1 rounded" style={{ backgroundColor: i < current ? accent : '#e6dfd8' }} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

/** Step card of the verify screen. Defined at module level so the OTP boxes inside keep focus while typing. */
const StepCard = ({ hex, icon: Icon, title, locked = false, children }) => (
  <section className={`rounded-xl border overflow-hidden bg-white ${locked ? 'opacity-60' : ''}`} style={{ borderColor: `${hex}40` }}>
    <div className="flex items-center gap-2.5 px-3 py-2" style={{ backgroundColor: `${hex}14` }}>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: hex }}><Icon size={16} /></span>
      <h2 className="text-[13.5px] font-extrabold text-[#321c13] leading-tight">{title}</h2>
    </div>
    <div className="p-3">{children}</div>
  </section>
);

const Verified = ({ text }) => (
  <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-[13px] font-bold rounded-xl px-3 py-2.5">
    <Check size={16} strokeWidth={3} className="shrink-0" /> {text}
  </div>
);

/**
 * AUTH-1 Create Account → AUTH-2 Verify Your Account (mobile OTP, then email
 * OTP). The account is created by the server only after both are verified.
 */
const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTabTheme();
  const setActiveFlow = useVendorStore((state) => state.setActiveFlow);
  const hex = theme.primaryHex;

  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [reg, setReg] = useState(null); // { registrationId, step, maskedPhone, maskedEmail }
  const [session, setSession] = useState(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.flow) setActiveFlow(location.state.flow);
  }, [location.state?.flow, setActiveFlow]);

  useEffect(() => {
    if (isAuthenticated('customer')) goAfterAuth(navigate, location, theme.activeFlow, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyStep = (data, message = '') => {
    setReg(data);
    setSession(toOtpSession(data.otp));
    setOtp(data.otp?.devOtp || '');
    setSuccess(message);
    setError(data.emailOtpError || '');
  };

  const validateForm = () => {
    const errs = {};
    if (name.trim().length < 2) errs.name = 'Enter your full name';
    if (countryCode === '+91' ? !/^\d{10}$/.test(phone) : !/^\d{8,11}$/.test(phone)) errs.phone = 'Enter a valid mobile number';
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
    setFieldErrors(errs);
    return !Object.keys(errs).length;
  };

  const start = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setAlreadyRegistered(null);
    if (!validateForm()) return;
    setBusy(true);
    try {
      const data = await registerStart({ name: name.trim(), countryCode, phone, email: email.trim() });
      applyStep(data);
    } catch (err) {
      if (err.code === 'ALREADY_REGISTERED') {
        const fields = err.details?.fields || [];
        setAlreadyRegistered((err.message || 'Already registered.').replace(/\s*Please log in instead\.?$/, ''));
        setFieldErrors({
          ...(fields.includes('phone') ? { phone: 'This number is already registered' } : {}),
          ...(fields.includes('email') ? { email: 'This email is already registered' } : {}),
        });
      } else {
        setError(err.message || 'Could not start sign-up. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code) => {
    if (busy || code.length !== 6 || !reg) return;
    setBusy(true);
    setError('');
    try {
      if (reg.step === 'phone') {
        const data = await registerVerifyPhone(reg.registrationId, code);
        applyStep(data, 'Mobile number verified successfully!');
      } else {
        const result = await registerVerifyEmail(reg.registrationId, code);
        if (result.success) {
          setReg((r) => ({ ...r, step: 'done', emailVerified: true }));
          setSession(null);
          setSuccess('Email verified successfully! Your account is ready.');
          setTimeout(() => goAfterAuth(navigate, location, theme.activeFlow, { replace: true }), 1200);
        }
      }
    } catch (err) {
      setOtp('');
      if (err.status === 410 && /sign-up session/.test(err.message || '')) {
        setReg(null);
        setSession(null);
      }
      setError(err.message || 'Incorrect OTP');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!reg || resending) return;
    setResending(true);
    setError('');
    try {
      const data = await registerResend(reg.registrationId, reg.step === 'email' ? 'email' : 'phone');
      applyStep(data, reg.step === 'email' ? 'A new OTP is on its way to your email.' : 'A new OTP is on its way to your mobile.');
    } catch (err) {
      setSession((s) => sessionFromRetry(s, err));
      setError(err.message || 'Could not resend the OTP');
    } finally {
      setResending(false);
    }
  };

  const loginState = { ...(location.state || {}) };

  // ── Screen 2: Verify Your Account (Step 1 and Step 2 cards shown together) ──
  if (reg) {
    const phoneDone = Boolean(reg.phoneVerified);
    const allDone = reg.step === 'done';
    const otpProps = { session, otp, setOtp, onVerify: verify, onResend: resend, verifying: busy, resending, accent: hex, invalid: Boolean(error) };
    return (
      <AuthShell
        title="Verify Your Account"
        subtitle="Complete two-step verification to activate your account"
        onBack={allDone ? undefined : () => { setReg(null); setSession(null); setOtp(''); setError(''); setSuccess(''); }}
      >
        <Stepper step={reg.step} accent={hex} />
        <div className="space-y-2.5">
          <Notice kind="error">{error}</Notice>

          {phoneDone ? (
            <Verified text="Mobile number verified successfully!" />
          ) : (
            <StepCard hex={hex} icon={Smartphone} title="Step 1: Verify Your Mobile Number">
              <OtpStep {...otpProps} sentTo={reg.maskedPhone} verifyLabel="Verify Mobile OTP" />
            </StepCard>
          )}

          <StepCard hex={hex} icon={Mail} title="Step 2: Verify Your Email Address" locked={!phoneDone}>
            {allDone ? (
              <Verified text="Email verified successfully! Your account is ready." />
            ) : phoneDone ? (
              <OtpStep {...otpProps} sentTo={reg.maskedEmail} verifyLabel="Verify Email OTP" />
            ) : (
              <p className="text-[12.5px] text-[#705c53] font-semibold text-center py-1">
                Verify your mobile number first. We will then send an OTP to <span className="text-[#321c13] font-bold">{reg.maskedEmail}</span>.
              </p>
            )}
          </StepCard>

          <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-900 text-[12px] font-semibold px-3 py-2">
            <ShieldCheck size={16} className="shrink-0" />
            Both mobile and email must be verified to complete registration.
          </div>
        </div>
      </AuthShell>
    );
  }

  // ── Screen 1: Create Account ───────────────────────────────────────────────
  const border = (field) => ({ borderColor: fieldErrors[field] ? '#ef4444' : `${hex}40` });
  const FieldError = ({ field }) => (fieldErrors[field] ? <p className="text-[12px] text-red-600 font-semibold mt-1 px-1">{fieldErrors[field]}</p> : null);

  return (
    <AuthShell title={t('auto.createAccount', 'Create Account')} badge="One account · Two verified identities" social>
      <form onSubmit={start} className="space-y-4" noValidate>
        {alreadyRegistered && (
          <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-900 text-[13px] font-semibold p-3 rounded-2xl text-center">
            {alreadyRegistered}{' '}
            <Link
              to="/login"
              state={{ ...loginState, ...(fieldErrors.email && !fieldErrors.phone ? { useEmail: true, email: email.trim() } : { phone }) }}
              className="font-extrabold underline"
              style={{ color: hex }}
            >
              Log in instead
            </Link>
          </div>
        )}
        <Notice kind="error">{error}</Notice>

        <div>
          <label htmlFor="su-name" className="block text-[11px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">Full Name *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${hex}b3` }}><User size={18} /></span>
            <input id="su-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={fieldClass} style={border('name')} disabled={busy} aria-invalid={Boolean(fieldErrors.name)} />
          </div>
          <FieldError field="name" />
        </div>

        <div>
          <label htmlFor="su-phone" className="block text-[11px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">Primary Mobile Number *</label>
          <div className="flex gap-2">
            <select aria-label="Country code" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-[84px] h-12 px-2 bg-[#FFFdfa] border rounded-[16px] text-[15px] font-semibold text-[#321c13] focus:outline-none text-center" style={{ borderColor: `${hex}40` }} disabled={busy}>
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+971">+971</option>
            </select>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${hex}b3` }}><Phone size={18} /></span>
              <input id="su-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="98765 43210" className={fieldClass} style={border('phone')} disabled={busy} aria-invalid={Boolean(fieldErrors.phone)} />
            </div>
          </div>
          {fieldErrors.phone ? <FieldError field="phone" /> : <p className="text-[12px] text-[#8a766b] mt-1 px-1">Your primary customer contact</p>}
        </div>

        <div>
          <label htmlFor="su-email" className="block text-[11px] font-bold text-[#556b2f] mb-1.5 px-1 uppercase tracking-wider">Email Address *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: `${hex}b3` }}><Mail size={18} /></span>
            <input id="su-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" className={fieldClass} style={border('email')} disabled={busy} aria-invalid={Boolean(fieldErrors.email)} />
          </div>
          {fieldErrors.email ? <FieldError field="email" /> : <p className="text-[12px] text-[#8a766b] mt-1 px-1">Your associated email for login &amp; orders</p>}
        </div>

        <div className="flex gap-2.5 items-start rounded-2xl p-3 text-[12.5px] font-semibold text-[#5b4a40]" style={{ backgroundColor: `${hex}12` }}>
          <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: hex }} />
          <span>We will verify both identities – you will receive separate OTPs on your mobile number and email address.</span>
        </div>

        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={busy} className="w-full h-12 text-white rounded-[16px] text-[15px] font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: hex }}>
          {busy ? 'Sending OTP…' : <>Continue to Verification <ArrowRight size={18} /></>}
        </motion.button>
      </form>

      <div className="text-center mt-6 text-[13px] font-bold text-[#705c53]">
        Already have an account?{' '}
        <Link to="/login" state={loginState} className="inline-block py-2 hover:underline" style={{ color: hex }}>Log in here!</Link>
      </div>
    </AuthShell>
  );
};

export default Signup;
