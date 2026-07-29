import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../../shared/api/tokenStorage';
import DeliveryLayout from '../layouts/DeliveryLayout';
import DeliveryAuth from '../pages/Auth';
import DeliverySignup from '../pages/Signup';
import DeliveryDashboard from '../pages/Dashboard';
import DeliveryOrders from '../pages/Orders';
import DeliveryOrderDetail from '../pages/OrderDetail';
import DeliveryEarnings from '../pages/Earnings';
import DeliveryProfile from '../pages/Profile';
import PersonalInfo from '../pages/PersonalInfo';
import Settings from '../pages/Settings';
import Support from '../pages/Support';
import About from '../pages/About';

const DeliveryProtectedRoute = () => {
  if (!isAuthenticated('delivery')) {
    return <Navigate to="/delivery/auth" replace />;
  }
  return <DeliveryLayout />;
};

const DeliveryRoutes = () => {
  return (
    <Routes>
      <Route path="auth" element={<DeliveryAuth />} />
      <Route path="signup" element={<DeliverySignup />} />
      <Route element={<DeliveryProtectedRoute />}>
        <Route path="dashboard" element={<DeliveryDashboard />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="orders/:orderId" element={<DeliveryOrderDetail />} />
        <Route path="earnings" element={<DeliveryEarnings />} />
        <Route path="profile" element={<DeliveryProfile />} />
        <Route path="profile/edit" element={<PersonalInfo />} />
        <Route path="settings" element={<Settings />} />
        <Route path="support" element={<Support />} />
        <Route path="about" element={<About />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default DeliveryRoutes;
