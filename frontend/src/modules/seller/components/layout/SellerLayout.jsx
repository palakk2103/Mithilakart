/**
 * SellerLayout Component
 * Main layout wrapper with sidebar, topbar, and content area.
 * Completely independent — does NOT reuse AdminLayout.
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileMenu from './MobileMenu';
import NewOrderModal from '../common/NewOrderModal';
import IncomingOfferModal from '../common/IncomingOfferModal';
import { FulfillmentOfferProvider } from '../../context/FulfillmentOfferContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/seller.css';

const SellerLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <FulfillmentOfferProvider>
    <div className={`seller-module min-h-screen flex`}
         style={{ backgroundColor: 'var(--seller-bg)' }}>
      {/* Standard e-commerce new-order alert (legacy SSE path, unchanged). */}
      <NewOrderModal />

      {/* CR-002 — quick-commerce fulfillment offer. Mounted here, above the
          router, so the seller is alerted on ANY page. Previously this lived
          only inside the Orders page and 75% of offers expired unseen. */}
      <IncomingOfferModal />

      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Sidebar Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[236px]'
        }`}
      >
        {/* Top Navbar */}
        <Topbar
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-[1560px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </FulfillmentOfferProvider>
  );
};

export default SellerLayout;
