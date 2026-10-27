/**
 * Seller Routes
 * All seller module route definitions with lazy loading and auth protection.
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SellerAuthProvider } from '../context/SellerAuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import ProtectedRoute from './ProtectedRoute';
import SellerLayout from '../components/layout/SellerLayout';
import { DashboardSkeleton } from '../components/ui/Skeleton';

// ─── Lazy-loaded Pages ───────────────────────────────────────────
const SellerLogin = lazy(() => import('../pages/auth/SellerLogin'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ProductList = lazy(() => import('../pages/products/ProductList'));
const AddProduct = lazy(() => import('../pages/products/AddProduct'));
const BulkUpload = lazy(() => import('../pages/products/BulkUpload'));
const OrderList = lazy(() => import('../pages/orders/OrderList'));
const OrderDetail = lazy(() => import('../pages/orders/OrderDetail'));
const ReturnList = lazy(() => import('../pages/returns/ReturnList'));
const CustomerList = lazy(() => import('../pages/customers/CustomerList'));
const InventoryManager = lazy(() => import('../pages/inventory/InventoryManager'));
const ReviewList = lazy(() => import('../pages/reviews/ReviewList'));
const CouponList = lazy(() => import('../pages/coupons/CouponList'));
const Analytics = lazy(() => import('../pages/analytics/Analytics'));
const Earnings = lazy(() => import('../pages/earnings/Earnings'));
const Notifications = lazy(() => import('../pages/notifications/Notifications'));
const SettingsPage = lazy(() => import('../pages/settings/Settings'));

// ─── Loading Fallback ────────────────────────────────────────────
const PageLoader = () => (
  <div className="p-8">
    <DashboardSkeleton />
  </div>
);

const SellerRoutes = () => {
  return (
    <SellerAuthProvider>
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Route — Login */}
            <Route path="login" element={<SellerLogin />} />

            {/* Protected Routes with Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <SellerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/bulk-upload" element={<BulkUpload />} />
              <Route path="products/edit/:id" element={<AddProduct />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="returns" element={<ReturnList />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="reviews" element={<ReviewList />} />
              <Route path="coupons" element={<CouponList />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="login" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </SellerAuthProvider>
  );
};

export default SellerRoutes;
