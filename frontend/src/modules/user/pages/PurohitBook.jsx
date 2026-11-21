import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Flower2, BadgeCheck, CalendarDays, Clock, Info, ShoppingBag, Zap } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import usePujaBookingStore from '../../../features/purohit/usePujaBookingStore';
import { usePurohitCatalog, useLiveListing, panditImage, formatINR } from '../../../features/purohit/selectors';
import {
  SERVICE_MODES, VENUES, SAMAGRI_OPTIONS, optionLabel, bookableRange, formatDate, isSlotTaken, priceBreakdown,
  validateBookingForm, normalizeMobile,
} from '../../../features/purohit/booking';
import { PUJA_CART_PATH, PUJA_CHECKOUT_PATH, panditCardPath, useBackToMithilak, useMithilakFlowFlags } from '../../../features/purohit/navigation';
import { handleImageError } from '../../../shared/utils/imageUtils';

const CUSTOMER_KEY = 'mk_puja_customer_v1';
const loadCustomer = () => { try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || {}; } catch { return {}; } };
const saveCustomer = (c) => { try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c)); } catch { /* ignore */ } };

const inputCls = 'w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-[14px] font-semibold text-[#3F2A20] outline-none focus:border-[color:var(--ml-primary,#207C8A)] focus:ring-2 focus:ring-[color:var(--ml-primary,#207C8A)]/20 disabled:bg-slate-50';

const Field = ({ n, label, error, children, hint }) => (
  <div>
    <label className="block text-[13px] font-black text-[#3F2A20] mb-1.5">{n ? `${n}. ` : ''}{label}</label>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-400 font-semibold mt-1">{hint}</p>}
    {error && <p role="alert" className="text-[11.5px] text-rose-600 font-bold mt-1">{error}</p>}
  </div>
);

const Radio = ({ name, checked, onChange, disabled, children, testId }) => (
  <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[13.5px] font-semibold cursor-pointer transition-colors ${disabled ? 'opacity-45 cursor-not-allowed bg-slate-50' : checked ? 'border-[color:var(--ml-primary,#207C8A)] bg-[#E9F5F7] text-[#3F2A20]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
    <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} data-testid={testId} className="w-4 h-4 accent-[color:var(--ml-primary,#207C8A)]" />
    <span>{children}</span>
  </label>
);

const SummaryRow = ({ label, value, strong }) => (
  <div className="flex items-start justify-between gap-3 text-[12.5px] py-1">
    <span className="text-slate-500 font-semibold">{label}</span>
    <span className={`text-right ${strong ? 'font-black text-slate-900' : 'font-bold text-[#3F2A20]'}`}>{value}</span>
  </div>
);

/** Steps 5–6: configure the booking (date, slot, type, venue, language, address, requirements). */
const PurohitBook = () => {
  const { serviceId } = useParams();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const navigate = useNavigate();
  const goBack = useBackToMithilak();
  useMithilakFlowFlags();
  const { settings } = usePurohitCatalog();
  const listing = useLiveListing(serviceId);
  const cart = usePujaBookingStore((st) => st.cart);
  const bookings = usePujaBookingStore((st) => st.bookings);
  const holds = usePujaBookingStore((st) => st.holds);
  const addToCart = usePujaBookingStore((st) => st.addToCart);
  const updateCartItem = usePujaBookingStore((st) => st.updateCartItem);

  const editing = useMemo(() => cart.find((c) => c.id === editId && c.serviceId === serviceId) || null, [cart, editId, serviceId]);
  const range = useMemo(() => bookableRange(settings), [settings]);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState(() => {
    if (editing) return { ...editing.form };
    const c = loadCustomer();
    const svc = listing?.service;
    const pnd = listing?.pandit;
    return {
      date: '',
      slot: '',
      mode: svc?.inPerson === false && svc?.online && pnd?.onlineAvailable ? 'online' : 'in_person',
      venue: 'home',
      language: pnd?.languages?.[0] || 'Hindi',
      address: c.address || '',
      pincode: c.pincode || '',
      name: c.name || '',
      phone: c.phone || '',
      participants: 2,
      samagri: 'customer',
      notes: '',
    };
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  if (!listing) {
    return (
      <div className="bg-[#F5F9FA] min-h-screen pb-10" data-testid="purohit-book-page">
        <SEO title="Service not found" />
        <PurohitTopBar title="Book a puja" />
        <div className="max-w-[600px] mx-auto px-3 pt-6">
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="purohit-book-missing">
            <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">This puja service isn&apos;t available right now</p>
            <button type="button" onClick={goBack} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const { pandit, ritual, service } = listing;
  const available = pandit.available !== false;
  const canOnline = Boolean(service.online && pandit.onlineAvailable);
  const canInPerson = service.inPerson !== false;
  const languages = pandit.languages?.length ? pandit.languages : ['Hindi'];
  const slots = (settings.timeSlots || []).filter(Boolean);
  const inPerson = form.mode === 'in_person';
  const errors = validateBookingForm(form, { service, pandit, settings });
  const liveDateError = form.date && errors.date ? errors.date : '';
  const show = (k) => (k === 'date' ? liveDateError || (submitted ? errors.date : '') : (submitted ? errors[k] : ''));
  const totals = priceBreakdown(service, form);

  // A slot is unavailable when booked/held by someone else, or already in this customer's cart (other item).
  const ownHold = editing ? holds.find((h) => h.cartId === editing.id) : null;
  const slotTaken = (slot) => {
    if (!form.date) return false;
    if (isSlotTaken({ bookings, holds }, { panditId: pandit.id, date: form.date, slot, ignoreHoldId: ownHold?.id })) return true;
    return cart.some((c) => c.id !== editing?.id && c.panditId === pandit.id && c.form.date === form.date && c.form.slot === slot);
  };
  const dateOk = form.date && !errors.date;

  const submit = (goCheckout) => {
    setSubmitted(true);
    if (!available) { toast.error('This purohit is not accepting bookings right now'); return; }
    if (Object.keys(errors).length) {
      toast.error('Please fix the highlighted fields');
      const first = document.querySelector('[role="alert"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (slotTaken(form.slot)) { toast.error('That slot was just taken — please choose another'); set({ slot: '' }); return; }
    const cleaned = {
      ...form,
      name: form.name.trim(),
      phone: normalizeMobile(form.phone),
      address: inPerson ? form.address.trim() : '',
      pincode: inPerson ? String(form.pincode).trim() : '',
      venue: inPerson ? form.venue : '',
      participants: Number(form.participants),
      notes: form.notes.trim(),
      samagri: service.samagriPrice == null && form.samagri === 'included' ? 'customer' : form.samagri,
    };
    const item = {
      serviceId: service.id,
      panditId: pandit.id,
      ritualId: ritual.id,
      panditName: pandit.name,
      ritualName: ritual.name,
      price: service.price,
      form: cleaned,
      totals: priceBreakdown(service, cleaned),
    };
    saveCustomer({ name: cleaned.name, phone: cleaned.phone, address: cleaned.address, pincode: cleaned.pincode });
    if (editing) { updateCartItem(editing.id, item); toast.success('Booking updated'); } else { addToCart(item); toast.success(`${ritual.name} added to your Puja Cart`); }
    navigate(goCheckout ? PUJA_CHECKOUT_PATH : PUJA_CART_PATH);
  };

  const samagriChoices = SAMAGRI_OPTIONS.filter((o) => o.id !== 'included' || service.samagriPrice != null);

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-28 md:pb-12" data-testid="purohit-book-page">
      <SEO title={`Book ${ritual.name} – ${pandit.name}`} />
      <PurohitTopBar title={editing ? 'Edit booking' : 'Book your puja'} subtitle={`${ritual.name} · ${pandit.name}`} />

      <div className="max-w-[1000px] mx-auto px-3 md:px-6 pt-4">
        {!available && (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-[13px] font-bold px-4 py-3" role="alert">
            {pandit.name} is not accepting bookings right now.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-4 md:gap-6 items-start">
          {/* ------------------------------ form ------------------------------ */}
          <form className="bg-white rounded-[20px] border border-[#EADCC9]/70 p-4 md:p-5 space-y-5" onSubmit={(e) => { e.preventDefault(); submit(false); }} noValidate data-testid="booking-form">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <img src={panditImage(pandit)} alt="" className="w-12 h-12 rounded-full object-cover" onError={handleImageError} />
              <div className="min-w-0">
                <h2 className="text-[16px] md:text-[18px] font-black text-[#3F2A20] truncate">{ritual.name}</h2>
                <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1 truncate">
                  {pandit.name}{pandit.verified && <BadgeCheck size={13} className="text-[color:var(--ml-primary,#207C8A)] flex-shrink-0" />}
                </p>
              </div>
              <button type="button" onClick={() => navigate(panditCardPath(service))} className="ml-auto text-[12px] font-bold text-[color:var(--ml-primary,#207C8A)] hover:underline cursor-pointer flex-shrink-0">View profile</button>
            </div>

            <Field n={1} label="Select puja date" error={show('date')} hint={`Bookable from ${formatDate(range.min)} to ${formatDate(range.max)}`}>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  className={`${inputCls} pl-9`}
                  min={range.min}
                  max={range.max}
                  value={form.date}
                  onChange={(e) => set({ date: e.target.value, slot: '' })}
                  aria-label="Puja date"
                  data-testid="booking-date"
                />
              </div>
            </Field>

            <Field n={2} label="Select time slot" error={show('slot')} hint={!form.date ? 'Choose a date to see available slots' : ''}>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Time slot">
                {slots.map((slot) => {
                  const taken = slotTaken(slot);
                  const disabled = !dateOk || taken;
                  const active = form.slot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={disabled}
                      onClick={() => set({ slot })}
                      data-testid={`slot-${slot.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
                      className={`px-2.5 py-2.5 rounded-xl border text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors ${active ? 'border-[color:var(--ml-primary,#207C8A)] bg-[color:var(--ml-primary,#207C8A)] text-white' : disabled ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-700 hover:border-[color:var(--ml-primary,#207C8A)] cursor-pointer'}`}
                    >
                      <Clock size={12} /> {slot}{taken && <span className="text-[9.5px] font-black uppercase">· Booked</span>}
                    </button>
                  );
                })}
              </div>
              {slots.length === 0 && <p className="text-[12px] text-rose-600 font-bold mt-1">No time slots are configured yet.</p>}
            </Field>

            <Field n={3} label="Select service type" error={show('mode')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_MODES.map((m) => {
                  const off = m.id === 'online' ? !canOnline : !canInPerson;
                  return (
                    <Radio key={m.id} name="mode" checked={form.mode === m.id} disabled={off} onChange={() => set({ mode: m.id })} testId={`mode-${m.id}`}>
                      {m.label}{off && <span className="text-[10.5px] text-slate-400 font-bold"> (not offered)</span>}
                    </Radio>
                  );
                })}
              </div>
            </Field>

            {inPerson && (
              <Field n={4} label="Select venue" error={show('venue')}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {VENUES.map((v) => (
                    <Radio key={v.id} name="venue" checked={form.venue === v.id} onChange={() => set({ venue: v.id })} testId={`venue-${v.id}`}>{v.label}</Radio>
                  ))}
                </div>
              </Field>
            )}

            <Field n={inPerson ? 5 : 4} label="Preferred language" error={show('language')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {languages.map((l) => (
                  <Radio key={l} name="language" checked={form.language === l} onChange={() => set({ language: l })} testId={`lang-${l.toLowerCase()}`}>{l}</Radio>
                ))}
              </div>
            </Field>

            {inPerson && (
              <Field n={6} label="Service address" error={show('address')} hint={pandit.serviceAreas?.length ? `Serves: ${pandit.serviceAreas.join(', ')}` : ''}>
                <input className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Enter full address / city" aria-label="Service address" data-testid="booking-address" autoComplete="street-address" />
                <div className="mt-2">
                  <input className={inputCls} value={form.pincode} onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="PIN code" inputMode="numeric" aria-label="PIN code" data-testid="booking-pincode" autoComplete="postal-code" />
                  {show('pincode') && <p role="alert" className="text-[11.5px] text-rose-600 font-bold mt-1">{show('pincode')}</p>}
                </div>
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Your name" error={show('name')}>
                <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} aria-label="Your name" data-testid="booking-name" autoComplete="name" />
              </Field>
              <Field label="Mobile number" error={show('phone')}>
                <input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" placeholder="10-digit mobile number" aria-label="Mobile number" data-testid="booking-phone" autoComplete="tel" />
              </Field>
              <Field label="Number of participants" error={show('participants')}>
                <input type="number" min="1" max="500" className={inputCls} value={form.participants} onChange={(e) => set({ participants: e.target.value })} aria-label="Number of participants" data-testid="booking-participants" />
              </Field>
              <Field label="Puja samagri">
                <select className={inputCls} value={form.samagri} onChange={(e) => set({ samagri: e.target.value })} aria-label="Puja samagri" data-testid="booking-samagri">
                  {samagriChoices.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}{o.id === 'included' ? ` (+${formatINR(service.samagriPrice)})` : ''}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Additional requirements (optional)">
              <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Special rituals, family requirements…" aria-label="Additional requirements" maxLength={500} />
            </Field>

            <p className="flex items-start gap-1.5 text-[11.5px] text-slate-400 font-semibold">
              <Info size={13} className="flex-shrink-0 mt-[1px]" /> We only ask for the details needed to perform the ritual. Your phone number is shared with the purohit only after the booking is confirmed.
            </p>

            {/* Mobile action bar is below; desktop buttons are in the summary card */}
          </form>

          {/* ----------------------------- summary ----------------------------- */}
          <aside className="md:sticky md:top-20 bg-white rounded-[20px] border border-[#EADCC9]/70 p-4 space-y-1" data-testid="booking-summary">
            <h3 className="text-[14px] font-black text-[#3F2A20] mb-1">Booking summary</h3>
            <SummaryRow label="Service" value={ritual.name} />
            <SummaryRow label="Purohit" value={pandit.name} />
            <SummaryRow label="Date" value={form.date ? formatDate(form.date) : '—'} />
            <SummaryRow label="Time slot" value={form.slot || '—'} />
            <SummaryRow label="Mode" value={optionLabel(SERVICE_MODES, form.mode)} />
            {inPerson && <SummaryRow label="Venue" value={optionLabel(VENUES, form.venue)} />}
            <SummaryRow label="Language" value={form.language} />
            <SummaryRow label="Participants" value={form.participants || '—'} />

            <div className="border-t border-slate-100 my-2" />
            <SummaryRow label={settings.posterPriceLabel || 'Dakshina'} value={formatINR(totals.dakshina)} />
            {totals.samagri > 0 && <SummaryRow label="Puja samagri" value={formatINR(totals.samagri)} />}
            {inPerson && (totals.travelPending
              ? <SummaryRow label="Travel charges" value={<span className="text-slate-500 font-semibold">Calculated separately</span>} />
              : totals.travel > 0 && <SummaryRow label="Travel charges" value={formatINR(totals.travel)} />)}
            <SummaryRow label="Total" strong value={<span className="text-[17px] text-emerald-700">{formatINR(totals.total)}{totals.travelPending ? '+' : ''}</span>} />
            <p className="text-[10.5px] text-slate-400 font-semibold pt-1">Prices are set by MithilaKart. Your slot is only reserved at checkout.</p>

            <div className="hidden md:grid gap-2 pt-3">
              <button type="button" onClick={() => submit(true)} disabled={!available} data-testid="booking-book-now" className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[13.5px] font-black disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform">
                <Zap size={15} /> Book now
              </button>
              <button type="button" onClick={() => submit(false)} disabled={!available} data-testid="booking-add-to-cart" className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[color:var(--ml-primary,#207C8A)] text-[color:var(--ml-primary,#207C8A)] text-[13.5px] font-black disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform">
                <ShoppingBag size={15} /> {editing ? 'Save changes' : 'Add to Puja Cart'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky action bar (sits above the bottom nav) */}
      <div className="md:hidden fixed left-0 right-0 bottom-[60px] z-40 px-3 pb-2 pt-2 bg-gradient-to-t from-[#F5F9FA] via-[#F5F9FA]/95 to-transparent">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#EADCC9] shadow-[0_-4px_18px_rgba(0,0,0,0.08)] p-2">
          <div className="pl-2 min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400 leading-none">Total</p>
            <p className="text-[16px] font-black text-slate-900 leading-tight">{formatINR(totals.total)}{totals.travelPending ? '+' : ''}</p>
          </div>
          <button type="button" onClick={() => submit(false)} disabled={!available} data-testid="booking-add-to-cart-mobile" className="ml-auto px-3 py-2.5 rounded-xl border-2 border-[color:var(--ml-primary,#207C8A)] text-[color:var(--ml-primary,#207C8A)] text-[12.5px] font-black disabled:opacity-50 cursor-pointer">
            {editing ? 'Save' : 'Add to Cart'}
          </button>
          <button type="button" onClick={() => submit(true)} disabled={!available} data-testid="booking-book-now-mobile" className="px-3.5 py-2.5 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black disabled:opacity-50 cursor-pointer">
            Book now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurohitBook;
