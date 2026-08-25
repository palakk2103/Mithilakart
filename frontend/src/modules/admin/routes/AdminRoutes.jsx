import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import ProductModeration from '../products/ProductModeration';
import VendorList from '../vendors/VendorList';
import VendorApproval from '../vendors/VendorApproval';
import SellerDashboard from '../../vendor/dashboard/Dashboard';
import InventoryList from '../../vendor/inventory/InventoryList';
import CategoryManager from '../catalog/CategoryManager';
import BannerManager from '../catalog/BannerManager';
import CategoryChipsManager from '../catalog/CategoryChipsManager';
import HomeSectionsManager from '../catalog/HomeSectionsManager';
import HeaderTabsManager from '../catalog/HeaderTabsManager';

// New Admin Pages
import Analytics from '../pages/Analytics';
import StockAlerts from '../pages/inventory/StockAlerts';
import Orders from '../pages/Orders';
import AddProduct from '../pages/AddProduct';
import PlatformEarnings from '../pages/finance/PlatformEarnings';
import Payouts from '../pages/Payouts';
import Rules from '../pages/Rules';
import TaxConfig from '../pages/finance/TaxConfig';
import DeliveryCharges from '../pages/finance/DeliveryCharges';
import AllDeliveries from '../pages/delivery/AllDeliveries';
import DeliveryApproval from '../pages/delivery/DeliveryApproval';
import Settings from '../pages/Settings';
import Users from '../pages/Users';
import CustomerDetail from '../pages/users/CustomerDetail';
import SubAdmins from '../pages/system/SubAdmins';

// Promotions
import Coupons from '../pages/promotions/Coupons';
import FlashSale from '../pages/promotions/FlashSale';
import FeaturedProducts from '../pages/promotions/FeaturedProducts';

// Comms
import Notifications from '../pages/comms/Notifications';

// Content
import ReviewModeration from '../pages/content/ReviewModeration';
import QnAModeration from '../pages/content/QnAModeration';
import LegalPolicies from '../pages/content/LegalPolicies';

// Operations
import Returns from '../pages/operations/Returns';
import OrderDetail from '../pages/operations/OrderDetail';
import FulfillmentMonitor from '../pages/operations/FulfillmentMonitor';
import FulfillmentSettings from '../pages/operations/FulfillmentSettings';
import Refunds from '../pages/operations/Refunds';

// Support
import Tickets from '../pages/support/Tickets';

// Reports
import SalesReport from '../pages/reports/SalesReport';
import SellerReport from '../pages/reports/SellerReport';
import UserReport from '../pages/reports/UserReport';
import OrderReport from '../pages/reports/OrderReport';
import InventoryReport from '../pages/reports/InventoryReport';
import RefundReport from '../pages/reports/RefundReport';

// System
import AuditLogs from '../pages/system/AuditLogs';
import RoleManagement from '../pages/system/RoleManagement';

// Vendors
import SellerDetail from '../pages/vendors/SellerDetail';

import { isAuthenticated } from '../../../shared/api/tokenStorage';

const AdminProtectedRoute = () => {
  if (!isAuthenticated('admin')) {
    return <Navigate to="/admin/auth" replace />;
  }
  return <AdminLayout />;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="auth" element={<Auth />} />

      <Route element={<AdminProtectedRoute />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:userId" element={<CustomerDetail />} />
        
        {/* Storefront & Catalog */}
        <Route path="products/moderation" element={<ProductModeration />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="storefront/banners" element={<BannerManager />} />
        <Route path="storefront/chips" element={<CategoryChipsManager />} />
        <Route path="storefront/tabs" element={<HeaderTabsManager />} />
        <Route path="storefront/sections/:section" element={<HomeSectionsManager />} />
        
        {/* Business Ops */}
        <Route path="inventory/all" element={<InventoryList />} />
        <Route path="inventory/add" element={<AddProduct />} />
        <Route path="inventory/alerts" element={<StockAlerts />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
        {/* CR-002 — fulfillment diagnostics & configuration */}
        <Route path="fulfillment" element={<FulfillmentMonitor />} />
        <Route path="fulfillment/settings" element={<FulfillmentSettings />} />

        {/* Operations */}
        <Route path="operations/returns" element={<Returns />} />
        <Route path="operations/refunds" element={<Refunds />} />

        {/* Support */}
        <Route path="support/tickets" element={<Tickets />} />

        {/* Promotions */}
        <Route path="promotions/coupons" element={<Coupons />} />
        <Route path="promotions/flash-sale" element={<FlashSale />} />
        <Route path="promotions/featured" element={<FeaturedProducts />} />

        {/* Comms */}
        <Route path="comms/notifications" element={<Notifications />} />

        {/* Content */}
        <Route path="content/reviews" element={<ReviewModeration />} />
        <Route path="content/qna" element={<QnAModeration />} />
        <Route path="content/legal" element={<LegalPolicies />} />
        
        {/* Partners */}
        <Route path="vendors/all" element={<VendorList />} />
        <Route path="vendors/:vendorId" element={<SellerDetail />} />
        <Route path="vendors/approval" element={<VendorApproval />} />
        <Route path="delivery/all" element={<AllDeliveries />} />
        <Route path="delivery/approval" element={<DeliveryApproval />} />
        
        {/* Finance */}
        <Route path="finance/earnings" element={<PlatformEarnings />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="finance/rules" element={<Rules />} />
        <Route path="finance/tax" element={<TaxConfig />} />
        <Route path="finance/delivery-charges" element={<DeliveryCharges />} />

        {/* Reports */}
        <Route path="reports/sales" element={<SalesReport />} />
        <Route path="reports/sellers" element={<SellerReport />} />
        <Route path="reports/users" element={<UserReport />} />
        <Route path="reports/orders" element={<OrderReport />} />
        <Route path="reports/inventory" element={<InventoryReport />} />
        <Route path="reports/refunds" element={<RefundReport />} />
        
        {/* System */}
        <Route path="system/sub-admins" element={<SubAdmins />} />
        <Route path="system/audit-logs" element={<AuditLogs />} />
        <Route path="system/roles" element={<RoleManagement />} />
        <Route path="settings" element={<Settings />} />
        
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
