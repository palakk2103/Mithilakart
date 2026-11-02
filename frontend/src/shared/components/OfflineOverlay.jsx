import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OfflineOverlay() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOffline(false);
    } else {
      // Flash a quick animation or notification
      const button = document.getElementById('offline-retry-btn');
      if (button) {
        button.classList.add('animate-bounce');
        setTimeout(() => button.classList.remove('animate-bounce'), 1000);
      }
    }
  };

  return (
    <div 
      id="pwa-offline-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(18, 18, 18, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: "'Montserrat', 'Nunito', sans-serif",
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div 
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(226, 167, 80, 0.15)',
          borderRadius: '24px',
          padding: '40px 32px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Glow/Pulse background behind icon */}
        <div 
          style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(226, 167, 80, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
          className="animate-pulse"
        >
          <WifiOff size={40} color="#e2a750" />
        </div>

        <h1 
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#e2a750',
            margin: '0 0 8px 0',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {t('auto.youAreOffline')}
        </h1>
        
        <p 
          style={{
            fontSize: '14px',
            color: '#a0a0a0',
            margin: '0 0 32px 0',
            lineHeight: '1.6',
          }}
        >
          {t('auto.itLooksLikeYouVe')}
        </p>

        <button
          id="offline-retry-btn"
          onClick={handleRetry}
          style={{
            background: 'linear-gradient(135deg, #e2a750 0%, #b88230 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#121212',
            padding: '14px 28px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 16px rgba(226, 167, 80, 0.2)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 20px rgba(226, 167, 80, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(226, 167, 80, 0.2)';
          }}
        >
          <RefreshCw size={16} />
          {t('auto.checkConnection')}
        </button>
      </div>
    </div>
  );
}
