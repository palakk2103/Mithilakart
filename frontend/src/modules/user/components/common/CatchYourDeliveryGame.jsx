import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Coins, Truck, Star, Sparkles } from 'lucide-react';
import {
  getGameEligibility,
  startGameSession,
  claimGameSession,
} from '../../services/ordersApi';

/**
 * "Catch Your Delivery" — dismissible mini-game shown on order tracking.
 *
 * The win/lose outcome and reward are decided ENTIRELY server-side at
 * startGameSession() and are not revealed until claimGameSession() after the
 * play window ends. This component never computes or displays a reward
 * value it invented itself — every number shown after "Time's up!" comes
 * straight from the claim response.
 */

const FALLING_ICONS = [Coins, Gift, Star, Sparkles];
const CATCH_ZONE_HEIGHT = 64;

function FallingItem({ item, onCaught, isPlaying }) {
  const Icon = item.Icon;
  return (
    <motion.div
      className="absolute"
      style={{ left: `${item.left}%` }}
      initial={{ top: '-10%' }}
      animate={isPlaying ? { top: '100%' } : {}}
      transition={{ duration: item.fallDuration, ease: 'linear' }}
      onAnimationComplete={() => onCaught(item.id, false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCaught(item.id, true);
        }}
        className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-90 transition-transform border-2 border-amber-300"
        aria-label="Catch"
      >
        <Icon size={20} className="text-amber-500" fill="currentColor" fillOpacity={0.15} />
      </button>
    </motion.div>
  );
}

export default function CatchYourDeliveryGame({ orderId, isOpen, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | intro | playing | revealing | result | unavailable
  const [eligibility, setEligibility] = useState(null);
  const [items, setItems] = useState([]);
  const [caughtCount, setCaughtCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const spawnTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const itemIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setPhase('loading');
    setError(null);

    getGameEligibility(orderId)
      .then((data) => {
        if (cancelled) return;
        setEligibility(data);
        setPhase(data.eligible ? 'intro' : 'unavailable');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load the game');
        setPhase('unavailable');
      });

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [isOpen, orderId, clearTimers]);

  const spawnItem = useCallback(() => {
    itemIdRef.current += 1;
    const Icon = FALLING_ICONS[Math.floor(Math.random() * FALLING_ICONS.length)];
    setItems((prev) => [
      ...prev,
      {
        id: itemIdRef.current,
        Icon,
        left: 10 + Math.random() * 75,
        fallDuration: 2.2 + Math.random() * 1.3,
      },
    ]);
  }, []);

  const handleItemResolved = useCallback((id, wasCaught) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (wasCaught) setCaughtCount((c) => c + 1);
  }, []);

  const finishPlaying = useCallback(async (currentSession) => {
    clearTimers();
    setPhase('revealing');
    try {
      const claimed = await claimGameSession(orderId, currentSession.sessionId);
      setResult(claimed);
    } catch (err) {
      setError(err.message || 'Could not reveal your result');
    } finally {
      setPhase('result');
    }
  }, [orderId, clearTimers]);

  const handleStart = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const started = await startGameSession(orderId);
      setCaughtCount(0);
      setItems([]);
      itemIdRef.current = 0;
      setTimeLeft(started.durationSeconds);
      setPhase('playing');

      spawnTimerRef.current = setInterval(spawnItem, 550);
      countdownRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            finishPlaying(started);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Could not start the game');
      setPhase('unavailable');
    }
  }, [orderId, spawnItem, finishPlaying]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleClose = () => {
    clearTimers();
    setPhase('loading');
    setResult(null);
    setItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:w-[400px] sm:rounded-[28px] rounded-t-[28px] bg-gradient-to-b from-emerald-50 to-white overflow-hidden shadow-2xl"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md active:scale-90 transition-transform"
            aria-label="Close"
          >
            <X size={16} className="text-slate-700" />
          </button>

          <div className="px-5 pt-6 pb-2 text-center">
            <h2 className="text-[18px] font-black text-emerald-900 tracking-tight">Catch Your Delivery</h2>
          </div>

          {phase === 'loading' && (
            <div className="py-20 text-center text-sm font-bold text-emerald-700/70">Loading…</div>
          )}

          {phase === 'unavailable' && (
            <div className="px-6 py-14 text-center">
              <Truck size={36} className="mx-auto text-emerald-300 mb-3" />
              <p className="text-sm font-bold text-slate-500">
                {error || 'This game is not available for this order right now.'}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          )}

          {phase === 'intro' && (
            <div className="px-6 pb-8 pt-2 text-center">
              <p className="text-[13px] font-semibold text-slate-500 leading-relaxed mb-6">
                Catch as many falling rewards as you can in {eligibility?.durationSeconds || 45} seconds —
                then see what you've won!
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-4 rounded-full bg-emerald-600 text-white text-[13px] font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-transform"
              >
                Start Playing
              </button>
            </div>
          )}

          {phase === 'playing' && (
            <div className="relative">
              <div className="flex items-center justify-between px-5 py-2 text-[11px] font-black text-emerald-800">
                <span>⏱ {timeLeft}s</span>
                <span>Caught: {caughtCount}</span>
              </div>
              <div
                className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-emerald-50"
                style={{ height: 320 }}
              >
                {items.map((item) => (
                  <FallingItem key={item.id} item={item} onCaught={handleItemResolved} isPlaying />
                ))}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-emerald-800/10 border-t-2 border-dashed border-emerald-400"
                  style={{ height: CATCH_ZONE_HEIGHT }}
                />
              </div>
            </div>
          )}

          {phase === 'revealing' && (
            <div className="py-20 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 mx-auto rounded-full border-4 border-emerald-200 border-t-emerald-600"
              />
              <p className="mt-4 text-sm font-bold text-emerald-700">Revealing your result…</p>
            </div>
          )}

          {phase === 'result' && (
            <div className="px-6 pb-9 pt-2 text-center">
              {error && !result && (
                <p className="text-sm font-bold text-red-500 py-6">{error}</p>
              )}

              {result && result.won && (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <Gift size={48} className="mx-auto text-amber-500 mb-3" />
                  </motion.div>
                  <p className="text-[15px] font-black text-emerald-900">You won!</p>
                  <p className="text-[22px] font-black text-amber-600 mt-1">
                    {result.rewardValue} {result.rewardLabel}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-2">
                    Credited to your Mithilakart Wallet
                  </p>
                </>
              )}

              {result && !result.won && (
                <>
                  <Truck size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-[15px] font-black text-slate-600">So close!</p>
                  <p className="text-[12px] font-semibold text-slate-400 mt-1">
                    No reward this time — thanks for playing.
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full py-3.5 rounded-full bg-emerald-600 text-white text-[12px] font-black uppercase tracking-widest active:scale-[0.98] transition-transform"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
