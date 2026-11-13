import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import lazyWithRetry from '../../../shared/utils/lazyWithRetry';
import PageLoader from '../../../shared/components/PageLoader';

// Eager: shell + landing/auth entry points that every first visit needs.
import VendorLayout from '../layouts/VendorLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import NotFound from '../pages/NotFound';

// Lazy: loaded when the route is visited.
const Products = lazyWithRetry(() => import('../pages/Products'));
const ProductDetail = lazyWithRetry(() => import('../pages/ProductDetail'));
const Cart = lazyWithRetry(() => import('../pages/Cart'));
const Bag = lazyWithRetry(() => import('../pages/Bag'));
const Profile = lazyWithRetry(() => import('../pages/Profile'));
const Wallet = lazyWithRetry(() => import('../pages/Wallet'));
const Menu = lazyWithRetry(() => import('../pages/Menu'));
const Categories = lazyWithRetry(() => import('../pages/Categories'));
const CategoryProducts = lazyWithRetry(() => import('../pages/CategoryProducts'));
const ToysLanding = lazyWithRetry(() => import('../pages/ToysLanding'));
const BeautyLanding = lazyWithRetry(() => import('../pages/BeautyLanding'));
const Checkout = lazyWithRetry(() => import('../pages/Checkout'));
const OrderConfirmation = lazyWithRetry(() => import('../pages/OrderConfirmation'));
const AllOffers = lazyWithRetry(() => import('../pages/AllOffers'));
const SectionProducts = lazyWithRetry(() => import('../pages/SectionProducts'));
const DealsPage = lazyWithRetry(() => import('../pages/DealsPage'));
const Search = lazyWithRetry(() => import('../pages/Search'));
const ContinueShopping = lazyWithRetry(() => import('../pages/ContinueShopping'));
const TermsOfUse = lazyWithRetry(() => import('../pages/TermsOfUse'));
const LegalPrivacy = lazyWithRetry(() => import('../pages/LegalPrivacy'));
const CancellationReturns = lazyWithRetry(() => import('../pages/CancellationReturns'));
const ShippingPolicy = lazyWithRetry(() => import('../pages/ShippingPolicy'));
const QuickShop = lazyWithRetry(() => import('../pages/QuickShop'));
const QuickShopSubcategory = lazyWithRetry(() => import('../pages/QuickShopSubcategory'));
const Mithilak = lazyWithRetry(() => import('../pages/Mithilak'));
const CategoryLanding = lazyWithRetry(() => import('../pages/CategoryLanding'));

// Profile Sub-pages
const EditProfile = lazyWithRetry(() => import('../pages/profile/EditProfile'));
const MyOrders = lazyWithRetry(() => import('../pages/profile/MyOrders'));
const Wishlist = lazyWithRetry(() => import('../pages/profile/Wishlist'));
const BuyAgain = lazyWithRetry(() => import('../pages/profile/BuyAgain'));
const Coupons = lazyWithRetry(() => import('../pages/profile/Coupons'));
const HelpCenter = lazyWithRetry(() => import('../pages/profile/HelpCenter'));
const SavedAddresses = lazyWithRetry(() => import('../pages/profile/SavedAddresses'));
const SavedCards = lazyWithRetry(() => import('../pages/profile/SavedCards'));
const NotificationSettings = lazyWithRetry(() => import('../pages/profile/NotificationSettings'));
const MyReviews = lazyWithRetry(() => import('../pages/profile/MyReviews'));
const QuestionsAnswers = lazyWithRetry(() => import('../pages/profile/QuestionsAnswers'));
const OrderDetail = lazyWithRetry(() => import('../pages/profile/OrderDetail'));

const ForgotPassword = lazyWithRetry(() => import('../pages/ForgotPassword'));
const Maintenance = lazyWithRetry(() => import('../pages/Maintenance'));
const ErrorPage = lazyWithRetry(() => import('../pages/ErrorPage'));


const MarketRoutes = () => {
  return (
    // Routes outside VendorLayout suspend here; layout routes suspend inside
    // VendorLayout's <Outlet /> so the header/nav stay on screen.
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Auth routes without layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<LegalPrivacy />} />
      <Route path="/cancellation-returns" element={<CancellationReturns />} />
      <Route path="/shipping" element={<ShippingPolicy />} />
      <Route path="/vendor/terms" element={<TermsOfUse />} />
      <Route path="/vendor/privacy" element={<LegalPrivacy />} />
      <Route path="/vendor/cancellation-returns" element={<CancellationReturns />} />
      <Route path="/vendor/shipping" element={<ShippingPolicy />} />

      {/* Pages with layout */}
      <Route element={<VendorLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product-detail" element={<ProductDetail />} />
        <Route path="/product-detail/:id" element={<ProductDetail />} />
        <Route path="product-detail" element={<ProductDetail />} />
        <Route path="product-detail/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/bag" element={<Bag />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/buy-again" element={<BuyAgain />} />
        <Route path="/profile" element={<Profile />} />

        {/* Profile Sub-routes */}
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/orders" element={<MyOrders />} />
        <Route path="/profile/orders/:orderId" element={<OrderDetail />} />
        <Route path="/profile/wishlist" element={<Wishlist />} />
        <Route path="/profile/coupons" element={<Coupons />} />
        <Route path="/profile/help-center" element={<HelpCenter />} />
        <Route path="/profile/addresses" element={<SavedAddresses />} />
        <Route path="/profile/cards" element={<SavedCards />} />
        <Route path="/profile/notifications" element={<NotificationSettings />} />
        <Route path="/profile/reviews" element={<MyReviews />} />
        <Route path="/profile/questions" element={<QuestionsAnswers />} />

        <Route path="/wallet" element={<Wallet />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/category-products" element={<CategoryProducts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/toys" element={<ToysLanding />} />
        <Route path="/beauty" element={<BeautyLanding />} />
        <Route path="/continue-shopping/:productId" element={<ContinueShopping />} />
        <Route path="/all-offers" element={<AllOffers />} />
        <Route path="/section/:slug" element={<SectionProducts />} />
        <Route path="/quick-shop" element={<QuickShop />} />
        <Route path="/quick-shop/category" element={<QuickShopSubcategory />} />
        <Route path="/mithilak/category" element={<QuickShopSubcategory />} />
        <Route path="/mithilak" element={<Mithilak />} />
        <Route path="/mithilak/c/:categoryId" element={<CategoryLanding />} />
        <Route path="/fresh-grocery" element={<QuickShop />} />
        <Route path="/fresh-grocery/category" element={<QuickShopSubcategory />} />
      </Route>

      {/* Maintenance & Error Pages */}
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/500" element={<ErrorPage />} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="home" replace />} />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
};

export default MarketRoutes;
