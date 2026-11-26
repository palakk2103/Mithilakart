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
import { isAuthenticated } from './shared/api/tokenStorage';
import { LocationProvider } from './shared/context/LocationContext';
import { LanguageProvider, useLanguage } from './shared/context/LanguageContext';
import { setDomTranslationLanguage } from './shared/utils/domTranslator';
import LocationPrompt from './shared/components/LocationPrompt';
import { PublicConfigLoader } from './shared/config/publicConfig';
import InstallAppPrompt from './shared/components/InstallAppPrompt';
import ScrollToTop from './shared/components/ScrollToTop';
import LoginRequiredBridge from './shared/components/LoginRequiredBridge';
import SeasonalEffects from './shared/components/SeasonalEffects';
import PageLoader from './shared/components/PageLoader';
import lazyWithRetry from './shared/utils/lazyWithRetry';

// Remounts the route tree on language change (so every page refetches localized data)
// and runs the DOM translator for anything not covered by t()/backend localisation.
const LocalizedRoutes = ({ children }) => {
  const { currentLanguage } = useLanguage();
  useEffect(() => { setDomTranslationLanguage(currentLanguage); }, [currentLanguage]);
  return <React.Fragment key={currentLanguage}>{children}</React.Fragment>;
};

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem('splashShown') && !sessionStorage.getItem('splashShown');
  });

  useEffect(() => {
    const startPush = () => {
      if (!isAuthenticated('customer')) return;
      import('./shared/services/pushNotifications')
        .then(({ initPushNotifications }) => {
          initPushNotifications('customer', (payload) => {
            const title = payload.notification?.title || 'Mithilakart';
            const body = payload.notification?.body || '';
            toast(`${title}: ${body}`);
          });
        })
        .catch(() => {});
    };

    const timer = setTimeout(startPush, 1500);
    window.addEventListener('customer-auth-changed', startPush);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('customer-auth-changed', startPush);
    };
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <LocationProvider>
          <BrowserRouter>
          <ScrollToTop />
          <LoginRequiredBridge />
          <SeasonalEffects />
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
          <InstallAppPrompt />
          <Toaster position="bottom-center" containerClassName="app-toaster" toastOptions={{
            style: {
              background: '#fff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid var(--active-primary, #65B842)',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 10px 30px -10px rgba(15,23,42,.35)',
            }
          }} />
          <Suspense fallback={<PageLoader />}>
          <LocalizedRoutes>
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
          </LocalizedRoutes>
          </Suspense>
        </BrowserRouter>
      </LocationProvider>
    </LanguageProvider>
  </ErrorBoundary>
  );
}

export default App;
