import { useMemo } from 'react';
import usePujaBookingStore from './usePujaBookingStore';

/**
 * Ratings & reviews come from completed bookings that the customer reviewed (frontend only).
 * Backend later: GET /providers/{id} returns rating + reviews.
 */
export const useAllReviews = () => {
  const bookings = usePujaBookingStore((st) => st.bookings);
  return useMemo(() => bookings
    .filter((b) => b.review && b.review.rating)
    .map((b) => ({
      id: b.id,
      panditId: b.panditId,
      ritualName: b.ritualName,
      name: b.customer?.name || 'Customer',
      rating: b.review.rating,
      text: b.review.text,
      at: b.review.at,
    }))
    .sort((a, b) => b.at - a.at), [bookings]);
};

/** Map panditId → { avg, count } */
export const usePanditRatings = () => {
  const reviews = useAllReviews();
  return useMemo(() => {
    const map = new Map();
    reviews.forEach((r) => {
      const cur = map.get(r.panditId) || { sum: 0, count: 0 };
      map.set(r.panditId, { sum: cur.sum + r.rating, count: cur.count + 1 });
    });
    const out = {};
    map.forEach((v, k) => { out[k] = { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count }; });
    return out;
  }, [reviews]);
};

export const usePanditReviews = (panditId) => {
  const reviews = useAllReviews();
  return useMemo(() => reviews.filter((r) => r.panditId === panditId), [reviews, panditId]);
};
