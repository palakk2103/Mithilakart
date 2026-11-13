import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import MarketRoutes from './modules/user/routes/MarketRoutes';
const SellerRoutes = lazyWithRetry(() => import('./modules/seller/routes/SellerRoutes'));
const AdminRoutes = lazyWithRetry(() => import('./modules/admin/routes/AdminRoutes'));
const DeliveryRoutes = lazyWithRetry(() => import('./modules/delivery/routes/DeliveryRoutes'));
import SplashScreen from './shared/components/SplashScreen';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { initPushNotifications } from './shared/services/pushNotifications';
import { isAuthenticated } from './shared/api/tokenStorage';
import { LocationProvider } from './shared/context/LocationContext';
import { LanguageProvider } from './shared/context/LanguageContext';
import LocationPrompt from './shared/components/LocationPrompt';
import { PublicConfigLoader } from './shared/config/publicConfig';
import ScrollToTop from './shared/components/ScrollToTop';
import PageLoader from './shared/components/PageLoader';
import lazyWithRetry from './shared/utils/lazyWithRetry';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem('splashShown') && !sessionStorage.getItem('splashShown');
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
      <LanguageProvider>
        <LocationProvider>
          <BrowserRouter>
          <ScrollToTop />
          {showSplash && (
            <SplashScreen
              onComplete={() => {
                try {
                  localStorage.setItem('splashShown', 'true');
                  sessionStorage.setItem('splashShown', 'true');
                } catch {
                  // ignore storage error
                }
                setShowSplash(false);
              }}
            />
          )}
          <LocationPrompt />
          <PublicConfigLoader />
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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </LocationProvider>
    </LanguageProvider>
  </ErrorBoundary>
  );
}

export default App;
