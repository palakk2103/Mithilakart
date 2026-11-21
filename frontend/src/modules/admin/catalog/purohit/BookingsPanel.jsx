import { useMemo, useState } from 'react';
import { CalendarCheck, Trash2, ChevronDown, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import usePujaBookingStore from '../../../../features/purohit/usePujaBookingStore';
import { formatINR } from '../../../../features/purohit/selectors';
import { BOOKING_STATUS, PAYMENT_STATUS, SERVICE_MODES, VENUES, optionLabel, formatDate } from '../../../../features/purohit/booking';
import { inputCls, SearchBox, EmptyState, Pill, iconBtn } from './ui';

const TONE = { amber: 'amber', green: 'teal', blue: 'blue', red: 'amber', slate: 'slate' };

const Detail = ({ label, value }) => (
  <div className="text-xs"><span className="text-slate-400 font-semibold">{label}: </span><span className="font-bold text-slate-700 break-words">{value || '—'}</span></div>
);

/**
 * Bookings (demo operations console). Until the purohit dashboard + backend exist, admin moves a
 * booking through its lifecycle here. Booking status and payment status are separate fields.
 */
const BookingsPanel = () => {
  const bookings = usePujaBookingStore((st) => st.bookings);
  const setBookingStatus = usePujaBookingStore((st) => st.setBookingStatus);
  const setPaymentStatus = usePujaBookingStore((st) => st.setPaymentStatus);
  const deleteBooking = usePujaBookingStore((st) => st.deleteBooking);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);

  const filtered = useMemo(() => bookings.filter((b) => {
    if (status && b.status !== status) return false;
    const q = query.trim().toLowerCase();
    return !q || [b.id, b.ritualName, b.panditName, b.customer?.name, b.customer?.phone].some((x) => String(x || '').toLowerCase().includes(q));
  }), [bookings, query, status]);

  const needsApproval = bookings.filter((b) => b.status === 'pending_approval').length;
  const reschedules = bookings.filter((b) => b.status === 'reschedule_requested').length;

  const move = (b, next, note) => { setBookingStatus(b.id, next, note); toast.success(`${b.id}: ${BOOKING_STATUS[next].label}`); };
  const remove = (b) => { if (window.confirm(`Delete booking ${b.id}? This cannot be undone.`)) { deleteBooking(b.id); toast.success('Booking deleted'); } };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-900 leading-relaxed">
        <p className="font-bold">Demo operations console (this browser only)</p>
        <p>Customers&apos; bookings placed on this device appear here. Move them through the lifecycle to test the customer flow. In production, purohits approve or reject from their own dashboard and payments update automatically.</p>
        {(needsApproval > 0 || reschedules > 0) && (
          <p className="mt-1 font-bold">{needsApproval > 0 && `${needsApproval} awaiting purohit approval`}{needsApproval > 0 && reschedules > 0 && ' · '}{reschedules > 0 && `${reschedules} reschedule request${reschedules > 1 ? 's' : ''}`}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search booking ID, customer, pandit" />
        <select className={`${inputCls} w-auto bg-white`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter bookings by status">
          <option value="">All statuses</option>
          {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={bookings.length ? 'No bookings match your filters' : 'No bookings yet'}>
          {!bookings.length && 'Place a booking from the Mithilak tab to see it here.'}
        </EmptyState>
      ) : (
        <ul className="space-y-2.5" data-testid="admin-bookings">
          {filtered.map((b) => {
            const expanded = open === b.id;
            return (
              <li key={b.id} className="bg-white border border-slate-100 rounded-2xl p-3" data-testid={`admin-booking-${b.id}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">{b.id}</span>
                      <Pill tone={TONE[BOOKING_STATUS[b.status]?.tone] || 'slate'}>{BOOKING_STATUS[b.status]?.label || b.status}</Pill>
                      <Pill tone="slate">{PAYMENT_STATUS[b.paymentStatus]?.label || b.paymentStatus}</Pill>
                    </div>
                    <p className="font-bold text-slate-900 mt-0.5">{b.ritualName} <span className="font-semibold text-slate-500">· {b.panditName}</span></p>
                    <p className="text-xs text-slate-500">{formatDate(b.date)} · {b.slot} · {b.customer?.name} ({b.customer?.phone}) · {formatINR(b.totals.total)}{b.totals.travelPending ? '+' : ''}</p>
                    {b.status === 'reschedule_requested' && b.requestedDate && (
                      <p className="text-xs font-bold text-amber-700 mt-0.5">Wants: {formatDate(b.requestedDate)} · {b.requestedSlot}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" className={iconBtn} onClick={() => setOpen(expanded ? null : b.id)} aria-label={`Details for ${b.id}`} aria-expanded={expanded}><ChevronDown size={16} className={expanded ? 'rotate-180' : ''} /></button>
                    <button type="button" className={`${iconBtn} text-rose-500`} onClick={() => remove(b)} aria-label={`Delete ${b.id}`}><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {b.status === 'pending_approval' && (
                    <>
                      <button type="button" onClick={() => move(b, 'confirmed', 'Approved by purohit')} data-testid={`approve-${b.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"><Check size={13} /> Approve</button>
                      <button type="button" onClick={() => move(b, 'rejected', 'Rejected by purohit')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 text-xs font-bold cursor-pointer"><X size={13} /> Reject</button>
                    </>
                  )}
                  {b.status === 'reschedule_requested' && (
                    <>
                      <button type="button" onClick={() => move(b, 'rescheduled', 'Reschedule approved')} data-testid={`approve-resched-${b.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"><Check size={13} /> Approve new date</button>
                      <button type="button" onClick={() => move(b, 'confirmed', 'Reschedule declined')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold cursor-pointer">Decline</button>
                    </>
                  )}
                  {b.status === 'pending_payment' && (
                    <button type="button" onClick={() => { setPaymentStatus(b.id, 'paid'); move(b, 'pending_approval', 'Payment received'); }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer">Mark paid</button>
                  )}
                  {['confirmed', 'rescheduled'].includes(b.status) && (
                    <button type="button" onClick={() => move(b, 'upcoming', 'Puja scheduled')} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer">Mark upcoming</button>
                  )}
                  {['confirmed', 'upcoming', 'rescheduled'].includes(b.status) && (
                    <button type="button" onClick={() => move(b, 'in_progress', 'Puja started')} data-testid={`start-${b.id}`} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer">Start puja</button>
                  )}
                  {b.status === 'in_progress' && (
                    <button type="button" onClick={() => move(b, 'completed', 'Marked completed')} data-testid={`complete-${b.id}`} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">Mark completed</button>
                  )}

                  <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    Status
                    <select className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-slate-700" value={b.status} onChange={(e) => move(b, e.target.value, 'Changed by admin')} aria-label={`Booking status for ${b.id}`}>
                      {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    Payment
                    <select className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-slate-700" value={b.paymentStatus} onChange={(e) => { setPaymentStatus(b.id, e.target.value); toast.success('Payment status updated'); }} aria-label={`Payment status for ${b.id}`}>
                      {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </label>
                </div>

                {expanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    <Detail label="Type" value={optionLabel(SERVICE_MODES, b.mode)} />
                    <Detail label="Venue" value={b.mode === 'online' ? 'Online' : `${optionLabel(VENUES, b.venue)}, ${b.address} ${b.pincode}`} />
                    <Detail label="Language" value={b.language} />
                    <Detail label="Participants" value={b.participants} />
                    <Detail label="Samagri" value={b.samagri} />
                    <Detail label="Payment method" value={b.paymentMethod} />
                    <Detail label="Requirements" value={b.notes} />
                    <Detail label="Review" value={b.review ? `${b.review.rating}★ ${b.review.text || ''}` : ''} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BookingsPanel;
