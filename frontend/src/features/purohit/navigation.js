import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const PUROHIT_ALL_PATH = '/mithilak/puja';
export const ritualPath = (ritual) => `${PUROHIT_ALL_PATH}/${encodeURIComponent(ritual.id)}`;
/** "See All" — every pandit card. */
export const PUROHIT_PANDITS_PATH = '/mithilak/pandits';
/** Detail page of one pandit card (pandit × ritual). */
export const panditCardPath = (service) => `/mithilak/pandit/${encodeURIComponent(service.id)}`;

/** Booking flow: configure → Puja Cart → checkout → confirmation / My bookings. */
export const bookServicePath = (service) => `/mithilak/puja-book/${encodeURIComponent(service.id)}`;
export const PUJA_CART_PATH = '/mithilak/puja-cart';
export const PUJA_CHECKOUT_PATH = '/mithilak/puja-checkout';
export const PUJA_BOOKINGS_PATH = '/mithilak/puja-bookings';
export const bookingPath = (id) => `/mithilak/puja-booking/${encodeURIComponent(id)}`;

/** Purohit pages render without the site header (they have their own back bar). */
export const isPurohitPagePath = (pathname = '') => /^\/(vendor\/)?mithilak\/(puja|pandits|pandit|puja-book|puja-cart|puja-checkout|puja-bookings|puja-booking)(\/|$)/.test(pathname);

/** Back that works for deep links too: history when available, else the Mithilak home. */
export const useBackToMithilak = () => {
  const navigate = useNavigate();
  return () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate('/mithilak', { replace: true });
  };
};

/** Same flow flags Mithilak.jsx sets, so header/theme/cart stay on the Mithilak tab. */
export const useMithilakFlowFlags = () => {
  useEffect(() => {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
    localStorage.setItem('isFreshGroceryFlow', 'false');
  }, []);
};
