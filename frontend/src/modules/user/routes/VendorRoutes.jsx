import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import VendorLayout from '../layouts/VendorLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Bag from '../pages/Bag';
import Profile from '../pages/Profile';
import Wallet from '../pages/Wallet';
import Menu from '../pages/Menu';
import Categories from '../pages/Categories';
import CategoryProducts from '../pages/CategoryProducts';
import ToysLanding from '../pages/ToysLanding';
import BeautyLanding from '../pages/BeautyLanding';
import Checkout from '../pages/Checkout';
import AllOffers from '../pages/AllOffers';
import DealsPage from '../pages/DealsPage';
import Search from '../pages/Search';
import ContinueShopping from '../pages/ContinueShopping';
import TermsOfUse from '../pages/TermsOfUse';
import LegalPrivacy from '../pages/LegalPrivacy';
import CancellationReturns from '../pages/CancellationReturns';
import ShippingPolicy from '../pages/ShippingPolicy';


// Profile Sub-pages
import EditProfile from '../pages/profile/EditProfile';
import MyOrders from '../pages/profile/MyOrders';
import Wishlist from '../pages/profile/Wishlist';
import Coupons from '../pages/profile/Coupons';
import HelpCenter from '../pages/profile/HelpCenter';
import SavedAddresses from '../pages/profile/SavedAddresses';
import SavedCards from '../pages/profile/SavedCards';
import NotificationSettings from '../pages/profile/NotificationSettings';
import MyReviews from '../pages/profile/MyReviews';
import QuestionsAnswers from '../pages/profile/QuestionsAnswers';
import OrderDetail from '../pages/profile/OrderDetail';

const VendorRoutes = () => {
  return (
    <Routes>
      {/* Auth routes without layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<LegalPrivacy />} />
      <Route path="/cancellation-returns" element={<CancellationReturns />} />
      <Route path="/shipping" element={<ShippingPolicy />} />

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

      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="home" replace />} />
    </Routes>
  );
};

export default VendorRoutes;
