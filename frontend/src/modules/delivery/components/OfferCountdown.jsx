import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * CR-002 — remaining time on a ranked delivery offer.
 *
 * Derived from the server's `offerExpiresAt`. The countdown is display only:
 * expiry is enforced server-side, so a client with a skewed clock cannot
 * accept an offer the backend already reassigned.
 *
 * Renders nothing in broadcast mode, where assignments carry no expiry.
 */
export default function OfferCountdown({ expiresAt, className = '' }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return undefined;
    }

    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Number.isNaN(ms) ? null : Math.max(0, Math.ceil(ms / 1000)));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (remaining === null) return null;

  const urgent = remaining <= 15;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums ${
        urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
      } ${className}`}
    >
      <Clock size={11} strokeWidth={3} />
      {remaining > 0 ? `${remaining}s` : 'Expired'}
    </span>
  );
}
