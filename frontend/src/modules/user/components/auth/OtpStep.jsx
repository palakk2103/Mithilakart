import React from 'react';
import { motion } from 'framer-motion';
import OtpBoxes from './OtpBoxes';
import useOtpCountdown, { formatMmSs } from './useOtpCountdown';

/**
 * One OTP step: "We sent a 6-digit OTP to …", six boxes, server-driven
 * "OTP expires in 05:00", Verify button and "Resend OTP (in 30s)".
 */
const OtpStep = ({
  sentTo,
  session,
  otp,
  setOtp,
  onVerify,
  onResend,
  verifying = false,
  resending = false,
  verifyLabel = 'Verify OTP',
  accent,
  buttonClass = '',
  invalid = false,
}) => {
  const { expiresIn, resendIn, expired } = useOtpCountdown(session);
  const busy = verifying || resending;

  return (
    <div className="space-y-4">
      <p className="text-center text-[13px] text-[#705c53] font-semibold">
        We sent a 6-digit OTP to <span className="text-[#321c13] font-bold whitespace-nowrap">{sentTo}</span>
      </p>

      <OtpBoxes value={otp} onChange={setOtp} onComplete={(code) => !busy && !expired && onVerify(code)} disabled={verifying} accent={accent} invalid={invalid} />

      <p className="text-center text-[12.5px] font-bold" style={{ color: expired ? '#dc2626' : accent }} aria-live="polite">
        {session?.expiresAt
          ? (expired ? 'OTP expired. Please resend.' : `OTP expires in ${formatMmSs(expiresIn)} minutes`)
          : ' '}
      </p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={busy || otp.length !== 6 || expired}
        onClick={() => onVerify(otp)}
        className={`w-full h-12 text-white rounded-[16px] text-[15px] font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${buttonClass}`}
        style={{ backgroundColor: accent }}
      >
        {verifying ? 'Verifying…' : verifyLabel}
      </motion.button>

      <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-[13px] text-[#705c53] font-semibold">
        <span>Didn&apos;t receive OTP?</span>
        <button
          type="button"
          onClick={onResend}
          disabled={busy || resendIn > 0}
          className="min-h-[44px] px-1 text-[13px] font-bold underline disabled:opacity-60 disabled:no-underline"
          style={{ color: accent }}
        >
          {resending ? 'Sending…' : 'Resend OTP'}
        </button>
        {resendIn > 0 && <span className="text-[12px] font-medium whitespace-nowrap">(after {resendIn} sec)</span>}
      </div>
    </div>
  );
};

export default OtpStep;
