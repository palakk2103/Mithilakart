import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { newBookingId, isSlotTaken } from './booking';

/**
 * Puja cart + bookings — FRONTEND ONLY (this browser's localStorage).
 *
 * - cart:     configured bookings the customer added ("service items"); not yet booked.
 * - holds:    temporary slot holds created at checkout (expire after N minutes).
 * - bookings: placed bookings with booking status, payment status, history and review.
 *
 * Kept separate from the product cart (utils/cartUtils.js), which is server-backed and only
 * accepts backend products. Backend integration later: replace these actions with
 *   POST /service-bookings/hold, POST /service-bookings, POST /payments,
 *   POST /service-bookings/{id}/cancel | reschedule | approve, GET /customers/me/bookings.
 */

export const PUJA_BOOKING_KEY = 'mk_puja_bookings_v1';
const now = () => Date.now();
const newId = (p) => `${p}_${now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const historyEntry = (status, by, note = '') => ({ status, at: now(), by, note });

const usePujaBookingStore = create(
  persist(
    (set, get) => ({
      cart: [],
      holds: [],
      bookings: [],

      /* ------------------------------ cart ------------------------------ */
      /** item: { serviceId, panditId, ritualId, panditName, ritualName, price, form, totals } */
      addToCart: (item) => {
        const id = newId('cart');
        set((st) => ({ cart: [...st.cart, { ...item, id, addedAt: now() }] }));
        return id;
      },
      updateCartItem: (id, patch) => set((st) => ({ cart: st.cart.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeFromCart: (id) => set((st) => ({ cart: st.cart.filter((x) => x.id !== id), holds: st.holds.filter((h) => h.cartId !== id) })),
      clearCart: () => set({ cart: [], holds: [] }),

      /* ------------------------------ holds ----------------------------- */
      /**
       * Hold every cart item's slot for `minutes`. Returns { ok, conflicts: [cartId] }.
       * Re-checks availability first (the slot may have been booked since it was added).
       */
      holdCart: (minutes = 10) => {
        const st = get();
        const live = st.holds.filter((h) => h.expiresAt > now());
        const conflicts = [];
        const newHolds = [];
        st.cart.forEach((item) => {
          const q = { panditId: item.panditId, date: item.form.date, slot: item.form.slot };
          const mine = live.find((h) => h.cartId === item.id);
          const taken = isSlotTaken({ bookings: st.bookings, holds: [...live, ...newHolds] }, { ...q, ignoreHoldId: mine?.id });
          // Two items in the same cart for the same purohit/date/slot also conflict.
          if (taken) { conflicts.push(item.id); return; }
          newHolds.push({ id: mine?.id || newId('hold'), cartId: item.id, ...q, expiresAt: now() + minutes * 60 * 1000 });
        });
        if (conflicts.length) return { ok: false, conflicts };
        set({ holds: [...live.filter((h) => !st.cart.some((c) => c.id === h.cartId)), ...newHolds] });
        return { ok: true, conflicts: [], expiresAt: Math.min(...newHolds.map((h) => h.expiresAt)) };
      },
      releaseHolds: () => set((st) => ({ holds: st.holds.filter((h) => !st.cart.some((c) => c.id === h.cartId) && h.expiresAt > now()) })),

      /* ---------------------------- checkout ---------------------------- */
      /**
       * Turn the cart into bookings. Requires live holds for every item.
       * Online methods can't be charged yet → booking stays "Pending Payment".
       * Pay-on-service-day → goes straight to "Pending Purohit Approval".
       */
      placeOrder: ({ paymentMethod, customer }) => {
        const st = get();
        const t = now();
        const missing = st.cart.filter((c) => !st.holds.some((h) => h.cartId === c.id && h.expiresAt > t));
        if (missing.length) return { ok: false, reason: 'hold_expired', items: missing.map((m) => m.id) };
        const online = paymentMethod !== 'pay_on_service';
        const orderId = newId('order');
        const created = st.cart.map((c) => {
          const status = online ? 'pending_payment' : 'pending_approval';
          return {
            id: newBookingId(),
            orderId,
            serviceId: c.serviceId,
            panditId: c.panditId,
            ritualId: c.ritualId,
            panditName: c.panditName,
            ritualName: c.ritualName,
            ...c.form,
            customer: { ...customer, name: c.form.name, phone: c.form.phone },
            totals: c.totals,
            paymentMethod,
            paymentStatus: online ? 'pending' : 'pay_on_service',
            status,
            statusHistory: [historyEntry(status, 'customer', 'Booking placed')],
            createdAt: t,
            review: null,
          };
        });
        set((s2) => ({
          bookings: [...created, ...s2.bookings],
          cart: [],
          holds: s2.holds.filter((h) => !st.cart.some((c) => c.id === h.cartId)),
        }));
        return { ok: true, ids: created.map((b) => b.id), orderId };
      },

      /* --------------------------- customer actions --------------------------- */
      cancelBooking: (id, reason = '') => set((st) => ({
        bookings: st.bookings.map((b) => (b.id !== id ? b : {
          ...b,
          status: 'cancelled_customer',
          paymentStatus: b.paymentStatus === 'paid' ? 'refund_pending' : b.paymentStatus,
          statusHistory: [...b.statusHistory, historyEntry('cancelled_customer', 'customer', reason)],
        })),
      })),
      /** Returns false when the requested slot is not free. */
      requestReschedule: (id, date, slot) => {
        const st = get();
        const b = st.bookings.find((x) => x.id === id);
        if (!b || isSlotTaken({ bookings: st.bookings, holds: st.holds }, { panditId: b.panditId, date, slot, ignoreBookingId: id })) return false;
        set({
          bookings: st.bookings.map((x) => (x.id !== id ? x : {
            ...x,
            status: 'reschedule_requested',
            requestedDate: date,
            requestedSlot: slot,
            statusHistory: [...x.statusHistory, historyEntry('reschedule_requested', 'customer', `Requested ${date}, ${slot}`)],
          })),
        });
        return true;
      },
      confirmCompletion: (id) => set((st) => ({
        bookings: st.bookings.map((b) => (b.id !== id ? b : {
          ...b,
          status: 'completed',
          customerConfirmedAt: now(),
          statusHistory: [...b.statusHistory, historyEntry('completed', 'customer', 'Customer confirmed completion')],
        })),
      })),
      addReview: (id, rating, text) => set((st) => ({
        bookings: st.bookings.map((b) => (b.id !== id ? b : { ...b, review: { rating, text: String(text || '').trim(), at: now() } })),
      })),

      /* ---------------------- admin / purohit actions (demo) ---------------------- */
      setBookingStatus: (id, status, note = '', by = 'admin') => set((st) => ({
        bookings: st.bookings.map((b) => {
          if (b.id !== id) return b;
          const next = { ...b, status, statusHistory: [...b.statusHistory, historyEntry(status, by, note)] };
          // Approving a reschedule moves the booking to the requested date/slot.
          if (status === 'rescheduled' && b.requestedDate) {
            next.date = b.requestedDate;
            next.slot = b.requestedSlot;
            next.requestedDate = null;
            next.requestedSlot = null;
          }
          return next;
        }),
      })),
      setPaymentStatus: (id, paymentStatus) => set((st) => ({
        bookings: st.bookings.map((b) => (b.id === id ? { ...b, paymentStatus } : b)),
      })),
      deleteBooking: (id) => set((st) => ({ bookings: st.bookings.filter((b) => b.id !== id) })),
    }),
    {
      name: PUJA_BOOKING_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (st) => ({ cart: st.cart, holds: st.holds, bookings: st.bookings }),
    },
  ),
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === PUJA_BOOKING_KEY) usePujaBookingStore.persist.rehydrate();
  });
  // The old "My Puja Selection" list (no booking details) is replaced by the Puja Cart.
  try { localStorage.removeItem('mk_puja_selection_v1'); } catch { /* ignore */ }
}

export default usePujaBookingStore;
