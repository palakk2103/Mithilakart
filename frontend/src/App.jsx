import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import MarketRoutes from './modules/user/routes/MarketRoutes';
import SellerRoutes from './modules/seller/routes/SellerRoutes';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import DeliveryRoutes from './modules/delivery/routes/DeliveryRoutes';
import SplashScreen from './shared/components/SplashScreen';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { initPushNotifications } from './shared/services/pushNotifications';
import { isAuthenticated } from './shared/api/tokenStorage';
import { LocationProvider } from './shared/context/LocationContext';
import LocationPrompt from './shared/components/LocationPrompt';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown');
  });

  useEffect(() => {
    if (isAuthenticated('customer')) {
      initPushNotifications('customer', (payload) => {
        const title = payload.notification?.title || 'Mithilakart';
        const body = payload.notification?.body || '';
        toast(`${title}: ${body}`);
      });
    }

    const onAuthChange = () => {
      if (isAuthenticated('customer')) {
        initPushNotifications('customer', (payload) => {
          const title = payload.notification?.title || 'Mithilakart';
          const body = payload.notification?.body || '';
          toast(`${title}: ${body}`);
        });
      }
    };

    window.addEventListener('customer-auth-changed', onAuthChange);
    return () => window.removeEventListener('customer-auth-changed', onAuthChange);
  }, []);

  return (
    <ErrorBoundary>
      <LocationProvider>
        <BrowserRouter>
          {showSplash && (
            <SplashScreen
              onComplete={() => {
                sessionStorage.setItem('splashShown', 'true');
                setShowSplash(false);
              }}
            />
          )}
          <LocationPrompt />
          <Toaster position="bottom-center" toastOptions={{
            style: {
              background: '#121212',
              color: '#e2a750',
              border: '1px solid rgba(226, 167, 80, 0.2)',
              fontSize: '12px',
              fontWeight: 'black',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }
          }} />
          <Routes>
            {/* Delivery Agent Portal */}
            <Route path="/delivery/*" element={<DeliveryRoutes />} />

            {/* Seller Dashboard */}
            <Route path="/seller/*" element={<SellerRoutes />} />

            {/* Unified Admin Management Panel */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* Marketplace App */}
            <Route path="/vendor/*" element={<MarketRoutes />} />
            <Route path="/*" element={<MarketRoutes />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </ErrorBoundary>
  );
}

export default App;
