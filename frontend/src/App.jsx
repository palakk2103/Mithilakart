import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MarketRoutes from './modules/user/routes/MarketRoutes';
import SellerRoutes from './modules/seller/routes/SellerRoutes';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import DeliveryRoutes from './modules/delivery/routes/DeliveryRoutes';
import SplashScreen from './shared/components/SplashScreen';
import ErrorBoundary from './shared/components/ErrorBoundary';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown');
  });

  return (
    <ErrorBoundary>
      <BrowserRouter>
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            sessionStorage.setItem('splashShown', 'true');
            setShowSplash(false);
          }}
        />
      )}
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
        <Route path="/*" element={<MarketRoutes />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
  );
}

export default App;
