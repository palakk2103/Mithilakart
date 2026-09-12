import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, IndianRupee, User, WifiOff, Wifi, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboard, setOnlineStatus, updateLocation, getOrders, acceptOrder } from '../services/deliveryApi';
import { reverseGeocode } from '../../../shared/services/locationApi';
import useDeliverySocket from '../hooks/useDeliverySocket';
import IncomingDeliveryModal from '../components/IncomingDeliveryModal';
import { enableRingtoneAudio } from '../../../shared/utils/offerRingtone';
import { playOrderAlert } from '../../../shared/utils/orderAlertSound';
import toast from 'react-hot-toast';

const DeliveryLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState({
    latitude: null,
    longitude: null,
    label: '',
    fullAddress: '',
    loading: true,
  });

  // Global user gesture listener to unblock Web Audio API autoplay
  useEffect(() => {
    const unlock = () => {
      enableRingtoneAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const dashboard = await getDashboard();
        if (!cancelled && dashboard?.isOnline !== undefined) {
          setIsOnline(Boolean(dashboard.isOnline));
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live Location Tracking & Reverse Geocoding
  useEffect(() => {
    if (!navigator.geolocation) {
      setLiveLocation((prev) => ({ ...prev, loading: false, label: 'GPS Not Supported' }));
      return undefined;
    }

    let isMounted = true;
    let lastSent = 0;

    const handlePosition = async (pos) => {
      const { latitude, longitude } = pos.coords;
      const now = Date.now();

      if (now - lastSent > 4000) {
        lastSent = now;
        updateLocation(latitude, longitude).catch(() => {});
      }

      try {
        const geo = await reverseGeocode(latitude, longitude);
        if (!isMounted) return;
        const shortName = geo?.shortLabel || geo?.city || (geo?.formattedAddress ? geo.formattedAddress.split(',')[0] : 'Live Location');
        setLiveLocation({
          latitude,
          longitude,
          label: shortName,
          fullAddress: geo?.formattedAddress || shortName,
          loading: false,
        });
      } catch {
        if (!isMounted) return;
        setLiveLocation((prev) => ({
          ...prev,
          latitude,
          longitude,
          label: prev.label || 'GPS Active',
          loading: false,
        }));
      }
    };

    const handleError = () => {
      if (!isMounted) return;
      setLiveLocation((prev) => ({ ...prev, loading: false, label: prev.label || 'Location Needed' }));
    };

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => {
      isMounted = false;
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    try {
      await setOnlineStatus(next);
    } catch (err) {
      setIsOnline(!next);
      toast.error(err?.message || 'Could not update online status');
    }
  };

  const [incomingOrder, setIncomingOrder] = useState(null);
  // Track temporary declines with expiry (2 minutes)
  const declinedMapRef = useRef(new Map());

  const checkForIncomingOrders = useCallback(async (targetOrderId = null) => {
    // 1. If currently on the Order Detail page, NEVER pop up over active delivery!
    if (window.location.pathname.includes('/delivery/orders/')) {
      setIncomingOrder(null);
      return;
    }

    try {
      const res = await getOrders();

      // 2. If the partner already has an active ongoing delivery (accepted, picked_up, assigned),
      // do not interrupt them with another order popup!
      const hasActiveDelivery = (res?.assigned || []).some(
        (a) => a.status === 'accepted' || a.status === 'picked_up' || a.status === 'assigned'
      );
      if (hasActiveDelivery) {
        setIncomingOrder(null);
        return;
      }

      const rawList = res?.available || [];
      if (!rawList.length) {
        setIncomingOrder(null);
        return;
      }

      // 3. Only fresh orders from the last 30 minutes trigger an urgent live popup modal
      const now = Date.now();
      const list = rawList.filter((a) => {
        const orderObj = a.orderId || a.order || a;
        const createdAt = new Date(orderObj.createdAt || a.createdAt).getTime();
        return !isNaN(createdAt) && (now - createdAt < 30 * 60 * 1000);
      });

      if (!list.length) {
        setIncomingOrder(null);
        return;
      }

      // Clean expired declines
      for (const [key, timestamp] of declinedMapRef.current.entries()) {
        if (now - timestamp > 120000) declinedMapRef.current.delete(key);
      }

      let match = null;
      if (targetOrderId) {
        match = list.find((a) => {
          const id = String(a.orderId?._id || a.orderId || a._id || a.id);
          return id === String(targetOrderId);
        });
      }

      if (!match) {
        match = list.find((a) => {
          const id = String(a.orderId?._id || a.orderId || a._id || a.id);
          return !declinedMapRef.current.has(id);
        });
      }

      if (match) {
        const orderObj = match.orderId || match.order || match;
        const addr = orderObj.addressSnapshot || {};
        const newObj = {
          id: String(orderObj._id || match._id || match.id),
          orderNumber: orderObj.orderNumber,
          customerName: addr.name || 'Customer',
          customerAddress: [addr.line1 || addr.addressLine, addr.city].filter(Boolean).join(', ') || 'Customer Residence',
          pickupAddress: orderObj.pickupAddress || 'Artisan Seller Hub',
          earningAmount: match.earningAmount || 50,
        };
        setIncomingOrder((curr) => {
          if (curr && curr.id === newObj.id) return curr;
          return newObj;
        });
      } else {
        setIncomingOrder(null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkForIncomingOrders();
    const interval = setInterval(() => checkForIncomingOrders(), 5000);
    return () => clearInterval(interval);
  }, [checkForIncomingOrders]);

  useDeliverySocket((payload) => {
    if (payload?.type === 'new_assignment') {
      if (window.location.pathname.includes('/delivery/orders/')) return;
      playOrderAlert();
      enableRingtoneAudio({ resume: true }).catch(() => {});
      if (payload.order) {
        setIncomingOrder(payload.order);
      } else {
        if (payload.orderId) {
          declinedMapRef.current.delete(String(payload.orderId));
        }
        checkForIncomingOrders(payload.orderId);
      }
    } else if (payload?.type === 'assignment_withdrawn') {
      if (incomingOrder?.id && String(incomingOrder.id) === String(payload.orderId)) {
        setIncomingOrder(null);
        toast('Order was accepted by another delivery partner', { icon: 'ℹ️' });
      }
    }
  });

  const handleAcceptIncomingOrder = async (ord) => {
    try {
      setIncomingOrder(null);
      declinedMapRef.current.set(String(ord.id), Date.now());
      const result = await acceptOrder(ord.id);
      if (result?.pickupOtp) {
        sessionStorage.setItem(`delivery_pickup_otp_${ord.id}`, String(result.pickupOtp));
      }
      toast.success('Run Accepted! Heading to pickup...');
      navigate(`/delivery/orders/${ord.id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to accept order');
    }
  };

  const handleDeclineIncomingOrder = (ord) => {
    if (ord?.id) {
      declinedMapRef.current.set(String(ord.id), Date.now());
    }
    setIncomingOrder(null);
  };

  const navItems = [
    { label: 'Home', path: '/delivery/dashboard', icon: Home },
    { label: 'Orders', path: '/delivery/orders', icon: Package },
    { label: 'Earnings', path: '/delivery/earnings', icon: IndianRupee },
    { label: 'Profile', path: '/delivery/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  const showHeader = [
    '/delivery/dashboard',
    '/delivery/orders',
    '/delivery/earnings',
    '/delivery/profile'
  ].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-nunito flex flex-col max-w-md mx-auto relative">
      {/* Top Status Bar */}
      {showHeader && (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <img 
              src="/mthibg.png" 
              alt="Mithilakart" 
              className="h-7 w-auto object-contain"
            />
          </div>

          {/* Live Location Pill in Top Bar */}
          <div 
            title={liveLocation.fullAddress || liveLocation.label}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/70 border border-blue-100 rounded-full max-w-[170px] sm:max-w-[200px] text-[11px] font-bold text-blue-900 shadow-2xs transition-all"
          >
            <MapPin size={12} className="text-blue-600 shrink-0 animate-bounce" />
            <span className="truncate">
              {liveLocation.loading ? 'Detecting GPS...' : (liveLocation.label || 'GPS Active')}
            </span>
          </div>

          {/* Online / Offline Toggle */}
          <button
            onClick={handleToggleOnline}
            disabled={statusLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
              isOnline
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet context={{ isOnline, setIsOnline, liveLocation }} />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-5 py-1.5 relative"
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                  />
                )}
                <item.icon
                  size={22}
                  className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-500'}`}
                />
                <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${active ? 'text-blue-600' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Realtime Incoming Delivery Popup with Loud Continuous Ring */}
      <IncomingDeliveryModal
        order={incomingOrder}
        onAccept={handleAcceptIncomingOrder}
        onDecline={handleDeclineIncomingOrder}
      />
    </div>
  );
};

export default DeliveryLayout;
