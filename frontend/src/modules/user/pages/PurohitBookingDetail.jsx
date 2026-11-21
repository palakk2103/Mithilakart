import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CircleCheck, Printer, Phone, LifeBuoy, Star, CalendarClock, Ban, BadgeCheck, Flower2, Info } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import { BookingStatusBadge, PaymentStatusBadge } from '../components/purohit/BookingBadges';
import usePujaBookingStore from '../../../features/purohit/usePujaBookingStore';
import { usePurohitCatalog, formatINR } from '../../../features/purohit/selectors';
import {
  BOOKING_STATUS, BOOKING_LIFECYCLE, SERVICE_MODES, VENUES, SAMAGRI_OPTIONS, PAYMENT_METHODS, optionLabel, formatDate,
  bookableRange, isSlotTaken, worksOn, canCancel, canReschedule, canConfirmCompletion, canReview, canSeeContact,
} from '../../../features/purohit/booking';
import { PUJA_BOOKINGS_PATH, PUROHIT_ALL_PATH, panditCardPath, useMithilakFlowFlags } from '../../../features/purohit/navigation';

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-[13px] border-b border-slate-50 last:border-0">
    <span className="text-slate-500 font-semibold flex-shrink-0">{label}</span>
    <span className="font-bold text-[#3F2A20] text-right break-words min-w-0">{value || '—'}</span>
  </div>
);

const Card = ({ title, children, testId }) => (
  <section className="bg-white rounded-[18px] border border-[#EADCC9]/70 p-4" data-testid={testId}>
    {title && <h3 className="text-[14px] font-black text-[#3F2A20] mb-2">{title}</h3>}
    {children}
  </section>
);

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Opens a clean printable receipt (user can "Save as PDF"). */
const printReceipt = (b) => {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) { toast.error('Please allow pop-ups to download the receipt'); return; }
  const rows = [
    ['Booking ID', b.id], ['Service', b.ritualName], ['Purohit', b.panditName], ['Date', formatDate(b.date)], ['Time slot', b.slot],
    ['Mode', optionLabel(SERVICE_MODES, b.mode)], ['Venue', b.mode === 'online' ? 'Online' : `${optionLabel(VENUES, b.venue)} — ${b.address}, ${b.pincode}`],
    ['Language', b.language], ['Participants', b.participants], ['Customer', `${b.customer?.name} (${b.customer?.phone})`],
    ['Status', BOOKING_STATUS[b.status]?.label || b.status], ['Payment', optionLabel(PAYMENT_METHODS, b.paymentMethod)],
  ].map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>Receipt ${esc(b.id)}</title><meta charset="utf-8"><style>
    body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#2b1a12;padding:32px;max-width:640px;margin:auto}
    h1{font-size:20px;margin:0 0 4px}p.s{color:#777;font-size:12px;margin:0 0 20px}
    table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 4px;border-bottom:1px solid #eee;vertical-align:top}td:first-child{color:#777;width:36%}
    .t td{font-weight:800;font-size:16px;border-top:2px solid #333;border-bottom:0}.n{margin-top:24px;font-size:11px;color:#888}
  </style></head><body>
  <h1>MithilaKart — Puja booking receipt</h1><p class="s">Booking placed ${esc(new Date(b.createdAt).toLocaleString('en-IN'))}</p>
  <table>${rows}
  <tr><td>Dakshina</td><td>${esc(formatINR(b.totals.dakshina))}</td></tr>
  ${b.totals.samagri ? `<tr><td>Puja samagri</td><td>${esc(formatINR(b.totals.samagri))}</td></tr>` : ''}
  ${b.totals.travel ? `<tr><td>Travel charges</td><td>${esc(formatINR(b.totals.travel))}</td></tr>` : ''}
  ${b.totals.travelPending ? '<tr><td>Travel charges</td><td>Calculated separately</td></tr>' : ''}
  <tr class="t"><td>Total</td><td>${esc(formatINR(b.totals.total))}${b.totals.travelPending ? '+' : ''}</td></tr></table>
  <p class="n">This receipt was generated on this device. Official invoices are issued once the booking system is live.</p>
  <script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
};

const Stars = ({ value, onChange }) => (
  <div className="flex gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} data-testid={`star-${n}`} className="p-0.5 cursor-pointer">
        <Star size={26} className={n <= value ? 'fill-amber-400 stroke-amber-400' : 'stroke-slate-300'} />
      </button>
    ))}
  </div>
);

/** Booking confirmation + tracking (steps 9–10). */
const PurohitBookingDetail = () => {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  useMithilakFlowFlags();
  const { settings, pandits } = usePurohitCatalog();
  const bookings = usePujaBookingStore((st) => st.bookings);
  const holds = usePujaBookingStore((st) => st.holds);
  const cancelBooking = usePujaBookingStore((st) => st.cancelBooking);
  const requestReschedule = usePujaBookingStore((st) => st.requestReschedule);
  const confirmCompletion = usePujaBookingStore((st) => st.confirmCompletion);
  const addReview = usePujaBookingStore((st) => st.addReview);

  const b = useMemo(() => bookings.find((x) => x.id === bookingId), [bookings, bookingId]);
  const [resched, setResched] = useState(null); // { date, slot } while open
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const range = useMemo(() => bookableRange(settings), [settings]);

  if (!b) {
    return (
      <div className="bg-[#F5F9FA] min-h-screen" data-testid="purohit-booking-page">
        <SEO title="Booking not found" />
        <PurohitTopBar title="Booking" />
        <div className="max-w-[600px] mx-auto px-3 pt-6">
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="booking-missing">
            <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">We couldn&apos;t find this booking on this device</p>
            <button type="button" onClick={() => navigate(PUJA_BOOKINGS_PATH)} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">My bookings</button>
          </div>
        </div>
      </div>
    );
  }

  const pandit = pandits.find((p) => p.id === b.panditId);
  const isNew = params.get('new') === '1';
  const inLifecycle = BOOKING_LIFECYCLE.includes(b.status);
  const currentIdx = BOOKING_LIFECYCLE.indexOf(b.status);
  const slots = (settings.timeSlots || []).filter(Boolean);
  const reschedDateErr = resched?.date && (resched.date < range.min || resched.date > range.max ? 'Choose a date within the bookable range' : pandit && !worksOn(pandit, resched.date) ? `${b.panditName} is not available on this day` : '');
  const slotTaken = (slot) => !resched?.date || isSlotTaken({ bookings, holds }, { panditId: b.panditId, date: resched.date, slot, ignoreBookingId: b.id });

  const doCancel = () => {
    if (!window.confirm('Cancel this booking?')) return;
    cancelBooking(b.id, 'Cancelled by customer');
    toast.success('Booking cancelled');
  };
  const submitResched = () => {
    if (!resched?.date || reschedDateErr || !resched.slot) { toast.error('Choose a valid new date and slot'); return; }
    if (!requestReschedule(b.id, resched.date, resched.slot)) { toast.error('That slot is not available'); return; }
    toast.success('Reschedule requested — waiting for the purohit to approve');
    setResched(null);
  };
  const submitReview = () => {
    if (!rating) { toast.error('Please choose a rating'); return; }
    addReview(b.id, rating, reviewText);
    toast.success('Thank you for your review');
    setReviewOpen(false);
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-12" data-testid="purohit-booking-page">
      <SEO title={`Booking ${b.id}`} />
      <PurohitTopBar title="Booking details" subtitle={b.id} />

      <div className="max-w-[820px] mx-auto px-3 md:px-6 pt-4 space-y-3">
        {isNew && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex items-start gap-3" data-testid="booking-success">
            <CircleCheck size={22} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[15px] font-black text-emerald-800">Booking placed</p>
              <p className="text-[12.5px] font-semibold text-emerald-700 mt-0.5">
                Your booking ID is <span className="font-black" data-testid="booking-id">{b.id}</span>. {b.status === 'pending_approval' ? `We have sent the request to ${b.panditName}; you’ll see the status here once they approve it.` : 'Complete the payment to confirm your booking.'}
              </p>
            </div>
          </div>
        )}

        <Card testId="booking-head">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Booking ID</p>
              <p className="text-[15px] font-black text-[#3F2A20]" data-testid="booking-id-text">{b.id}</p>
              <h2 className="text-[17px] font-black text-[#3F2A20] mt-1">{b.ritualName}</h2>
              <button type="button" onClick={() => b.serviceId && navigate(panditCardPath({ id: b.serviceId }))} className="text-[12.5px] font-semibold text-slate-600 hover:underline cursor-pointer inline-flex items-center gap-1">
                {b.panditName}{pandit?.verified && <BadgeCheck size={13} className="text-[color:var(--ml-primary,#207C8A)]" />}
              </button>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <BookingStatusBadge status={b.status} />
              <PaymentStatusBadge status={b.paymentStatus} />
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card title="Status" testId="booking-timeline">
          {inLifecycle ? (
            <ol className="relative ml-1">
              {BOOKING_LIFECYCLE.map((st, i) => {
                const done = i < currentIdx; const cur = i === currentIdx;
                return (
                  <li key={st} className="flex gap-3 pb-3 last:pb-0 relative">
                    {i < BOOKING_LIFECYCLE.length - 1 && <span className={`absolute left-[7px] top-4 bottom-0 w-px ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                    <span className={`relative z-10 mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${done ? 'bg-emerald-500 border-emerald-500' : cur ? 'bg-white border-[color:var(--ml-primary,#207C8A)] ring-4 ring-[color:var(--ml-primary,#207C8A)]/15' : 'bg-white border-slate-300'}`} />
                    <div>
                      <p className={`text-[13px] font-black ${cur ? 'text-[color:var(--ml-primary,#207C8A)]' : done ? 'text-[#3F2A20]' : 'text-slate-400'}`}>{BOOKING_STATUS[st].label}</p>
                      {(cur || done) && BOOKING_STATUS[st].hint && <p className="text-[11px] font-semibold text-slate-400">{st === 'pending_payment' && b.paymentMethod === 'pay_on_service' ? 'Pay on the day of the puja' : BOOKING_STATUS[st].hint}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-[13px] font-semibold text-slate-600">{BOOKING_STATUS[b.status]?.label}{b.status === 'reschedule_requested' && b.requestedDate ? ` — requested ${formatDate(b.requestedDate)}, ${b.requestedSlot}` : ''}</p>
          )}
          {b.statusHistory?.length > 0 && (
            <details className="mt-3 text-[12px]">
              <summary className="cursor-pointer font-bold text-slate-500">History</summary>
              <ul className="mt-2 space-y-1">
                {[...b.statusHistory].reverse().map((h) => (
                  <li key={`${h.status}-${h.at}`} className="text-slate-500 font-semibold">
                    <span className="font-black text-[#3F2A20]">{BOOKING_STATUS[h.status]?.label || h.status}</span> · {new Date(h.at).toLocaleString('en-IN')} · {h.by}{h.note ? ` — ${h.note}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>

        <Card title="Puja details" testId="booking-details">
          <Row label="Date" value={formatDate(b.date)} />
          <Row label="Time slot" value={b.slot} />
          <Row label="Service type" value={optionLabel(SERVICE_MODES, b.mode)} />
          {b.mode !== 'online' && <Row label="Venue" value={optionLabel(VENUES, b.venue)} />}
          {b.mode !== 'online' && <Row label="Address" value={`${b.address}, ${b.pincode}`} />}
          <Row label="Language" value={b.language} />
          <Row label="Participants" value={b.participants} />
          <Row label="Puja samagri" value={optionLabel(SAMAGRI_OPTIONS, b.samagri)} />
          {b.notes && <Row label="Requirements" value={b.notes} />}
          <Row label="Booked by" value={`${b.customer?.name} · ${b.customer?.phone}`} />
          <Row label="Payment" value={optionLabel(PAYMENT_METHODS, b.paymentMethod)} />
        </Card>

        <Card title="Price" testId="booking-price">
          <Row label={settings.posterPriceLabel || 'Dakshina'} value={formatINR(b.totals.dakshina)} />
          {b.totals.samagri > 0 && <Row label="Puja samagri" value={formatINR(b.totals.samagri)} />}
          {b.totals.travel > 0 && <Row label="Travel charges" value={formatINR(b.totals.travel)} />}
          {b.totals.travelPending && <Row label="Travel charges" value="Calculated separately" />}
          <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-slate-100">
            <span className="text-[14px] font-black text-[#3F2A20]">Total</span>
            <span className="text-[18px] font-black text-emerald-700">{formatINR(b.totals.total)}{b.totals.travelPending ? '+' : ''}</span>
          </div>
        </Card>

        {b.review && (
          <Card title="Your review" testId="booking-review">
            <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} className={n <= b.review.rating ? 'fill-amber-400 stroke-amber-400' : 'stroke-slate-300'} />)}</div>
            {b.review.text && <p className="text-[13px] text-slate-600 mt-1.5">{b.review.text}</p>}
          </Card>
        )}

        {/* Contact */}
        <Card title="Contact" testId="booking-contact">
          {canSeeContact(b) ? (
            pandit?.phone
              ? <a href={`tel:${pandit.phone}`} className="inline-flex items-center gap-2 text-[14px] font-black text-[color:var(--ml-primary,#207C8A)]"><Phone size={15} /> Call {b.panditName} · {pandit.phone}</a>
              : <p className="text-[12.5px] font-semibold text-slate-500">The purohit&apos;s contact number will be shared here by MithilaKart support.</p>
          ) : (
            <p className="flex items-start gap-1.5 text-[12.5px] font-semibold text-slate-500"><Info size={14} className="flex-shrink-0 mt-[1px]" /> The purohit&apos;s contact is shown after the booking is confirmed.</p>
          )}
          <button type="button" onClick={() => navigate('/profile/help-center')} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-600 hover:text-[color:var(--ml-primary,#207C8A)] cursor-pointer"><LifeBuoy size={14} /> Contact support</button>
        </Card>

        {/* Reschedule form */}
        {resched && (
          <Card title="Request a new date" testId="reschedule-form">
            <input type="date" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-[14px] font-semibold outline-none focus:border-[color:var(--ml-primary,#207C8A)]" min={range.min} max={range.max} value={resched.date} onChange={(e) => setResched({ date: e.target.value, slot: '' })} aria-label="New puja date" data-testid="reschedule-date" />
            {reschedDateErr && <p role="alert" className="text-[11.5px] text-rose-600 font-bold mt-1">{reschedDateErr}</p>}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {slots.map((slot) => {
                const taken = slotTaken(slot); const disabled = !resched.date || Boolean(reschedDateErr) || taken;
                return (
                  <button key={slot} type="button" disabled={disabled} onClick={() => setResched({ ...resched, slot })} data-testid={`resched-slot-${slot.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`} className={`px-2.5 py-2.5 rounded-xl border text-[12.5px] font-bold ${resched.slot === slot ? 'border-[color:var(--ml-primary,#207C8A)] bg-[color:var(--ml-primary,#207C8A)] text-white' : disabled ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-700 cursor-pointer'}`}>
                    {slot}{taken && resched.date ? ' · Booked' : ''}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button type="button" onClick={() => setResched(null)} className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-500 cursor-pointer">Cancel</button>
              <button type="button" onClick={submitResched} data-testid="reschedule-submit" className="px-4 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Send request</button>
            </div>
          </Card>
        )}

        {/* Review form */}
        {reviewOpen && (
          <Card title="Rate this puja" testId="review-form">
            <Stars value={rating} onChange={setRating} />
            <textarea className="mt-3 w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-[14px] font-semibold outline-none focus:border-[color:var(--ml-primary,#207C8A)]" rows={3} maxLength={500} placeholder="Share your experience (optional)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} aria-label="Review" data-testid="review-text" />
            <div className="flex gap-2 mt-3 justify-end">
              <button type="button" onClick={() => setReviewOpen(false)} className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-500 cursor-pointer">Cancel</button>
              <button type="button" onClick={submitReview} data-testid="review-submit" className="px-4 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Submit review</button>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1" data-testid="booking-actions">
          {canConfirmCompletion(b) && (
            <button type="button" onClick={() => { confirmCompletion(b.id); toast.success('Thanks for confirming'); }} data-testid="confirm-completion" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[12.5px] font-black cursor-pointer"><CircleCheck size={15} /> Confirm puja completed</button>
          )}
          {canReview(b) && !reviewOpen && (
            <button type="button" onClick={() => setReviewOpen(true)} data-testid="write-review" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-[12.5px] font-black cursor-pointer"><Star size={15} /> Write a review</button>
          )}
          {canReschedule(b) && !resched && (
            <button type="button" onClick={() => setResched({ date: '', slot: '' })} data-testid="reschedule-open" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[color:var(--ml-primary,#207C8A)] text-[color:var(--ml-primary,#207C8A)] text-[12.5px] font-black cursor-pointer"><CalendarClock size={15} /> Reschedule</button>
          )}
          {canCancel(b) && (
            <button type="button" onClick={doCancel} data-testid="cancel-booking" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-rose-300 text-rose-600 text-[12.5px] font-black cursor-pointer"><Ban size={15} /> Cancel booking</button>
          )}
          <button type="button" onClick={() => printReceipt(b)} data-testid="download-receipt" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-[12.5px] font-black cursor-pointer"><Printer size={15} /> Receipt</button>
          <button type="button" onClick={() => navigate(PUROHIT_ALL_PATH)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-500 text-[12.5px] font-bold cursor-pointer">Book another puja</button>
        </div>
      </div>
    </div>
  );
};

export default PurohitBookingDetail;
