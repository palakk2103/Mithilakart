import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  getFulfillmentOffers,
  acceptFulfillmentOffer,
  rejectFulfillmentOffer,
} from '../services/sellerApi';
import { getSocket } from '../../../shared/services/socket';
import {
  startRingtone, stopRingtone, subscribeRingtone, enableRingtoneAudio,
} from '../../../shared/utils/offerRingtone';

/**
 * CR-002 — app-wide live fulfillment offers for the signed-in seller.
 *
 * WHY THIS EXISTS (see docs/cr-002/REAL_FLOW_FAILURE_ANALYSIS.md, Failure 1):
 * the `fulfillment_offer` socket event previously had exactly one listener in
 * the whole frontend, mounted on the Orders page. Sellers land on the Dashboard
 * after login, so in production 75% of offers expired unseen. The subscription
 * has to live above the router, not inside a page.
 *
 * Contract:
 *   - The socket says WHEN to re-read; the REST response is what we trust.
 *     A dropped or duplicated event therefore cannot corrupt state — worst case
 *     the UI updates one poll later. MongoDB stays the source of truth.
 *   - Re-reads on `connect` as well, so a reconnecting seller recovers any
 *     offer that arrived while they were offline (Phase 19 resync).
 *   - Owns the ringtone lifecycle so it can never double-start or leak: one
 *     provider, one subscription, one ringtone.
 */

const FulfillmentOfferContext = createContext(null);

/** Safety net if a socket event is ever missed entirely. */
const POLL_INTERVAL_MS = 20000;

function stillLive(offer, now = Date.now()) {
  if (!offer?.expiresAt) return true;
  const ms = new Date(offer.expiresAt).getTime();
  return Number.isNaN(ms) ? true : ms > now;
}

export function FulfillmentOfferProvider({ children }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [audioState, setAudioState] = useState('idle');
  const [dismissed, setDismissed] = useState(() => new Set());

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  // Offers already announced, so a refresh does not re-ring for the same offer.
  const announcedRef = useRef(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Never leave a ringtone playing behind an unmounted panel.
      stopRingtone();
    };
  }, []);

  useEffect(() => subscribeRingtone(setAudioState), []);

  const load = useCallback(async () => {
    // Collapse bursts: several socket events in the same tick cause one read.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const items = await getFulfillmentOffers();
      if (!mountedRef.current) return;
      setOffers(Array.isArray(items) ? items : []);
      setError(null);
    } catch (err) {
      if (mountedRef.current) setError(err?.message || 'Could not load offers');
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Socket: notification only. Every event triggers an authoritative re-read.
  useEffect(() => {
    const socket = getSocket('seller');
    if (!socket) return undefined;

    const refresh = () => load();
    socket.on('fulfillment_offer', refresh);
    socket.on('offer_closed', refresh);
    socket.on('connect', refresh);

    return () => {
      socket.off('fulfillment_offer', refresh);
      socket.off('offer_closed', refresh);
      socket.off('connect', refresh);
    };
  }, [load]);

  // Backstop poll — covers a socket that is connected but silently broken.
  useEffect(() => {
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Drop offers whose deadline has passed. The server expires them too; this
  // just stops the UI offering a button that is already doomed.
  useEffect(() => {
    if (!offers.length) return undefined;
    const id = setInterval(() => {
      setOffers((current) => {
        const live = current.filter((o) => stillLive(o));
        return live.length === current.length ? current : live;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [offers.length]);

  const liveOffers = useMemo(
    () => offers.filter((o) => stillLive(o) && !dismissed.has(o.attemptId)),
    [offers, dismissed]
  );

  // Ringtone lifecycle — driven purely by whether an un-dismissed offer exists.
  useEffect(() => {
    const ids = liveOffers.map((o) => o.attemptId);
    const hasNew = ids.some((id) => !announcedRef.current.has(id));

    if (ids.length && hasNew) {
      ids.forEach((id) => announcedRef.current.add(id));
      // Result is intentionally observed: a blocked autoplay must surface as a
      // visual fallback rather than be reported as a successful alert.
      startRingtone();
    }

    if (!ids.length) {
      stopRingtone();
      announcedRef.current.clear();
    }
  }, [liveOffers]);

  const respond = useCallback(async (offer, action, reason = null) => {
    setBusyId(offer.attemptId);
    setError(null);
    // The seller has acted — silence immediately, do not wait for the round trip.
    stopRingtone();

    try {
      if (action === 'accept') {
        await acceptFulfillmentOffer(offer.orderId, offer.attemptId);
      } else {
        await rejectFulfillmentOffer(offer.orderId, offer.attemptId, reason);
      }
      // Drop it locally at once so the modal closes without waiting for the read.
      setOffers((current) => current.filter((o) => o.attemptId !== offer.attemptId));
      await load();
      return { ok: true };
    } catch (err) {
      // Usually expired or reassigned — re-read and show the truth.
      const message = err?.message || 'This offer is no longer available';
      if (mountedRef.current) setError(message);
      await load();
      return { ok: false, message };
    } finally {
      if (mountedRef.current) setBusyId(null);
    }
  }, [load]);

  const accept = useCallback((offer) => respond(offer, 'accept'), [respond]);
  const reject = useCallback((offer, reason) => respond(offer, 'reject', reason), [respond]);

  /** Hide the modal for this offer without answering it (it still expires server-side). */
  const dismiss = useCallback((attemptId) => {
    setDismissed((prev) => new Set(prev).add(attemptId));
    stopRingtone();
  }, []);

  const enableAudio = useCallback(
    () => enableRingtoneAudio({ resume: liveOffers.length > 0 }),
    [liveOffers.length]
  );

  const value = useMemo(() => ({
    offers: liveOffers,
    loading,
    busyId,
    error,
    audioState,
    audioBlocked: audioState === 'blocked',
    accept,
    reject,
    dismiss,
    enableAudio,
    refresh: load,
  }), [liveOffers, loading, busyId, error, audioState, accept, reject, dismiss, enableAudio, load]);

  return (
    <FulfillmentOfferContext.Provider value={value}>
      {children}
    </FulfillmentOfferContext.Provider>
  );
}

/**
 * Returns null when used outside the provider, so a page-level panel rendered
 * in isolation (tests, storybook) degrades instead of throwing.
 */
export function useFulfillmentOffers() {
  return useContext(FulfillmentOfferContext);
}

export default FulfillmentOfferContext;
