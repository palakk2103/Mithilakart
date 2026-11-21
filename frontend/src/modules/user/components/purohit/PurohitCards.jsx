import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { AddButton } from '../common/AddToCartButton';
import { handleImageError } from '../../../../shared/utils/imageUtils';
import usePujaBookingStore from '../../../../features/purohit/usePujaBookingStore';
import { ritualImage } from '../../../../features/purohit/selectors';
import { bookServicePath, PUJA_CART_PATH } from '../../../../features/purohit/navigation';


/* ------------------------------------------------------------------ */
/* Book / In-cart control shared by every service card                */
/* Step 5 of the flow: selecting a service opens the booking form.     */
/* ------------------------------------------------------------------ */
export const ServiceAddControl = ({ listing, disabled = false }) => {
  const navigate = useNavigate();
  const { service, pandit, ritual } = listing;
  const inCart = usePujaBookingStore((st) => st.cart.some((x) => x.serviceId === service.id));

  if (disabled) {
    return <AddButton disabled label="Unavailable" data-testid={`puja-add-${service.id}`} />;
  }
  if (!inCart) {
    return (
      <AddButton
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(bookServicePath(service)); }}
        label="Book"
        data-testid={`puja-add-${service.id}`}
        aria-label={`Book ${ritual.name} with ${pandit.name}`}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(PUJA_CART_PATH); }}
      data-testid={`puja-added-${service.id}`}
      aria-label={`${ritual.name} with ${pandit.name} is in your Puja Cart`}
      className="w-full h-8 flex items-center justify-center gap-1 rounded-lg bg-[color:var(--ml-primary,#207C8A)] text-white text-[12px] md:text-[13px] font-bold cursor-pointer active:scale-[0.97] transition-transform"
    >
      <Check size={13} strokeWidth={3} /> In Puja Cart
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Ritual category image card                                          */
/* ------------------------------------------------------------------ */
export const RitualCard = React.memo(({ ritual, onClick, className = '' }) => (
  <button
    type="button"
    onClick={() => onClick(ritual)}
    data-testid={`ritual-card-${ritual.id}`}
    className={`group flex flex-col text-left cursor-pointer active:scale-[0.97] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ml-primary,#207C8A)] rounded-[18px] ${className}`}
  >
    <div className="relative w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#EAF4F6] border border-[color:var(--ml-primary,#207C8A)]/20 shadow-[0_3px_10px_rgba(32,124,138,0.06)] group-hover:shadow-[0_8px_20px_rgba(32,124,138,0.14)] transition-shadow">
      <img
        src={ritualImage(ritual)}
        alt={ritual.name}
        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
        loading="lazy"
        decoding="async"
        onError={handleImageError}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
      {ritual.featured && (
        <span className="absolute top-2 left-2 flex items-center gap-0.5 bg-[#E67E22] text-white text-[8.5px] md:text-[9.5px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md shadow-sm">
          <Sparkles size={9} /> Popular
        </span>
      )}
      <span className="absolute inset-x-2 bottom-2 text-white text-[12.5px] md:text-[14px] font-black leading-tight line-clamp-2 drop-shadow">
        {ritual.name}
      </span>
    </div>
  </button>
));
