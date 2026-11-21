import { useEffect, useState } from 'react';

/**
 * Countdowns driven by the server (AUTH-4). The send-OTP response carries
 * `expiresAt`, `resendAvailableAt` and `serverTime`; the difference between
 * serverTime and this device's clock is applied so a phone whose clock is off
 * still shows the real remaining time. Before this the screen ran its own 60 s
 * timer labelled "expires in" that had nothing to do with the server's expiry.
 */
export default function useOtpCountdown(session) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  if (!session) return { expiresIn: 0, resendIn: 0, expired: false };

  const skew = session.serverTime ? new Date(session.serverTime).getTime() - session.receivedAt : 0;
  const serverNow = now + skew;
  const expiresIn = session.expiresAt ? Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - serverNow) / 1000)) : 0;
  const resendIn = session.resendAvailableAt
    ? Math.max(0, Math.ceil((new Date(session.resendAvailableAt).getTime() - serverNow) / 1000))
    : 0;
  return { expiresIn, resendIn, expired: Boolean(session.expiresAt) && expiresIn === 0 };
}

/** Stamp a send-OTP response with the moment it arrived (for clock skew). */
export const toOtpSession = (result) => (result ? { ...result, receivedAt: Date.now() } : null);

export const formatMmSs = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** A rate-limit error tells us when resend opens again. */
export const sessionFromRetry = (session, err) => {
  const retry = Number(err?.details?.retryAfterSeconds);
  if (!retry || err?.details?.locked) return session;
  return { ...(session || {}), resendAvailableAt: new Date(Date.now() + retry * 1000).toISOString(), serverTime: null, receivedAt: Date.now() };
};
