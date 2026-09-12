import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MapPin, Store, Navigation, CheckCircle2, X, ArrowRight, Zap, Volume2, VolumeX } from 'lucide-react';
import { startRingtone, stopRingtone, enableRingtoneAudio } from '../../../shared/utils/offerRingtone';

const IncomingDeliveryModal = ({ order, onAccept, onDecline }) => {
  const [soundActive, setSoundActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!order?.id) return undefined;
    setTimeLeft(60);

    // Start ringtone
    startRingtone().then((result) => {
      if (result === 'blocked') {
        setSoundActive(false);
      } else {
        setSoundActive(true);
      }
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopRingtone();
          onDecline?.(order);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopRingtone();
    };
  }, [order?.id]);

  if (!order) return null;

  const handleSoundToggle = async (e) => {
    e?.stopPropagation?.();
    if (soundActive) {
      stopRingtone();
      setSoundActive(false);
    } else {
      await enableRingtoneAudio({ resume: true });
      setSoundActive(true);
    }
  };

  const handleContainerClick = async () => {
    if (!soundActive) {
      await enableRingtoneAudio({ resume: true });
      setSoundActive(true);
    }
  };

  const handleAcceptClick = async (e) => {
    e?.stopPropagation?.();
    setAccepting(true);
    stopRingtone();
    try {
      await onAccept?.(order);
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineClick = (e) => {
    e?.stopPropagation?.();
    stopRingtone();
    onDecline?.(order);
  };

  const earning = order.earningAmount || order.earning || 50;
  const orderNumber = order.orderNumber || order.id || 'NEW-RUN';
  const pickupAddress = order.pickupAddress || order.sellerAddress || 'Artisan Seller Hub';
  const dropAddress = order.deliveryAddress || order.customerAddress || order.address || 'Customer Residence';
  const customerName = order.customerName || order.customer || 'Valued Customer';

  return (
    <AnimatePresence>
      <div 
        onClick={handleContainerClick}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
      >
        <motion.div
          onClick={(e) => {
            handleContainerClick();
            e.stopPropagation();
          }}
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Top Header with Ring Alert */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                  New Order Alert • Live Run
                </p>
                <h3 className="text-base font-black tracking-tight leading-none text-white">
                  Order #{String(orderNumber).slice(-8)}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSoundToggle}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
                title={soundActive ? 'Mute ringtone' : 'Play ringtone'}
              >
                {soundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <div className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-black tracking-wider">
                {timeLeft}s
              </div>
            </div>
          </div>

          {/* Sound blocked banner helper if browser blocked autoplay */}
          {!soundActive && (
            <button
              type="button"
              onClick={handleSoundToggle}
              className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-left flex items-center justify-between text-[11px] font-extrabold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span>🔔 Tap here to enable loud audio ring</span>
              <span className="underline uppercase text-[10px]">Unmute</span>
            </button>
          )}

          {/* Earning & Trip Badge */}
          <div className="p-5 pb-3">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Guaranteed Payout
                </span>
                <div className="text-3xl font-black text-emerald-700 tracking-tight mt-0.5">
                  ₹{earning}
                </div>
                <span className="text-[10px] font-bold text-emerald-600">
                  Direct Wallet Credit on Delivery
                </span>
              </div>
              <div className="text-right">
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  Instant Match
                </span>
                <p className="text-[11px] font-extrabold text-slate-500 mt-2">
                  ~15-20 Min Trip
                </p>
              </div>
            </div>
          </div>

          {/* Pickup & Drop Details */}
          <div className="px-5 py-2 space-y-3">
            <div className="relative pl-6 border-l-2 border-dashed border-slate-200 space-y-4 my-1">
              {/* Pickup */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Store size={11} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Step 1: Pickup from Seller
                  </p>
                  <p className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-2 mt-0.5">
                    {pickupAddress}
                  </p>
                </div>
              </div>

              {/* Drop */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MapPin size={11} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Step 2: Deliver to Customer ({customerName})
                  </p>
                  <p className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-2 mt-0.5">
                    {dropAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 pt-3 space-y-2 mt-auto border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              disabled={accepting}
              onClick={handleAcceptClick}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {accepting ? (
                <span>Accepting Run...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>ACCEPT DELIVERY ORDER</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={accepting}
              onClick={handleDeclineClick}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-600 active:scale-95 transition-all text-center cursor-pointer"
            >
              Pass to Next Partner
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncomingDeliveryModal;
