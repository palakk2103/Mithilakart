import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBag, Trash2, Pencil, TriangleAlert, ChevronRight, CalendarDays, MapPin, Video, Info } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import usePujaBookingStore from '../../../features/purohit/usePujaBookingStore';
import { usePurohitCatalog, buildListings, panditImage, formatINR } from '../../../features/purohit/selectors';
import { SERVICE_MODES, VENUES, formatDate, isSlotTaken, optionLabel } from '../../../features/purohit/booking';
import { bookServicePath, PUJA_CHECKOUT_PATH, PUROHIT_ALL_PATH, useMithilakFlowFlags } from '../../../features/purohit/navigation';
import { handleImageError } from '../../../shared/utils/imageUtils';

/** Step 7: the Puja Cart — configured bookings added as service items (not yet confirmed). */
const PurohitCart = () => {
  const navigate = useNavigate();
  useMithilakFlowFlags();
  const catalog = usePurohitCatalog();
  const cart = usePujaBookingStore((st) => st.cart);
  const bookings = usePujaBookingStore((st) => st.bookings);
  const holds = usePujaBookingStore((st) => st.holds);
  const removeFromCart = usePujaBookingStore((st) => st.removeFromCart);
  const clearCart = usePujaBookingStore((st) => st.clearCart);

  const live = useMemo(() => new Map(buildListings(catalog).map((l) => [l.service.id, l])), [catalog]);

  // Re-evaluated on every render: slot availability, price changes and disabled services.
  const rows = cart.map((item) => {
    const listing = live.get(item.serviceId) || null;
    const ownHold = holds.find((h) => h.cartId === item.id);
    const slotGone = isSlotTaken({ bookings, holds }, { panditId: item.panditId, date: item.form.date, slot: item.form.slot, ignoreHoldId: ownHold?.id });
    const duplicateInCart = cart.some((c) => c.id !== item.id && c.id < item.id && c.panditId === item.panditId && c.form.date === item.form.date && c.form.slot === item.form.slot);
    const priceChanged = listing && listing.service.price !== item.price;
    let problem = '';
    if (!listing) problem = 'This service is no longer available.';
    else if (listing.pandit.available === false) problem = `${item.panditName} is not accepting bookings right now.`;
    else if (slotGone || duplicateInCart) problem = 'This slot is no longer available — please edit the booking and pick another.';
    return { item, listing, problem, priceChanged };
  });

  const total = rows.reduce((sum, r) => sum + (r.listing ? r.item.totals.total - r.item.totals.dakshina + r.listing.service.price : r.item.totals.total), 0);
  const anyTravelPending = rows.some((r) => r.item.totals.travelPending);
  const blocked = rows.some((r) => r.problem);

  const proceed = () => {
    if (!cart.length) return;
    if (blocked) { toast.error('Fix the highlighted bookings first'); return; }
    navigate(PUJA_CHECKOUT_PATH);
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-28 md:pb-12" data-testid="purohit-cart-page">
      <SEO title="Puja Cart" />
      <PurohitTopBar title="Puja Cart" subtitle={cart.length ? `${cart.length} service${cart.length === 1 ? '' : 's'}` : undefined} />

      <div className="max-w-[900px] mx-auto px-3 md:px-6 pt-4">
        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="puja-cart-empty">
            <ShoppingBag size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">Your Puja Cart is empty</p>
            <p className="text-[12px] text-slate-500 font-semibold mt-1">Choose a purohit and configure your puja booking.</p>
            <button type="button" onClick={() => navigate(PUROHIT_ALL_PATH)} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Browse pujas</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-4 md:gap-6 items-start">
            <ul className="space-y-3">
              {rows.map(({ item, listing, problem, priceChanged }) => (
                <li key={item.id} className={`bg-white rounded-[18px] border p-3.5 ${problem ? 'border-rose-300' : 'border-[#EADCC9]/70'}`} data-testid={`cart-item-${item.serviceId}`}>
                  <div className="flex gap-3">
                    <img src={listing ? panditImage(listing.pandit) : panditImage({ name: item.panditName })} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" onError={handleImageError} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-black text-[#3F2A20] truncate">{item.ritualName}</p>
                      <p className="text-[12px] font-semibold text-slate-500 truncate">Service · {item.panditName}</p>
                      <p className="text-[11.5px] font-semibold text-slate-600 mt-1 flex items-center gap-1 flex-wrap">
                        <CalendarDays size={12} /> {formatDate(item.form.date)} · {item.form.slot}
                      </p>
                      <p className="text-[11.5px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                        {item.form.mode === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                        {optionLabel(SERVICE_MODES, item.form.mode)}
                        {item.form.mode !== 'online' && <> · {optionLabel(VENUES, item.form.venue)}</>} · {item.form.language}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[15px] font-black text-slate-900">{formatINR(listing ? item.totals.total - item.totals.dakshina + listing.service.price : item.totals.total)}{item.totals.travelPending ? '+' : ''}</p>
                      {priceChanged && <p className="text-[10px] font-bold text-amber-600">Price updated</p>}
                    </div>
                  </div>

                  {problem && (
                    <p className="mt-2.5 flex items-start gap-1.5 text-[12px] font-bold text-rose-600 bg-rose-50 rounded-lg px-2.5 py-2" role="alert">
                      <TriangleAlert size={14} className="flex-shrink-0 mt-[1px]" /> {problem}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                    {listing && (
                      <button type="button" onClick={() => navigate(`${bookServicePath({ id: item.serviceId })}?edit=${encodeURIComponent(item.id)}`)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold text-[color:var(--ml-primary,#207C8A)] hover:bg-[#E9F5F7] cursor-pointer" aria-label={`Edit ${item.ritualName} booking`}>
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                    <button type="button" onClick={() => { removeFromCart(item.id); toast(`Removed ${item.ritualName}`); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold text-rose-500 hover:bg-rose-50 cursor-pointer" aria-label={`Remove ${item.ritualName}`} data-testid={`cart-remove-${item.serviceId}`}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => { if (window.confirm('Remove all services from your Puja Cart?')) clearCart(); }} className="text-[12px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer">Clear cart</button>
              </li>
            </ul>

            <aside className="md:sticky md:top-20 bg-white rounded-[20px] border border-[#EADCC9]/70 p-4 space-y-2" data-testid="puja-cart-summary">
              <h3 className="text-[14px] font-black text-[#3F2A20]">Order summary</h3>
              <div className="flex justify-between text-[13px]"><span className="text-slate-500 font-semibold">Subtotal ({cart.length})</span><span className="font-black text-slate-900">{formatINR(total)}</span></div>
              {anyTravelPending && <div className="flex justify-between text-[12.5px]"><span className="text-slate-500 font-semibold">Travel charges</span><span className="font-semibold text-slate-500">Calculated separately</span></div>}
              <div className="flex justify-between items-baseline border-t border-slate-100 pt-2"><span className="text-[13.5px] font-black text-[#3F2A20]">Total</span><span className="text-[19px] font-black text-emerald-700" data-testid="puja-cart-total">{formatINR(total)}{anyTravelPending ? '+' : ''}</span></div>
              <p className="flex items-start gap-1.5 text-[11px] text-slate-400 font-semibold pt-1"><Info size={13} className="flex-shrink-0 mt-[1px]" /> Adding to the cart does not confirm a booking. Your slot is held at checkout, and confirmed after approval by the purohit.</p>
              <button type="button" onClick={proceed} disabled={blocked} data-testid="puja-proceed-checkout" className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[13.5px] font-black disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform">
                Proceed to Checkout <ChevronRight size={16} />
              </button>
              <button type="button" onClick={() => navigate('/cart')} className="w-full text-[11.5px] font-bold text-slate-500 hover:text-[color:var(--ml-primary,#207C8A)] cursor-pointer pt-1">
                Looking for your product cart? Open it here →
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurohitCart;
