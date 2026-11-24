import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Timer, TriangleAlert, ShieldCheck, CalendarDays, MapPin, Video, Info } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import usePujaBookingStore from '../../../features/purohit/usePujaBookingStore';
import { usePurohitCatalog, buildListings, formatINR } from '../../../features/purohit/selectors';
import { PAYMENT_METHODS, SERVICE_MODES, VENUES, formatDate, optionLabel, priceBreakdown, normalizeMobile, isSlotTaken } from '../../../features/purohit/booking';
import { PUJA_CART_PATH, PUJA_BOOKINGS_PATH, bookingPath, useMithilakFlowFlags } from '../../../features/purohit/navigation';

const inputCls = 'w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-[14px] font-semibold text-[#3F2A20] outline-none focus:border-[color:var(--ml-primary,#207C8A)]';
const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

/**
 * Steps 8–9: checkout. Re-checks availability, holds every slot for N minutes, takes the
 * customer details + payment method, and only then creates the bookings.
 * (Frontend simulation of the backend's "check → hold → pay → confirm" rule.)
 */
const PurohitCheckout = () => {
  const navigate = useNavigate();
  useMithilakFlowFlags();
  const catalog = usePurohitCatalog();
  const { settings } = catalog;
  const cart = usePujaBookingStore((st) => st.cart);
  const holds = usePujaBookingStore((st) => st.holds);
  const bookings = usePujaBookingStore((st) => st.bookings);
  const holdCart = usePujaBookingStore((st) => st.holdCart);
  const releaseHolds = usePujaBookingStore((st) => st.releaseHolds);
  const updateCartItem = usePujaBookingStore((st) => st.updateCartItem);
  const placeOrder = usePujaBookingStore((st) => st.placeOrder);

  const [now, setNow] = useState(() => Date.now());
  const [method, setMethod] = useState('pay_on_service');
  const [placing, setPlacing] = useState(false);
  const first = cart[0]?.form;
  const [name, setName] = useState(first?.name || '');
  const [phone, setPhone] = useState(first?.phone || '');
  const [errors, setErrors] = useState({});
  const placedRef = useRef(false);

  const live = useMemo(() => new Map(buildListings(catalog).map((l) => [l.service.id, l])), [catalog]);

  // Live prices (the admin may have changed them since the item was added).
  const lines = useMemo(() => cart.map((item) => {
    const listing = live.get(item.serviceId);
    const totals = listing ? priceBreakdown(listing.service, item.form) : item.totals;
    return { item, listing, totals };
  }), [cart, live]);
  const unavailable = lines.filter((l) => !l.listing || l.listing.pandit.available === false);
  const total = lines.reduce((sum, l) => sum + l.totals.total, 0);
  const travelPending = lines.some((l) => l.totals.travelPending);

  const minutes = Math.max(1, Number(settings.slotHoldMinutes) || 10);
  const startHold = useCallback(() => holdCart(minutes), [holdCart, minutes]);

  // Check availability + hold the slots when checkout opens.
  useEffect(() => {
    if (!cart.length) return undefined;
    startHold();
    return () => { if (!placedRef.current) releaseHolds(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on entry
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const myHolds = holds.filter((h) => cart.some((c) => c.id === h.cartId));
  const allHeld = cart.length > 0 && cart.every((c) => myHolds.some((h) => h.cartId === c.id && h.expiresAt > now));
  const expiresAt = allHeld ? Math.min(...myHolds.map((h) => h.expiresAt)) : 0;
  // A slot is "in conflict" when it isn't held by us and someone else has it (booked / held).
  const conflicts = cart.filter((c) => !myHolds.some((h) => h.cartId === c.id && h.expiresAt > now)
    && isSlotTaken({ bookings, holds }, { panditId: c.panditId, date: c.form.date, slot: c.form.slot }));
  const expired = cart.length > 0 && conflicts.length === 0 && !allHeld;

  const validate = () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Enter your name';
    if (!/^[6-9]\d{9}$/.test(normalizeMobile(phone))) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const place = () => {
    if (placing) return;
    if (unavailable.length) { toast.error('Remove unavailable services first'); return; }
    if (!validate()) return;
    const m = PAYMENT_METHODS.find((x) => x.id === method);
    if (m?.online) { toast('Online payment will be available soon — please choose “Pay on service day”.'); return; }
    // Re-check availability right before booking.
    const res = startHold();
    if (!res.ok) { toast.error('A slot is no longer available'); return; }
    setPlacing(true);
    // Persist live prices on each item, then convert the cart into bookings.
    lines.forEach((l) => updateCartItem(l.item.id, { price: l.listing.service.price, totals: l.totals }));
    const out = placeOrder({ paymentMethod: method, customer: { name: name.trim(), phone: normalizeMobile(phone) } });
    if (!out.ok) { setPlacing(false); toast.error('Your slot hold expired. Please try again.'); return; }
    placedRef.current = true;
    toast.success(out.ids.length > 1 ? `${out.ids.length} bookings placed` : 'Booking placed');
    navigate(out.ids.length > 1 ? `${PUJA_BOOKINGS_PATH}?placed=${out.ids.length}` : `${bookingPath(out.ids[0])}?new=1`, { replace: true });
  };

  if (!cart.length) {
    return (
      <div className="bg-[#F5F9FA] min-h-screen" data-testid="purohit-checkout-page">
        <SEO title="Checkout" />
        <PurohitTopBar title="Checkout" />
        <div className="max-w-[600px] mx-auto px-3 pt-6">
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="checkout-empty">
            <p className="text-[15px] font-black text-[#3F2A20]">Nothing to check out</p>
            <button type="button" onClick={() => navigate(PUJA_BOOKINGS_PATH)} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">My bookings</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-28 md:pb-12" data-testid="purohit-checkout-page">
      <SEO title="Checkout" />
      <PurohitTopBar title="Checkout" subtitle="Puja services" />

      <div className="max-w-[1000px] mx-auto px-3 md:px-6 pt-4 space-y-3">
        {/* Slot hold status */}
        {conflicts.length > 0 ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700 flex items-start gap-2" role="alert" data-testid="checkout-conflict">
            <TriangleAlert size={16} className="flex-shrink-0 mt-[1px]" />
            <div>
              {conflicts.length === 1 ? 'One slot is' : `${conflicts.length} slots are`} no longer available.
              <button type="button" onClick={() => navigate(PUJA_CART_PATH)} className="ml-2 underline cursor-pointer">Go to cart to change it</button>
            </div>
          </div>
        ) : allHeld ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-800 flex items-center gap-2" data-testid="checkout-hold">
            <Timer size={16} /> Your slot{cart.length > 1 ? 's are' : ' is'} held for <span className="tabular-nums font-black" data-testid="hold-countdown">{mmss(expiresAt - now)}</span>
          </div>
        ) : expired ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800 flex items-center gap-2 flex-wrap" role="alert" data-testid="checkout-expired">
            <Timer size={16} /> Your slot hold expired.
            <button type="button" onClick={startHold} className="underline cursor-pointer" data-testid="hold-recheck">Check availability again</button>
          </div>
        ) : null}

        {unavailable.length > 0 && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700" role="alert">
            Some services are no longer available. <button type="button" onClick={() => navigate(PUJA_CART_PATH)} className="underline cursor-pointer">Review your cart</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-4 md:gap-6 items-start">
          <div className="space-y-3">
            {/* Customer details */}
            <section className="bg-white rounded-[18px] border border-[#EADCC9]/70 p-4 space-y-3">
              <h3 className="text-[14px] font-black text-[#3F2A20]">Your details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-black text-[#3F2A20] mb-1">Name</label>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-label="Customer name" data-testid="checkout-name" autoComplete="name" />
                  {errors.name && <p role="alert" className="text-[11.5px] text-rose-600 font-bold mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-[12px] font-black text-[#3F2A20] mb-1">Mobile number</label>
                  <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" aria-label="Customer mobile" data-testid="checkout-phone" autoComplete="tel" />
                  {errors.phone && <p role="alert" className="text-[11.5px] text-rose-600 font-bold mt-1">{errors.phone}</p>}
                </div>
              </div>
            </section>

            {/* Booking information */}
            <section className="bg-white rounded-[18px] border border-[#EADCC9]/70 p-4" data-testid="checkout-items">
              <h3 className="text-[14px] font-black text-[#3F2A20] mb-2">Booking information</h3>
              <ul className="divide-y divide-slate-100">
                {lines.map(({ item, totals }) => (
                  <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-black text-[#3F2A20] truncate">{item.ritualName}</p>
                        <p className="text-[11.5px] font-semibold text-slate-500 truncate">{item.panditName}</p>
                        <p className="text-[11.5px] font-semibold text-slate-600 mt-1 flex items-center gap-1 flex-wrap"><CalendarDays size={12} /> {formatDate(item.form.date)} · {item.form.slot}</p>
                        <p className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1 flex-wrap">
                          {item.form.mode === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                          {optionLabel(SERVICE_MODES, item.form.mode)}{item.form.mode !== 'online' && <> · {optionLabel(VENUES, item.form.venue)} · {item.form.address}, {item.form.pincode}</>}
                        </p>
                      </div>
                      <p className="text-[14px] font-black text-slate-900 flex-shrink-0">{formatINR(totals.total)}{totals.travelPending ? '+' : ''}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-[18px] border border-[#EADCC9]/70 p-4 space-y-2" data-testid="checkout-payment">
              <h3 className="text-[14px] font-black text-[#3F2A20]">Payment method</h3>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-[13.5px] font-semibold ${m.online ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-100' : method === m.id ? 'border-[color:var(--ml-primary,#207C8A)] bg-[#E9F5F7] cursor-pointer' : 'border-slate-200 cursor-pointer'}`}>
                  <input type="radio" name="pay" className="mt-1 w-4 h-4 accent-[color:var(--ml-primary,#207C8A)]" checked={method === m.id} disabled={m.online} onChange={() => setMethod(m.id)} data-testid={`pay-${m.id}`} />
                  <span>
                    <span className="block text-[#3F2A20]">{m.label}{m.online && <span className="ml-1.5 text-[10px] font-black uppercase text-slate-400">Coming soon</span>}</span>
                    <span className="block text-[11px] text-slate-400 font-semibold">{m.hint}</span>
                  </span>
                </label>
              ))}
            </section>
          </div>

          {/* Price breakdown */}
          <aside className="md:sticky md:top-20 bg-white rounded-[20px] border border-[#EADCC9]/70 p-4 space-y-1.5" data-testid="checkout-summary">
            <h3 className="text-[14px] font-black text-[#3F2A20] mb-1">Price breakdown</h3>
            {lines.map(({ item, totals }) => (
              <div key={item.id} className="text-[12.5px]">
                <div className="flex justify-between"><span className="text-slate-600 font-bold truncate pr-2">{item.ritualName}</span><span className="font-bold text-[#3F2A20]">{formatINR(totals.dakshina)}</span></div>
                {totals.samagri > 0 && <div className="flex justify-between text-slate-500 font-semibold pl-2"><span>Puja samagri</span><span>{formatINR(totals.samagri)}</span></div>}
                {totals.travel > 0 && <div className="flex justify-between text-slate-500 font-semibold pl-2"><span>Travel</span><span>{formatINR(totals.travel)}</span></div>}
                {totals.travelPending && <div className="flex justify-between text-slate-400 font-semibold pl-2"><span>Travel</span><span>Calculated separately</span></div>}
              </div>
            ))}
            <div className="flex justify-between items-baseline border-t border-slate-100 pt-2 mt-1">
              <span className="text-[13.5px] font-black text-[#3F2A20]">Total</span>
              <span className="text-[19px] font-black text-emerald-700" data-testid="checkout-total">{formatINR(total)}{travelPending ? '+' : ''}</span>
            </div>
            <p className="flex items-start gap-1.5 text-[11px] text-slate-400 font-semibold pt-1"><ShieldCheck size={13} className="flex-shrink-0 mt-[1px]" /> The booking is confirmed only after the purohit approves it. You will be able to track it in My Bookings.</p>
            <p className="flex items-start gap-1.5 text-[11px] text-slate-400 font-semibold"><Info size={13} className="flex-shrink-0 mt-[1px]" /> Saved on this device only until the booking system goes live.</p>
            <button type="button" onClick={place} disabled={placing || conflicts.length > 0 || !allHeld || unavailable.length > 0} data-testid="place-booking" className="hidden md:flex w-full mt-2 items-center justify-center py-3 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[13.5px] font-black disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform">
              Place booking
            </button>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed left-0 right-0 bottom-[60px] z-40 px-3 pb-2 pt-2 bg-gradient-to-t from-[#F5F9FA] via-[#F5F9FA]/95 to-transparent">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#EADCC9] shadow-[0_-4px_18px_rgba(0,0,0,0.08)] p-2">
          <div className="pl-2">
            <p className="text-[10px] font-bold uppercase text-slate-400 leading-none">Total</p>
            <p className="text-[16px] font-black text-slate-900 leading-tight">{formatINR(total)}{travelPending ? '+' : ''}</p>
          </div>
          <button type="button" onClick={place} disabled={placing || conflicts.length > 0 || !allHeld || unavailable.length > 0} data-testid="place-booking-mobile" className="ml-auto px-5 py-2.5 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[13px] font-black disabled:opacity-50 cursor-pointer">
            Place booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurohitCheckout;
