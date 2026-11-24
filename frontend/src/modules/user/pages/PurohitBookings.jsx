import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronRight, CalendarCheck, CircleCheck } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import { BookingStatusBadge, PaymentStatusBadge } from '../components/purohit/BookingBadges';
import usePujaBookingStore from '../../../features/purohit/usePujaBookingStore';
import { formatINR } from '../../../features/purohit/selectors';
import { formatDate } from '../../../features/purohit/booking';
import { bookingPath, PUROHIT_ALL_PATH, useMithilakFlowFlags } from '../../../features/purohit/navigation';

const GROUPS = [
  { id: 'upcoming', label: 'Upcoming', match: (s) => !['completed', 'rejected', 'cancelled_customer', 'cancelled_purohit', 'payment_failed', 'refund_pending', 'refunded', 'no_show'].includes(s) },
  { id: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { id: 'cancelled', label: 'Cancelled / other', match: (s) => ['rejected', 'cancelled_customer', 'cancelled_purohit', 'payment_failed', 'refund_pending', 'refunded', 'no_show'].includes(s) },
];

/** Step 10: customer's booking history with tabs. */
const PurohitBookings = () => {
  const navigate = useNavigate();
  useMithilakFlowFlags();
  const [params] = useSearchParams();
  const placed = Number(params.get('placed')) || 0;
  const bookings = usePujaBookingStore((st) => st.bookings);
  const [tab, setTab] = useState('upcoming');

  const group = GROUPS.find((g) => g.id === tab);
  const list = bookings.filter((b) => group.match(b.status)).sort((a, b) => (a.date || '').localeCompare(b.date || '') || b.createdAt - a.createdAt);
  const count = (g) => bookings.filter((b) => g.match(b.status)).length;

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-12" data-testid="purohit-bookings-page">
      <SEO title="My Puja Bookings" />
      <PurohitTopBar title="My Puja Bookings" />

      <div className="max-w-[820px] mx-auto px-3 md:px-6 pt-3">
        {placed > 0 && (
          <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-[13px] font-bold text-emerald-800" data-testid="bookings-placed">
            <CircleCheck size={18} className="text-emerald-600" /> {placed} bookings placed. Track them below.
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3" role="tablist">
          {GROUPS.map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={tab === g.id} onClick={() => setTab(g.id)} data-testid={`bookings-tab-${g.id}`} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-black whitespace-nowrap border cursor-pointer ${tab === g.id ? 'bg-[color:var(--ml-primary,#207C8A)] text-white border-[color:var(--ml-primary,#207C8A)]' : 'bg-white text-[#3F2A20] border-[#EADCC9]'}`}>
              {g.label} ({count(g)})
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="bookings-empty">
            <CalendarCheck size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">{bookings.length ? `No ${group.label.toLowerCase()} bookings` : 'No bookings yet'}</p>
            <button type="button" onClick={() => navigate(PUROHIT_ALL_PATH)} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Book a puja</button>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => navigate(bookingPath(b.id))} data-testid={`booking-row-${b.id}`} className="w-full text-left bg-white rounded-[18px] border border-[#EADCC9]/70 p-3.5 cursor-pointer hover:border-[color:var(--ml-primary,#207C8A)]/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-400">{b.id}</p>
                      <p className="text-[14.5px] font-black text-[#3F2A20] truncate">{b.ritualName}</p>
                      <p className="text-[12px] font-semibold text-slate-500 truncate">{b.panditName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <BookingStatusBadge status={b.status} />
                      <PaymentStatusBadge status={b.paymentStatus} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1"><CalendarDays size={13} /> {formatDate(b.date)} · {b.slot}</p>
                    <p className="text-[14px] font-black text-slate-900 flex items-center gap-1">{formatINR(b.totals.total)}{b.totals.travelPending ? '+' : ''}<ChevronRight size={15} className="text-slate-400" /></p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PurohitBookings;
