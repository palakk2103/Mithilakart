import React from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '../context/LocationContext';

const LocationPrompt = () => {
  const {
    promptOpen,
    setPromptOpen,
    refreshLiveLocation,
    loading,
    permissionDenied,
    label,
  } = useLocation();

  return (
    <AnimatePresence>
      {promptOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5EE] text-[#65B842] flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Use live location</p>
                  <p className="text-[11px] font-semibold text-slate-500">Nearby sellers & faster delivery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromptOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                Allow Mithilakart to access your current location so we can show nearby seller products,
                accurate delivery address, and local offers.
              </p>

              {label && label !== 'Set delivery location' && (
                <div className="rounded-2xl bg-[#F6F8F3] border border-[#EAF5EE] px-4 py-3 text-[12px] font-bold text-[#65B842]">
                  Current: {label}
                </div>
              )}

              {permissionDenied && (
                <p className="text-[12px] font-bold text-red-500">
                  Location blocked. Enable location permission in browser settings and try again.
                </p>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  refreshLiveLocation({ forcePrompt: false }).catch(() => {});
                }}
                className="w-full py-3.5 rounded-2xl bg-[#65B842] hover:bg-[#529C33] text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Navigation size={16} />
                {loading ? 'Detecting location…' : 'Allow live location'}
              </button>

              <button
                type="button"
                onClick={() => setPromptOpen(false)}
                className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationPrompt;
