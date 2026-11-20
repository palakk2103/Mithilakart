import React from 'react';
import { Navigation, X, Check, Plus, Home, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from 'react-i18next';
import useAccountStore from '../../store/useAccountStore';
import { findSelectedAddress } from '../hooks/useDeliverToAddress';
import { isAuthenticated } from '../api/tokenStorage';

// Delivery location only matters to shoppers; on the admin, seller and
// delivery portals the prompt just blocked the screen.
const NON_SHOPPER_PORTALS = /^\/(admin|seller|delivery)(\/|$)/;

const formatSavedAddress = (addr) =>
  [addr.address || addr.addressLine, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');

/**
 * "Deliver to" sheet — lets the customer switch between their saved
 * addresses, use live GPS, or add a new address.
 */
const LocationPrompt = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useRouterLocation();
  const {
    promptOpen,
    setPromptOpen,
    refreshLiveLocation,
    loading,
    permissionDenied,
    label,
    location: liveLocation,
  } = useLocation();
  const {
    savedAddresses,
    selectedAddressId,
    deliveryMode,
    chooseSavedAddress,
    setDeliveryMode,
  } = useAccountStore();

  const isLoggedIn = isAuthenticated('customer');
  const hasLive = liveLocation?.latitude != null && liveLocation?.longitude != null;
  const usingSaved = savedAddresses.length > 0 && (deliveryMode === 'saved' || !hasLive);
  const activeSaved = usingSaved ? findSelectedAddress(savedAddresses, selectedAddressId) : null;

  const handleDismiss = () => {
    try {
      localStorage.setItem('locationPromptDismissed', 'true');
      sessionStorage.setItem('locationPromptDismissed', 'true');
    } catch {
      // ignore
    }
    setPromptOpen(false);
  };

  const handlePickSaved = (addr) => {
    chooseSavedAddress(addr.id);
    setPromptOpen(false);
  };

  const handleUseLive = () => {
    refreshLiveLocation({ forcePrompt: false })
      .then(() => setDeliveryMode('live'))
      .catch(() => {});
  };

  const handleAddNew = () => {
    setPromptOpen(false);
    navigate(isLoggedIn ? '/profile/addresses' : '/login');
  };

  const onShopperPage = !NON_SHOPPER_PORTALS.test(pathname);

  return (
    <AnimatePresence>
      {promptOpen && onShopperPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[2000] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Grab handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2.5">
              <span className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-3 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-base font-black text-slate-900">Choose delivery address</p>
                <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{t('auto.nearbySellersFasterDelivery')}</p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-2 rounded-full hover:bg-slate-100"
                aria-label={t('auto.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              {/* Live location option */}
              <button
                type="button"
                disabled={loading}
                onClick={handleUseLive}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors disabled:opacity-60 ${
                  !usingSaved && hasLive
                    ? 'border-[color:var(--mk-primary,#65B842)] bg-[#F2F9EE]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] text-[color:var(--mk-primary,#65B842)] flex items-center justify-center flex-shrink-0">
                  <Navigation size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900">
                    {loading ? t('auto.detectingLocation') : t('auto.useLiveLocation')}
                  </p>
                  <p className="text-[12px] font-medium text-slate-500 truncate">
                    {hasLive && label && label !== 'Set delivery location' ? label : t('auto.allowLiveLocation')}
                  </p>
                </div>
                {!usingSaved && hasLive ? (
                  <Check size={18} className="text-[color:var(--mk-primary,#65B842)] flex-shrink-0" />
                ) : (
                  <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
                )}
              </button>

              {permissionDenied && (
                <p className="text-[12px] font-bold text-red-500 -mt-1">
                  {t('auto.locationBlockedEnableLocationPermiss')}
                </p>
              )}

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 px-1">
                    Saved addresses
                  </p>
                  <div className="space-y-2.5">
                    {savedAddresses.map((addr) => {
                      const active = activeSaved && String(activeSaved.id) === String(addr.id);
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handlePickSaved(addr)}
                          className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors ${
                            active
                              ? 'border-[color:var(--mk-primary,#65B842)] bg-[#F2F9EE]'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                            <Home size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-extrabold text-slate-900 truncate">{addr.name || 'Address'}</p>
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">Default</span>
                              )}
                            </div>
                            <p className="text-[12px] font-medium text-slate-500 leading-snug mt-0.5 line-clamp-2">
                              {formatSavedAddress(addr)}
                            </p>
                            {addr.phone && (
                              <p className="text-[11px] font-semibold text-slate-400 mt-1">{addr.phone}</p>
                            )}
                          </div>
                          <span
                            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              active ? 'border-[color:var(--mk-primary,#65B842)]' : 'border-slate-300'
                            }`}
                          >
                            {active && <span className="w-2.5 h-2.5 rounded-full bg-[color:var(--mk-primary,#65B842)]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add / manage */}
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-[color:var(--mk-primary,#65B842)] text-[color:var(--mk-primary,#65B842)] font-extrabold text-sm hover:bg-[#F2F9EE]"
              >
                <Plus size={16} />
                {isLoggedIn ? 'Add or manage addresses' : 'Log in to use saved addresses'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationPrompt;
