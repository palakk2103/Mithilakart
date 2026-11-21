/**
 * Puja booking — shared constants & pure helpers (FRONTEND ONLY).
 *
 * Booking status and payment status are separate fields on purpose: a payment can succeed
 * while the booking still waits for purohit approval. When the backend exists, these lists
 * mirror its enums and the helpers below stay as UI logic.
 */

/* ------------------------------ booking statuses ------------------------------ */
export const BOOKING_STATUS = {
  pending_payment: { label: 'Pending Payment', hint: 'Awaiting payment', tone: 'amber' },
  pending_approval: { label: 'Pending Purohit Approval', hint: 'Awaiting approval', tone: 'amber' },
  confirmed: { label: 'Confirmed', hint: 'Booking accepted', tone: 'green' },
  upcoming: { label: 'Upcoming', hint: 'Puja scheduled', tone: 'blue' },
  in_progress: { label: 'In Progress', hint: 'Puja started', tone: 'blue' },
  completed: { label: 'Completed', hint: 'Service delivered', tone: 'green' },
  rejected: { label: 'Rejected', hint: 'Purohit could not accept', tone: 'red' },
  cancelled_customer: { label: 'Cancelled by Customer', hint: '', tone: 'red' },
  cancelled_purohit: { label: 'Cancelled by Purohit', hint: '', tone: 'red' },
  reschedule_requested: { label: 'Reschedule Requested', hint: 'Waiting for new date approval', tone: 'amber' },
  rescheduled: { label: 'Rescheduled', hint: 'New date confirmed', tone: 'blue' },
  payment_failed: { label: 'Payment Failed', hint: '', tone: 'red' },
  refund_pending: { label: 'Refund Pending', hint: '', tone: 'amber' },
  refunded: { label: 'Refunded', hint: '', tone: 'slate' },
  no_show: { label: 'No Show', hint: '', tone: 'red' },
};

/** Main lifecycle shown as a timeline. */
export const BOOKING_LIFECYCLE = ['pending_payment', 'pending_approval', 'confirmed', 'upcoming', 'in_progress', 'completed'];

export const PAYMENT_STATUS = {
  pending: { label: 'Payment pending', tone: 'amber' },
  pay_on_service: { label: 'Pay on service day', tone: 'blue' },
  paid: { label: 'Paid', tone: 'green' },
  failed: { label: 'Payment failed', tone: 'red' },
  refund_pending: { label: 'Refund pending', tone: 'amber' },
  refunded: { label: 'Refunded', tone: 'slate' },
};

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', hint: 'Online payment — available once payments are connected', online: true },
  { id: 'card', label: 'Card / Net banking', hint: 'Online payment — available once payments are connected', online: true },
  { id: 'pay_on_service', label: 'Pay on service day', hint: 'Pay the purohit / MithilaKart on the day of the puja', online: false },
];

const CANCELLABLE = new Set(['pending_payment', 'pending_approval', 'confirmed', 'upcoming', 'reschedule_requested', 'rescheduled']);
const RESCHEDULABLE = new Set(['pending_approval', 'confirmed', 'upcoming', 'rescheduled']);
/** Statuses that keep the purohit's slot occupied. */
const SLOT_BLOCKING = new Set(['pending_payment', 'pending_approval', 'confirmed', 'upcoming', 'in_progress', 'reschedule_requested', 'rescheduled']);
const CONTACT_ALLOWED = new Set(['confirmed', 'upcoming', 'in_progress', 'rescheduled', 'completed']);

export const canCancel = (b) => CANCELLABLE.has(b.status);
export const canReschedule = (b) => RESCHEDULABLE.has(b.status);
export const canConfirmCompletion = (b) => b.status === 'in_progress' || (b.status === 'upcoming' && isPastOrToday(b.date));
export const canReview = (b) => b.status === 'completed' && !b.review;
export const canSeeContact = (b) => CONTACT_ALLOWED.has(b.status);
export const isActiveBooking = (b) => SLOT_BLOCKING.has(b.status);

/* --------------------------------- form options --------------------------------- */
export const SERVICE_MODES = [
  { id: 'in_person', label: 'In-person Puja' },
  { id: 'online', label: 'Online Puja (video call)' },
];
export const VENUES = [
  { id: 'home', label: 'At my home' },
  { id: 'temple', label: 'At a temple' },
  { id: 'other', label: 'Other location' },
];
export const SAMAGRI_OPTIONS = [
  { id: 'customer', label: 'I will arrange the samagri' },
  { id: 'included', label: 'Include puja samagri' },
  { id: 'not_needed', label: 'Not needed' },
];
export const optionLabel = (list, id) => list.find((x) => x.id === id)?.label || id || '—';

/* ------------------------------------ dates ------------------------------------ */
const pad = (n) => String(n).padStart(2, '0');
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parseISODate = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const formatDate = (s) => (s ? parseISODate(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export function isPastOrToday(s) { return s ? toISODate(new Date()) >= s : false; }

export const bookableRange = (settings) => {
  const today = new Date();
  return {
    min: toISODate(addDays(today, Math.max(0, Number(settings?.minLeadDays) || 0))),
    max: toISODate(addDays(today, Math.max(1, Number(settings?.maxAdvanceDays) || 90))),
  };
};

/** Is the purohit working on this weekday? */
export const worksOn = (pandit, isoDate) => {
  const days = Array.isArray(pandit?.workingDays) && pandit.workingDays.length ? pandit.workingDays : [0, 1, 2, 3, 4, 5, 6];
  return days.includes(parseISODate(isoDate).getDay());
};

/* ------------------------------ slot availability ------------------------------ */
/**
 * A slot is unavailable when another active booking (or a live checkout hold) has the same
 * purohit + date + slot. Frontend-only simulation of the backend's availability check.
 */
export const isSlotTaken = ({ bookings = [], holds = [] }, { panditId, date, slot, ignoreBookingId, ignoreHoldId }) => {
  const now = Date.now();
  const booked = bookings.some((b) => b.id !== ignoreBookingId && b.panditId === panditId && isActiveBooking(b)
    && ((b.date === date && b.slot === slot) || (b.status === 'reschedule_requested' && b.requestedDate === date && b.requestedSlot === slot)));
  const held = holds.some((h) => h.id !== ignoreHoldId && h.expiresAt > now && h.panditId === panditId && h.date === date && h.slot === slot);
  return booked || held;
};

/* ------------------------------------ price ------------------------------------ */
/**
 * Price breakdown for one booking. Travel applies to in-person bookings only; when the admin
 * hasn't set a travel charge it is "calculated separately" (shown, not added).
 */
export const priceBreakdown = (service, form) => {
  const dakshina = Number(service?.price) || 0;
  const samagri = form?.samagri === 'included' && service?.samagriPrice != null ? Number(service.samagriPrice) || 0 : 0;
  const inPerson = form?.mode !== 'online';
  const travelKnown = inPerson && service?.travelCharge != null;
  const travel = travelKnown ? Number(service.travelCharge) || 0 : 0;
  return {
    dakshina,
    samagri,
    travel,
    travelPending: inPerson && !travelKnown,
    total: dakshina + samagri + travel,
  };
};

/* ---------------------------------- validation ---------------------------------- */
/** "+91 98765 43210" / "098765 43210" → "9876543210". */
export const normalizeMobile = (v) => {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  return d;
};

export const validateBookingForm = (form, { service, pandit, settings }) => {
  const errors = {};
  const range = bookableRange(settings);
  if (!form.date) errors.date = 'Choose the puja date';
  else if (form.date < range.min || form.date > range.max) errors.date = 'Choose a date within the bookable range';
  else if (!worksOn(pandit, form.date)) errors.date = `${pandit?.name || 'The purohit'} is not available on this day`;
  if (!form.slot) errors.slot = 'Choose a time slot';
  if (!form.mode) errors.mode = 'Choose the service type';
  if (form.mode === 'online' && !(service?.online && pandit?.onlineAvailable)) errors.mode = 'Online puja is not offered for this service';
  if (form.mode === 'in_person') {
    if (service?.inPerson === false) errors.mode = 'In-person puja is not offered for this service';
    if (!form.venue) errors.venue = 'Choose the venue';
    if (String(form.address || '').trim().length < 10) errors.address = 'Enter the full address';
    if (!/^\d{6}$/.test(String(form.pincode || '').trim())) errors.pincode = 'Enter a valid 6-digit PIN code';
  }
  if (!form.language) errors.language = 'Choose a language';
  if (String(form.name || '').trim().length < 2) errors.name = 'Enter your name';
  if (!/^[6-9]\d{9}$/.test(normalizeMobile(form.phone))) errors.phone = 'Enter a valid 10-digit mobile number';
  const n = Number(form.participants);
  if (!Number.isFinite(n) || n < 1 || n > 500) errors.participants = 'Enter the number of participants (1–500)';
  return errors;
};

/* ------------------------------------- ids ------------------------------------- */
export const newBookingId = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MKP-${ymd}-${rand}`;
};
