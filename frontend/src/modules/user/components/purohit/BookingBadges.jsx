import { BOOKING_STATUS, PAYMENT_STATUS } from '../../../../features/purohit/booking';

const TONES = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

const Badge = ({ tone, children, testId }) => (
  <span data-testid={testId} className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] md:text-[11px] font-black whitespace-nowrap ${TONES[tone] || TONES.slate}`}>
    {children}
  </span>
);

export const BookingStatusBadge = ({ status }) => {
  const s = BOOKING_STATUS[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone} testId="booking-status">{s.label}</Badge>;
};

export const PaymentStatusBadge = ({ status }) => {
  const s = PAYMENT_STATUS[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone} testId="payment-status">{s.label}</Badge>;
};
