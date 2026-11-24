import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CalendarCheck } from 'lucide-react';
import usePujaBookingStore from '../../../../features/purohit/usePujaBookingStore';
import { PUJA_CART_PATH, PUJA_BOOKINGS_PATH } from '../../../../features/purohit/navigation';

/**
 * "Puja Cart (n)" and "My Bookings (n)" pills. Rendered only when there is something to show,
 * inline (never floating) so they don't collide with the product cart pill.
 */
const PujaCartLinks = ({ className = '', compact = false }) => {
  const navigate = useNavigate();
  const cartCount = usePujaBookingStore((st) => st.cart.length);
  const bookingCount = usePujaBookingStore((st) => st.bookings.length);
  if (!cartCount && !bookingCount) return null;

  const pill = 'inline-flex items-center gap-1.5 rounded-full font-black shadow-sm active:scale-95 transition-transform cursor-pointer whitespace-nowrap';
  const size = compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-[11.5px] md:text-[12.5px]';
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {cartCount > 0 && (
        <button type="button" onClick={() => navigate(PUJA_CART_PATH)} data-testid="puja-cart-link" className={`${pill} ${size} bg-[color:var(--ml-primary,#207C8A)] text-white`}>
          <ShoppingBag size={13} /> {compact ? `Cart (${cartCount})` : `Puja Cart (${cartCount})`}
        </button>
      )}
      {bookingCount > 0 && (
        <button type="button" onClick={() => navigate(PUJA_BOOKINGS_PATH)} data-testid="puja-bookings-link" className={`${pill} ${size} bg-white text-[color:var(--ml-primary,#207C8A)] border border-[color:var(--ml-primary,#207C8A)]/40`}>
          <CalendarCheck size={13} /> {compact ? `Bookings (${bookingCount})` : `My Bookings (${bookingCount})`}
        </button>
      )}
    </div>
  );
};

export default PujaCartLinks;
